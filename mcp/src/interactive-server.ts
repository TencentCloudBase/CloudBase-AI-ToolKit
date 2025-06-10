import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';
import { debug, info, warn, error, getLogs, getLoggerStatus, clearLogs } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface InteractiveResult {
  type: 'envId' | 'clarification' | 'confirmation';
  data: any;
  cancelled?: boolean;
}

export class InteractiveServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number = 0;
  private isRunning: boolean = false;
  private currentResolver: ((result: InteractiveResult) => void) | null = null;
  private sessionData: Map<string, any> = new Map();
  
  // 固定端口配置
  private readonly DEFAULT_PORT = 3721;
  private readonly FALLBACK_PORTS = [3722, 3723, 3724, 3725];

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../static')));

    // 环境ID收集页面
    this.app.get('/env-setup/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const sessionData = this.sessionData.get(sessionId);
      
      if (!sessionData) {
        res.status(404).send('会话不存在或已过期');
        return;
      }
      
      res.send(this.getEnvSetupHTML(sessionData.envs));
    });

    // 需求澄清页面
    this.app.get('/clarification/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const sessionData = this.sessionData.get(sessionId);
      
      if (!sessionData) {
        res.status(404).send('会话不存在或已过期');
        return;
      }
      
      res.send(this.getClarificationHTML(sessionData.message, sessionData.options));
    });

    // 日志查看页面
    this.app.get('/debug/logs', async (req, res) => {
      try {
        const logs = await getLogs(1000);
        const status = getLoggerStatus();
        res.send(this.getLogsHTML(logs, status));
      } catch (err) {
        res.status(500).send('获取日志失败');
      }
    });

    // 日志API
    this.app.get('/api/logs', async (req, res) => {
      try {
        const maxLines = parseInt(req.query.maxLines as string) || 1000;
        const logs = await getLogs(maxLines);
        const status = getLoggerStatus();
        res.json({ logs, status, success: true });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to get logs' });
      }
    });

    this.app.post('/api/logs/clear', async (req, res) => {
      try {
        await clearLogs();
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to clear logs' });
      }
    });

    // API接口
    this.app.post('/api/submit', (req, res) => {
      const { type, data } = req.body;
      debug('Received submit request', { type, data });
      
      if (this.currentResolver) {
        info('Resolving with user data');
        this.currentResolver({ type, data });
        this.currentResolver = null;
      } else {
        warn('No resolver waiting for response');
      }
      
      res.json({ success: true });
    });

    this.app.post('/api/cancel', (req, res) => {
      info('Received cancel request');
      
      if (this.currentResolver) {
        info('Resolving with cancelled status');
        this.currentResolver({ type: 'clarification', data: null, cancelled: true });
        this.currentResolver = null;
      } else {
        warn('No resolver waiting for cancellation');
      }
      
      res.json({ success: true });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      debug('WebSocket client connected');
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          debug('WebSocket message received', data);
          
          if (this.currentResolver) {
            this.currentResolver(data);
            this.currentResolver = null;
          }
        } catch (err) {
          error('WebSocket message parsing error', err);
        }
      });

      ws.on('close', () => {
        debug('WebSocket client disconnected');
      });
    });
  }

  async start(): Promise<number> {
    if (this.isRunning) {
      debug(`Interactive server already running on port ${this.port}`);
      return this.port;
    }

    return new Promise((resolve, reject) => {
      info('Starting interactive server...');
      
      const tryPorts = [this.DEFAULT_PORT, ...this.FALLBACK_PORTS];
      let currentIndex = 0;
      
      const tryNextPort = () => {
        if (currentIndex >= tryPorts.length) {
          const err = new Error('All ports are in use, failed to start server');
          error('Server start failed', err);
          reject(err);
          return;
        }
        
        const portToTry = tryPorts[currentIndex];
        currentIndex++;
        
        debug(`Trying to start server on port ${portToTry}`);
        
        // 清除之前的错误监听器
        this.server.removeAllListeners('error');
        
        this.server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            warn(`Port ${portToTry} is in use, trying next port...`);
            tryNextPort();
          } else {
            error('Server error', err);
            reject(err);
          }
        });

        this.server.listen(portToTry, '127.0.0.1', () => {
          const address = this.server.address();
          if (address && typeof address === 'object') {
            this.port = address.port;
            this.isRunning = true;
            info(`Interactive server started successfully on http://localhost:${this.port}`);
            resolve(this.port);
          } else {
            const err = new Error('Failed to get server address');
            error('Server start error', err);
            reject(err);
          }
        });
      };
      
      tryNextPort();
    });
  }

  async stop() {
    if (!this.isRunning) return;

    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }

  async collectEnvId(availableEnvs: any[]): Promise<InteractiveResult> {
    try {
      info('Starting environment ID collection...');
      debug(`Available environments: ${availableEnvs.length}`);
      
      const port = await this.start();
      
      const sessionId = Math.random().toString(36).substring(2, 15);
      this.sessionData.set(sessionId, { envs: availableEnvs });
      debug(`Created session: ${sessionId}`);
      
      setTimeout(() => {
        this.sessionData.delete(sessionId);
        debug(`Session ${sessionId} expired`);
      }, 5 * 60 * 1000);
      
      const url = `http://localhost:${port}/env-setup/${sessionId}`;
      info(`Opening browser: ${url}`);
      
      try {
        // 使用默认浏览器打开一个新窗口
        await open(url, { wait: false });
        info('Browser opened successfully');
      } catch (browserError) {
        error('Failed to open browser', browserError);
        warn(`Please manually open: ${url}`);
      }

      info('Waiting for user selection...');
      
      return new Promise((resolve) => {
        this.currentResolver = resolve;
        
        setTimeout(() => {
          if (this.currentResolver === resolve) {
            warn('Request timeout, resolving with cancelled');
            this.currentResolver = null;
            resolve({ type: 'envId', data: null, cancelled: true });
          }
        }, 10 * 60 * 1000);
      });
    } catch (err) {
      error('Error in collectEnvId', err);
      throw err;
    }
  }

  async clarifyRequest(message: string, options?: string[]): Promise<InteractiveResult> {
    const port = await this.start();
    
    // 生成会话ID并存储数据
    const sessionId = Math.random().toString(36).substring(2, 15);
    this.sessionData.set(sessionId, { message, options });
    
    // 设置会话过期时间（5分钟）
    setTimeout(() => {
      this.sessionData.delete(sessionId);
    }, 5 * 60 * 1000);
    
    const url = `http://localhost:${port}/clarification/${sessionId}`;
    
    // 打开浏览器
    await open(url);

    return new Promise((resolve) => {
      this.currentResolver = resolve;
    });
  }

  private getEnvSetupHTML(envs?: any[]): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBase AI Toolkit - 环境配置</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #4F46E5;
            --primary-hover: #4338CA;
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --border-color: #E5E7EB;
            --bg-secondary: #F9FAFB;
            --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
        }
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .modal {
            background: white;
            border-radius: 16px;
            box-shadow: var(--shadow);
            width: 100%;
            max-width: 500px;
            overflow: hidden;
            animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .header {
            background: var(--primary-color);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            width: 28px;
            height: 28px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        .title {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .github-link {
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            opacity: 0.9;
            transition: opacity 0.2s;
            padding: 6px 10px;
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
        }
        .github-link:hover {
            opacity: 1;
            background: rgba(255,255,255,0.2);
        }
        .content {
            padding: 32px 24px;
        }
        .content-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }
        .content-subtitle {
            color: var(--text-secondary);
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .env-list {
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 24px;
            max-height: 300px;
            overflow-y: auto;
        }
        .env-item {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .env-item:last-child {
            border-bottom: none;
        }
        .env-item:hover {
            background: var(--bg-secondary);
        }
        .env-item.selected {
            background: #EEF2FF;
            border-left: 4px solid var(--primary-color);
        }
        .env-icon {
            width: 20px;
            height: 20px;
            color: var(--primary-color);
            flex-shrink: 0;
        }
        .env-info {
            flex: 1;
            min-width: 0;
        }
        .env-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        .env-id {
            font-size: 13px;
            color: var(--text-secondary);
            font-family: var(--font-mono);
            background: var(--bg-secondary);
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        .actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
        }
        .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        .btn-secondary:hover {
            background: #F3F4F6;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .loading {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 14px;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <div class="header-left">
                <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z"/>
                    <path d="M12 22V12"/>
                    <path d="M22 7L12 12L2 7"/>
                </svg>
                <span class="title">CloudBase AI Toolkit</span>
            </div>
            <a href="https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" target="_blank" class="github-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
            </a>
        </div>
        
        <div class="content">
            <h1 class="content-title">选择云开发环境</h1>
            <p class="content-subtitle">请选择要使用的云开发环境，系统将自动配置环境ID</p>
            
            <div class="env-list" id="envList">
                <!-- 环境列表将通过JavaScript动态加载 -->
            </div>
            
            <div class="actions">
                <button class="btn btn-secondary" onclick="cancel()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    取消
                </button>
                <button class="btn btn-primary" id="confirmBtn" onclick="confirm()" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    确认选择
                </button>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <span>正在配置环境...</span>
            </div>
        </div>
    </div>

    <script>
        let selectedEnvId = null;
        const envs = ${JSON.stringify(envs || [])};
        
        function renderEnvList() {
            const envList = document.getElementById('envList');
            if (envs.length === 0) {
                envList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-secondary);">暂无可用环境</div>';
                return;
            }
            
            envList.innerHTML = envs.map((env, index) => \`
                <div class="env-item" onclick="selectEnv('\${env.EnvId}')">
                    <svg class="env-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <div class="env-info">
                        <div class="env-name">\${env.Alias || env.EnvId}</div>
                        <div class="env-id">\${env.EnvId}</div>
                    </div>
                </div>
            \`).join('');
        }
        
        function selectEnv(envId) {
            selectedEnvId = envId;
            document.querySelectorAll('.env-item').forEach(item => {
                item.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            document.getElementById('confirmBtn').disabled = false;
        }
        
        function confirm() {
            if (!selectedEnvId) return;
            document.getElementById('loading').style.display = 'flex';
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'envId',
                    data: { envId: selectedEnvId }
                })
            }).then(() => window.close());
        }
        
        function cancel() {
            fetch('/api/cancel', { method: 'POST' }).then(() => window.close());
        }
        
        renderEnvList();
        if (envs.length === 1) {
            selectEnv(envs[0].EnvId);
        }
    </script>
</body>
</html>`;
  }

  private getLogsHTML(logs: string[], status: any): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBase MCP 调试日志</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            color: white;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: 700;
        }
        .status {
            background: #f7fafc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-label {
            font-weight: 600;
            color: #4a5568;
        }
        .status-value {
            color: #2d3748;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
        }
        .enabled {
            color: #38a169;
        }
        .disabled {
            color: #e53e3e;
        }
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        .controls-left {
            display: flex;
            gap: 15px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a67d8;
        }
        .btn-danger {
            background: #e53e3e;
            color: white;
        }
        .btn-danger:hover {
            background: #c53030;
        }
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        .log-container {
            background: #1a202c;
            border-radius: 12px;
            padding: 20px;
            height: 500px;
            overflow-y: auto;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.4;
        }
        .log-container::-webkit-scrollbar {
            width: 8px;
        }
        .log-container::-webkit-scrollbar-track {
            background: #2d3748;
            border-radius: 4px;
        }
        .log-container::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-radius: 4px;
        }
        .log-container::-webkit-scrollbar-thumb:hover {
            background: #718096;
        }
        .log-line {
            color: #e2e8f0;
            margin-bottom: 2px;
            word-break: break-all;
        }
        .log-line.debug {
            color: #a0aec0;
        }
        .log-line.info {
            color: #63b3ed;
        }
        .log-line.warn {
            color: #f6ad55;
        }
        .log-line.error {
            color: #fc8181;
        }
        .timestamp {
            color: #718096;
        }
        .level {
            font-weight: bold;
            margin: 0 8px;
        }
        .empty-state {
            text-align: center;
            color: #718096;
            padding: 40px;
            font-style: italic;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .footer .brand {
            font-size: 16px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .footer .links {
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .footer .links a {
            color: #718096;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
        }
        .footer .links a:hover {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🔍</div>
            <h1>CloudBase MCP 调试日志</h1>
            <p style="color: #718096;">实时查看 MCP 服务器运行日志</p>
        </div>
        
        <div class="status">
            <div class="status-item">
                <span class="status-label">日志状态:</span>
                <span class="status-value ${status.enabled ? 'enabled' : 'disabled'}">
                    ${status.enabled ? '启用' : '禁用'}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">日志级别:</span>
                <span class="status-value">${status.level}</span>
            </div>
            <div class="status-item">
                <span class="status-label">日志文件:</span>
                <span class="status-value">${status.logFile || '无'}</span>
            </div>
            <div class="status-item">
                <span class="status-label">控制台输出:</span>
                <span class="status-value ${status.useConsole ? 'enabled' : 'disabled'}">
                    ${status.useConsole ? '启用' : '禁用'}
                </span>
            </div>
        </div>
        
        <div class="controls">
            <div class="controls-left">
                <button class="btn btn-primary" onclick="refreshLogs()">刷新日志</button>
                <button class="btn btn-danger" onclick="clearLogs()">清空日志</button>
                <button class="btn btn-secondary" onclick="window.close()">关闭</button>
            </div>
            <div>
                <span style="color: #718096; font-size: 14px;">共 ${logs.length} 条日志</span>
            </div>
        </div>
        
        <div class="log-container" id="logContainer">
            ${logs.length > 0 ? logs.map(line => {
                const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
                if (match) {
                    const [, timestamp, level, message] = match;
                    const levelClass = level.toLowerCase();
                    return `<div class="log-line ${levelClass}"><span class="timestamp">[${timestamp}]</span><span class="level ${levelClass}">[${level}]</span>${message}</div>`;
                }
                return `<div class="log-line">${line}</div>`;
            }).join('') : '<div class="empty-state">暂无日志记录</div>'}
        </div>
        
        <div class="footer">
            <p class="brand">CloudBase AI ToolKit</p>
            <div class="links">
                <a href="https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" target="_blank">GitHub</a>
                <a href="https://tcb.cloud.tencent.com/dev" target="_blank">控制台</a>
            </div>
        </div>
    </div>

    <script>
        function refreshLogs() {
            fetch('/api/logs')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    }
                })
                .catch(error => {
                    alert('刷新日志失败: ' + error.message);
                });
        }
        
        function clearLogs() {
            if (confirm('确定要清空所有日志吗？此操作不可恢复。')) {
                fetch('/api/logs/clear', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            location.reload();
                        } else {
                            alert('清空日志失败');
                        }
                    })
                    .catch(error => {
                        alert('清空日志失败: ' + error.message);
                    });
            }
        }
        
        // 自动滚动到底部
        const logContainer = document.getElementById('logContainer');
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // 每5秒自动刷新
        setInterval(() => {
            const isAtBottom = logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + 1;
            
            fetch('/api/logs')
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.logs.length > 0) {
                        const newContent = data.logs.map(line => {
                            const match = line.match(/\\[(.*?)\\] \\[(.*?)\\] (.*)/);
                            if (match) {
                                const [, timestamp, level, message] = match;
                                const levelClass = level.toLowerCase();
                                return \`<div class="log-line \${levelClass}"><span class="timestamp">[\${timestamp}]</span><span class="level \${levelClass}">[\${level}]</span>\${message}</div>\`;
                            }
                            return \`<div class="log-line">\${line}</div>\`;
                        }).join('');
                        
                        logContainer.innerHTML = newContent || '<div class="empty-state">暂无日志记录</div>';
                        
                        if (isAtBottom) {
                            logContainer.scrollTop = logContainer.scrollHeight;
                        }
                    }
                })
                .catch(error => {
                    console.error('获取日志失败:', error);
                });
        }, 5000);
    </script>
</body>
</html>`;
  }

  private getClarificationHTML(message: string, options?: string[]): string {
    const optionsArray = options || null;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBase AI Toolkit - 需求澄清</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #4F46E5;
            --primary-hover: #4338CA;
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --border-color: #E5E7EB;
            --bg-secondary: #F9FAFB;
            --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
        }
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .modal {
            background: white;
            border-radius: 16px;
            box-shadow: var(--shadow);
            width: 100%;
            max-width: 600px;
            overflow: hidden;
            animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .header {
            background: var(--primary-color);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            width: 28px;
            height: 28px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        .title {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .github-link {
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            opacity: 0.9;
            transition: opacity 0.2s;
            padding: 6px 10px;
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
        }
        .github-link:hover {
            opacity: 1;
            background: rgba(255,255,255,0.2);
        }
        .content {
            padding: 32px 24px;
        }
        .content-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }
        .message {
            background: #EEF2FF;
            border: 1px solid #C7D2FE;
            border-left: 4px solid var(--primary-color);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary);
        }
        .options {
            margin-bottom: 24px;
        }
        .option-item {
            padding: 16px 20px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .option-item:hover {
            background: var(--bg-secondary);
            border-color: var(--primary-color);
        }
        .option-item.selected {
            background: #EEF2FF;
            border-color: var(--primary-color);
        }
        .option-icon {
            width: 20px;
            height: 20px;
            color: var(--primary-color);
            flex-shrink: 0;
        }
        .custom-input {
            margin-bottom: 24px;
        }
        .custom-input textarea {
            width: 100%;
            min-height: 120px;
            padding: 16px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            font-size: 15px;
            font-family: var(--font-mono);
            resize: vertical;
            transition: all 0.2s;
            line-height: 1.5;
        }
        .custom-input textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
        }
        .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
        }
        .btn-secondary:hover {
            background: #F3F4F6;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .loading {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 14px;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <div class="header-left">
                <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z"/>
                    <path d="M12 22V12"/>
                    <path d="M22 7L12 12L2 7"/>
                </svg>
                <span class="title">CloudBase AI Toolkit</span>
            </div>
            <a href="https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" target="_blank" class="github-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
            </a>
        </div>

        <div class="content">
            <h1 class="content-title">需求澄清</h1>
            <div class="message">${message}</div>
            
            ${optionsArray ? `
            <div class="options" id="options">
                ${optionsArray.map((option: string, index: number) => `
                    <div class="option-item" onclick="selectOption('${option}')">
                        <svg class="option-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                        </svg>
                        ${option}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="custom-input">
                <textarea id="customInput" placeholder="请输入您的具体需求或建议..." onkeyup="updateSubmitButton()"></textarea>
            </div>
            
            <div class="actions">
                <button class="btn btn-secondary" onclick="cancel()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    取消
                </button>
                <button class="btn btn-primary" id="submitBtn" onclick="submit()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    提交反馈
                </button>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <span>正在提交...</span>
            </div>
        </div>
    </div>

    <script>
        let selectedOption = null;
        
        function selectOption(option) {
            selectedOption = option;
            
            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            
            document.getElementById('customInput').value = option;
            updateSubmitButton();
        }
        
        function updateSubmitButton() {
            const customInput = document.getElementById('customInput').value.trim();
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = !customInput;
        }
        
        function submit() {
            const customInput = document.getElementById('customInput').value.trim();
            
            if (!customInput) {
                alert('请输入反馈内容');
                return;
            }
            
            document.getElementById('loading').style.display = 'flex';
            
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'clarification',
                    data: { response: customInput }
                })
            }).then(() => window.close());
        }
        
        function cancel() {
            fetch('/api/cancel', { method: 'POST' }).then(() => window.close());
        }
        
        updateSubmitButton();
    </script>
</body>
</html>`;
  }

  private getConfirmationHTML(message: string, risks?: string[], options?: string[]): string {
    const confirmOptions = options || ["确认执行", "取消操作", "需要修改"];
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBase AI Toolkit - 操作确认</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #4F46E5;
            --primary-hover: #4338CA;
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --border-color: #E5E7EB;
            --bg-secondary: #F9FAFB;
            --warning-color: #DC2626;
            --warning-bg: #FEF2F2;
            --warning-border: #FECACA;
            --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
        }
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .modal {
            background: white;
            border-radius: 16px;
            box-shadow: var(--shadow);
            width: 100%;
            max-width: 600px;
            overflow: hidden;
            animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .header {
            background: var(--primary-color);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            width: 28px;
            height: 28px;
            animation: pulse 2s infinite;
        }
        .title {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .github-link {
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            opacity: 0.9;
            transition: opacity 0.2s;
            padding: 6px 10px;
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
        }
        .github-link:hover {
            opacity: 1;
            background: rgba(255,255,255,0.2);
        }
        .content {
            padding: 32px 24px;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        .title {
            font-size: 20px;
            margin-bottom: 16px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
        }
        .title:after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 40px;
            height: 3px;
            background: var(--primary-color);
            border-radius: 2px;
        }
        .message {
            background: var(--bg-secondary);
            border-left: 3px solid var(--primary-color);
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary);
        }
        .risks {
            background: var(--warning-bg);
            border: 1px solid var(--warning-color);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .risks-title {
            color: var(--warning-color);
            font-weight: 500;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .risk-item {
            color: var(--text-primary);
            margin-bottom: 8px;
            padding-left: 24px;
            position: relative;
        }
        .risk-item:before {
            content: "•";
            position: absolute;
            left: 8px;
            color: var(--warning-color);
        }
        .options {
            margin-bottom: 24px;
        }
        .option-item {
            padding: 16px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .option-item:hover {
            background: var(--bg-secondary);
        }
        .option-item.selected {
            background: rgba(0, 82, 217, 0.1);
            border-color: var(--primary-color);
        }
        .button-group {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .btn-primary {
            background: var(--primary-color);
            color: white;
            box-shadow: 0 4px 12px rgba(0,82,217,0.2);
        }
        .btn-primary:hover {
            background: var(--hover-color);
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0,82,217,0.3);
        }
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
        }
        .btn-secondary:hover {
            background: #E0E0E0;
            transform: translateY(-1px);
        }
        .btn-warning {
            background: var(--warning-color);
            color: white;
        }
        .btn-warning:hover {
            background: #FF7875;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .loading {
            display: none;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 14px;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <div class="header-left">
                <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z"/>
                    <path d="M12 22V12"/>
                    <path d="M22 7L12 12L2 7"/>
                </svg>
                <span class="title">CloudBase AI Toolkit</span>
            </div>
            <a href="https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" target="_blank" class="github-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
            </a>
        </div>

            <div class="content">
                <h1 class="content-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                        <path d="M12 16V12"/>
                        <path d="M12 8H12.01"/>
                    </svg>
                    操作确认
                </h1>
                
                <div class="message">${message}</div>
                
                ${risks && risks.length > 0 ? `
                <div class="risks">
                    <div class="risks-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <path d="M12 9v4"/>
                            <path d="M12 17h.01"/>
                        </svg>
                        风险提示
                    </div>
                    ${risks.map(risk => `<div class="risk-item">${risk}</div>`).join('')}
                </div>
                ` : ''}
                
                <div class="options">
                    ${confirmOptions.map((option, index) => {
                        const className = option.includes('确认') ? 'confirm' : option.includes('取消') ? 'cancel' : '';
                        const iconPath = option.includes('确认') ? 
                            '<path d="M20 6L9 17l-5-5"/>' :
                            option.includes('取消') ? 
                                '<path d="M18 6L6 18M6 6l12 12"/>' :
                                '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
                        
                        return `
                            <div class="option-item ${className}" onclick="selectOption('${option}')">
                                <svg class="option-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${iconPath}
                                </svg>
                                ${option}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <span>正在处理...</span>
                </div>
            </div>
        </div>

    <script>
        let selectedOption = null;
        
        function selectOption(option) {
            selectedOption = option;
            
            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');
            
            if (option.includes('确认')) {
                submit();
            } else if (option.includes('取消')) {
                cancel();
            } else {
                // 需要修改的情况
                cancel();
            }
        }
        
        function submit() {
            document.getElementById('loading').style.display = 'flex';
            
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'confirmation',
                    data: { response: selectedOption || '确认执行' }
                })
            }).then(() => window.close());
        }
        
        function cancel() {
            fetch('/api/cancel', { method: 'POST' }).then(() => window.close());
        }
    </script>
</body>
</html>`;
  }
}

// 单例实例
let interactiveServerInstance: InteractiveServer | null = null;

export function getInteractiveServer(): InteractiveServer {
  if (!interactiveServerInstance) {
    interactiveServerInstance = new InteractiveServer();
  }
  return interactiveServerInstance;
}