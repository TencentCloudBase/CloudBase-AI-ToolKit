import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import open from 'open';
import { debug, info, warn, error, getLogs, getLoggerStatus, clearLogs } from './utils/logger.js';

// 动态导入 open 模块，兼容 ESM/CJS 环境
async function openUrl(url: string, options?: any, server?: any) {
  // 检查是否为 CodeBuddy IDE
  if (process.env.INTEGRATION_IDE === 'CodeBuddy' && server) {
    try {
      // 发送通知而不是直接打开网页
      server.server.sendLoggingMessage({ 
        level: "notice", 
        data: {
          "type": "tcb",
          "url": url
        }
      });
      info(`CodeBuddy IDE: 已发送网页打开通知 - ${url}`);
      return;
    } catch (err) {
      error(`Failed to send logging message for ${url}: ${err instanceof Error ? err.message : err}`, err);
      // 如果发送通知失败，回退到直接打开
      warn(`回退到直接打开网页: ${url}`);
    }
  }
  
  // 默认行为：直接打开网页
  try { 
    return await open(url, options);
  } catch (err) {
    error(`Failed to open ${url} ${options} ${err instanceof Error ? err.message : err} `, err);
    warn(`Please manually open: ${url}`);
  }
}

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
  private _mcpServer: any = null; // 保存 MCP server 实例引用
  
  // 公共 getter 和 setter
  get mcpServer(): any {
    return this._mcpServer;
  }
  
  set mcpServer(server: any) {
    this._mcpServer = server;
  }
  
  private readonly DEFAULT_PORT = 3721;
  private readonly FALLBACK_PORTS = [3722, 3723, 3724, 3725, 3726, 3727, 3728, 3729, 3730, 3731, 3732, 3733, 3734, 3735];

  constructor(mcpServer?: any) {
    this._mcpServer = mcpServer;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupExpress();
    this.setupWebSocket();
    
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private cleanup() {
    if (this.isRunning) {
      debug('Cleaning up interactive server resources...');
      this.server.close();
      this.wss.close();
      this.isRunning = false;
    }
  }

  private setupExpress() {
    this.app.use(express.json());
    
    this.app.get('/env-setup/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const sessionData = this.sessionData.get(sessionId);
      
      if (!sessionData) {
        res.status(404).send('会话不存在或已过期');
        return;
      }
      
      res.send(this.getEnvSetupHTML(sessionData.envs));
    });

    this.app.get('/clarification/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const sessionData = this.sessionData.get(sessionId);
      
      if (!sessionData) {
        res.status(404).send('会话不存在或已过期');
        return;
      }
      
      res.send(this.getClarificationHTML(sessionData.message, sessionData.options));
    });

    this.app.get('/debug/logs', async (req, res) => {
      try {
        const logs = await getLogs(1000);
        const status = getLoggerStatus();
        res.send(this.getLogsHTML(logs, status));
      } catch (err) {
        res.status(500).send('获取日志失败');
      }
    });

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
          const err = new Error(`All ${tryPorts.length} ports are in use (${tryPorts.join(', ')}), failed to start server`);
          error('Server start failed', err);
          reject(err);
          return;
        }
        
        const portToTry = tryPorts[currentIndex];
        currentIndex++;
        
        debug(`Trying to start server on port ${portToTry} (attempt ${currentIndex}/${tryPorts.length})`);
        
        tryPort(portToTry);
      };
      
      const tryPort = (portToTry: number) => {
        // 清除之前的所有监听器
        this.server.removeAllListeners('error');
        this.server.removeAllListeners('listening');
        
        // 设置错误处理
        const errorHandler = (err: any) => {
          if (err.code === 'EADDRINUSE') {
            warn(`Port ${portToTry} is in use, trying next port...`);
            // 清理当前尝试
            this.server.removeAllListeners('error');
            this.server.removeAllListeners('listening');
            tryNextPort();
          } else {
            error('Server error', err);
            reject(err);
          }
        };
        
        // 设置成功监听处理
        const listeningHandler = () => {
          const address = this.server.address();
          if (address && typeof address === 'object') {
            this.port = address.port;
            this.isRunning = true;
            info(`Interactive server started successfully on http://localhost:${this.port}`);
            // 移除临时监听器
            this.server.removeListener('error', errorHandler);
            this.server.removeListener('listening', listeningHandler);
            resolve(this.port);
          } else {
            const err = new Error('Failed to get server address');
            error('Server start error', err);
            reject(err);
          }
        };
        
        this.server.once('error', errorHandler);
        this.server.once('listening', listeningHandler);

        try {
          this.server.listen(portToTry, '127.0.0.1');
        } catch (err) {
          error(`Failed to bind to port ${portToTry}:`, err);
          tryNextPort();
        }
      };
      
      tryNextPort();
    });
  }

  async stop() {
    if (!this.isRunning) {
      debug('Interactive server is not running, nothing to stop');
      return;
    }

    info('Stopping interactive server...');
    
    return new Promise<void>((resolve, reject) => {
      // 设置超时，防止无限等待
      const timeout = setTimeout(() => {
        warn('Server close timeout, forcing cleanup');
        this.isRunning = false;
        this.port = 0;
        resolve();
      }, 30000);
      
      try {
        // 首先关闭WebSocket服务器
        this.wss.close(() => {
          debug('WebSocket server closed');
        });
        
        // 然后关闭HTTP服务器
        this.server.close((err) => {
          clearTimeout(timeout);
          if (err) {
            error('Error closing server:', err);
            reject(err);
          } else {
            info('Interactive server stopped successfully');
            this.isRunning = false;
            this.port = 0;
            resolve();
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        error('Error stopping server:', err);
        this.isRunning = false;
        this.port = 0;
        reject(err);
      }
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
        await openUrl(url, { wait: false }, this._mcpServer);
        info('Browser opened successfully');
      } catch (browserError) {
        error('Failed to open browser', browserError);
        warn(`Please manually open: ${url}`);
      }

      info('Waiting for user selection...');
      
      return new Promise((resolve) => {
        this.currentResolver = (result) => {
          // 用户选择完成后，关闭服务器
          this.stop().catch(err => {
            debug('Error stopping server after user selection:', err);
          });
          resolve(result);
        };
        
        setTimeout(() => {
          if (this.currentResolver) {
            warn('Request timeout, resolving with cancelled');
            this.currentResolver = null;
            // 超时后也关闭服务器
            this.stop().catch(err => {
              debug('Error stopping server after timeout:', err);
            });
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
    await openUrl(url, undefined, this._mcpServer);

    return new Promise((resolve) => {
      this.currentResolver = (result) => {
        // 用户选择完成后，关闭服务器
        this.stop().catch(err => {
          debug('Error stopping server after user selection:', err);
        });
        resolve(result);
      };
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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #1a1a1a;
            --primary-hover: #000000;
            --accent-color: #67E9E9;
            --accent-hover: #2BCCCC;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: rgba(255, 255, 255, 0.15);
            --bg-secondary: rgba(255, 255, 255, 0.08);
            --bg-glass: rgba(26, 26, 26, 0.95);
            --shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.2);
            --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
            --header-bg: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d1117 100%);
        }
        
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
        }
        
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
            pointer-events: none;
            z-index: -1;
        }
        
        body::after {
            content: '';
            position: fixed;
            top: 50%; left: 50%;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(103, 233, 233, 0.05) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: -1;
            animation: pulse 8s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .modal {
            background: var(--bg-glass);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: var(--shadow);
            border: 2px solid var(--border-color);
            width: 100%;
            max-width: 520px;
            overflow: hidden;
            animation: modalIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .modal::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%);
            animation: shimmer 3s infinite;
            pointer-events: none;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .header {
            background: var(--header-bg);
            color: var(--text-primary);
            padding: 24px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
            animation: headerShimmer 4s infinite;
            pointer-events: none;
        }
        
        @keyframes headerShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 1;
        }
        
        .logo {
            width: 32px;
            height: 32px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            animation: logoFloat 3s ease-in-out infinite;
        }
        
        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }
        
        .title {
            font-size: 20px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .github-link {
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1;
            transition: all 0.3s ease;
        }
        
        .github-link:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .content {
            padding: 32px 24px;
            position: relative;
        }
        
        .content-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        .content-subtitle {
            color: var(--text-secondary);
            margin-bottom: 24px;
            line-height: 1.5;
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .env-list {
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 24px;
            max-height: 300px;
            overflow-y: auto;
            overflow-x: hidden;
            background: rgba(255, 255, 255, 0.03);
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .env-item {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 14px;
            position: relative;
            overflow: hidden;
            color: var(--text-primary);
        }
        
        .env-item::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 0;
            background: var(--accent-color);
            transition: width 0.3s ease;
        }
        
        .env-item:last-child {
            border-bottom: none;
        }
        
        .env-item:hover {
            background: var(--bg-secondary);
            transform: translateX(5px);
        }
        
        .env-item:hover::before {
            width: 4px;
        }
        
        .env-item.selected {
            background: rgba(103, 233, 233, 0.1);
            border-left: 4px solid var(--accent-color);
            transform: translateX(5px);
        }
        
        .env-icon {
            width: 20px;
            height: 20px;
            color: var(--accent-color);
            flex-shrink: 0;
            animation: iconGlow 2s ease-in-out infinite;
        }
        
        @keyframes iconGlow {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(103, 233, 233, 0.3)); }
            50% { filter: drop-shadow(0 0 8px rgba(103, 233, 233, 0.6)); }
        }
        
        .env-info {
            flex: 1;
        }
        
        .env-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        
        .env-alias {
            color: var(--text-secondary);
            font-size: 14px;
        }
        
        .actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            animation: fadeInUp 0.8s ease-out 0.8s both;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transition: all 0.3s ease;
            transform: translate(-50%, -50%);
        }
        
        .btn:hover::before {
            width: 100px; height: 100px;
        }
        
        .btn-primary {
            background: var(--primary-color);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: var(--text-primary);
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
            border-top: 2px solid var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .success-state {
            text-align: center;
            padding: 40px 20px;
            animation: fadeInUp 0.8s ease-out both;
        }
        
        .success-icon {
            margin-bottom: 20px;
            color: var(--accent-color);
            animation: successPulse 2s ease-in-out infinite;
        }
        
        @keyframes successPulse {
            0%, 100% { 
                transform: scale(1);
                filter: drop-shadow(0 0 8px rgba(103, 233, 233, 0.3));
            }
            50% { 
                transform: scale(1.1);
                filter: drop-shadow(0 0 16px rgba(103, 233, 233, 0.6));
            }
        }
        
        .success-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 12px;
        }
        
        .success-message {
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1.5;
        }
        
        .selected-env-info {
            margin-top: 20px;
            padding: 16px;
            background: rgba(103, 233, 233, 0.1);
            border: 1px solid var(--accent-color);
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .env-label {
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 500;
        }
        
        .env-value {
            color: var(--accent-color);
            font-size: 16px;
            font-weight: 600;
            font-family: var(--font-mono);
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <div class="header-left">
                <img class="logo" src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/cloudbase-logo.svg" alt="CloudBase Logo" />
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
            <p class="content-subtitle">请选择您要使用的云开发环境</p>
            
            <div class="env-list" id="envList">
                ${(envs || []).map((env, index) => `
                    <div class="env-item" onclick="selectEnv('${env.EnvId}', this)" style="animation-delay: ${index * 0.1}s;">
                        <svg class="env-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        <div class="env-info">
                            <div class="env-name">${env.EnvId}</div>
                            <div class="env-alias">${env.Alias || '无别名'}</div>
                        </div>
                    </div>
                `).join('')}
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
            
            <div class="success-state" id="successState" style="display: none;">
                <div class="success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <h2 class="success-title">环境配置成功！</h2>
                <p class="success-message">已成功选择云开发环境</p>
                <div class="selected-env-info">
                    <span class="env-label">环境 ID:</span>
                    <span class="env-value" id="selectedEnvDisplay"></span>
                </div>
            </div>
        </div>
    </div>

    <script>
        let selectedEnvId = null;
        
        function selectEnv(envId, element) {
            console.log('=== 环境选择事件触发 ===');
            console.log('传入的envId:', envId);
            console.log('传入的element:', element);
            console.log('element类名:', element ? element.className : 'null');
            
            selectedEnvId = envId;
            console.log('设置selectedEnvId为:', selectedEnvId);
            
            // Remove selected class from all items
            const allItems = document.querySelectorAll('.env-item');
            console.log('找到的所有环境项数量:', allItems.length);
            allItems.forEach(item => {
                item.classList.remove('selected');
            });
            
            // Add selected class to current item
            if (element) {
                element.classList.add('selected');
                console.log('✅ 已添加selected样式到当前项');
                console.log('当前项的最终类名:', element.className);
            } else {
                console.error('❌ element为空，无法添加选中样式');
            }
            
            // Enable confirm button
            const confirmBtn = document.getElementById('confirmBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                console.log('✅ 确认按钮已启用');
            } else {
                console.error('❌ 找不到确认按钮');
            }
        }
        
        function confirm() {
            console.log('=== CONFIRM BUTTON CLICKED ===');
            console.log('selectedEnvId:', selectedEnvId);
            
            if (!selectedEnvId) {
                console.error('❌ 没有选择环境ID！');
                alert('请先选择一个环境');
                return;
            }
            
            console.log('✅ 环境ID验证通过，开始发送请求...');
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('confirmBtn').disabled = true;
            
            const requestBody = {
                type: 'envId',
                data: selectedEnvId
            };
            
            console.log('📤 发送请求体:', JSON.stringify(requestBody, null, 2));
            
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }).then(response => {
                console.log('📥 收到响应状态:', response.status);
                console.log('📥 响应头:', [...response.headers.entries()]);
                return response.json();
            }).then(data => {
                console.log('📥 响应数据:', data);
                if (data.success) {
                    console.log('✅ 请求成功，展示成功提示');
                    // 隐藏选择区和按钮，仅展示成功提示
                    document.getElementById('envList').style.display = 'none';
                    document.querySelector('.actions').style.display = 'none';
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('successState').style.display = 'block';
                    // 显示选中的环境 ID
                    document.getElementById('selectedEnvDisplay').textContent = selectedEnvId;
                    window.close();
                } else {
                    console.error('❌ 请求失败:', data);
                    alert('选择环境失败: ' + (data.error || '未知错误'));
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('confirmBtn').disabled = false;
                }
              }).catch(err => {
                console.error('❌ 网络请求错误:', err);
                alert('网络请求失败: ' + err.message);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('confirmBtn').disabled = false;
              });
        }
        
        function cancel() {
            fetch('/api/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(() => {
                window.close();
            });
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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #1a1a1a;
            --primary-hover: #000000;
            --accent-color: #67E9E9;
            --accent-hover: #2BCCCC;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: rgba(255, 255, 255, 0.15);
            --bg-secondary: rgba(255, 255, 255, 0.08);
            --bg-glass: rgba(26, 26, 26, 0.95);
            --shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.2);
            --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
            --header-bg: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d1117 100%);
        }
        
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
        }
        
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
            pointer-events: none;
            z-index: -1;
        }
        
        body::after {
            content: '';
            position: fixed;
            top: 50%; left: 50%;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(103, 233, 233, 0.05) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: -1;
            animation: pulse 8s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .container {
            background: var(--bg-glass);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: var(--shadow);
            border: 2px solid var(--border-color);
            max-width: 1200px;
            margin: 0 auto;
            animation: modalIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%);
            animation: shimmer 3s infinite;
            pointer-events: none;
            border-radius: 20px;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo {
            width: 40px;
            height: 40px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            animation: logoFloat 3s ease-in-out infinite;
        }
        
        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }
        
        .github-link {
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .github-link:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: var(--text-primary);
            margin-bottom: 10px;
            font-size: 28px;
            font-weight: 700;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        .subtitle {
            color: var(--text-secondary);
            font-size: 16px;
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .status {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .status-label {
            font-weight: 600;
            color: var(--text-secondary);
        }
        
        .status-value {
            color: var(--text-primary);
            font-family: var(--font-mono);
            font-size: 14px;
        }
        
        .enabled {
            color: var(--accent-color);
        }
        
        .disabled {
            color: #ff6b6b;
        }
        
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            animation: fadeInUp 0.8s ease-out 0.8s both;
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
            font-family: var(--font-mono);
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transition: all 0.3s ease;
            transform: translate(-50%, -50%);
        }
        
        .btn:hover::before {
            width: 100px; height: 100px;
        }
        
        .btn-primary {
            background: var(--accent-color);
            color: var(--primary-color);
        }
        
        .btn-primary:hover {
            background: var(--accent-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(103, 233, 233, 0.3);
        }
        
        .btn-danger {
            background: #ff6b6b;
            color: white;
        }
        
        .btn-danger:hover {
            background: #ff5252;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
        }
        
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: var(--text-primary);
        }
        
        .log-container {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            height: 500px;
            overflow-y: auto;
            font-family: var(--font-mono);
            font-size: 13px;
            line-height: 1.4;
            animation: fadeInUp 0.8s ease-out 1s both;
        }
        
        .log-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .log-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .log-container::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 4px;
        }
        
        .log-container::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
        }
        
        .log-line {
            color: var(--text-primary);
            margin-bottom: 2px;
            word-break: break-all;
            animation: logSlideIn 0.3s ease-out;
        }
        
        @keyframes logSlideIn {
            from {
                opacity: 0;
                transform: translateX(-10px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .log-line.debug {
            color: var(--text-secondary);
        }
        
        .log-line.info {
            color: #74c0fc;
        }
        
        .log-line.warn {
            color: #ffd43b;
        }
        
        .log-line.error {
            color: #ff8787;
        }
        
        .timestamp {
            color: var(--text-secondary);
        }
        
        .level {
            font-weight: bold;
            margin: 0 8px;
        }
        
        .empty-state {
            text-align: center;
            color: var(--text-secondary);
            padding: 40px;
            font-style: italic;
        }
        
        .log-count {
            color: var(--text-secondary);
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-top">
                <div class="header-left">
                    <img class="logo" src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/cloudbase-logo.svg" alt="CloudBase Logo" />
                    <div style="text-align: left;">
                        <h1>CloudBase MCP 调试日志</h1>
                        <p class="subtitle">实时查看 MCP 服务器运行日志</p>
                    </div>
                </div>
                <a href="https://github.com/TencentCloudBase/CloudBase-AI-ToolKit" target="_blank" class="github-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                </a>
            </div>
        </div>
        
        <div class="status">
            <div class="status-item">
                <span class="status-label">日志状态:</span>
                <span class="status-value ${status.enabled ? 'enabled' : 'disabled'}">
                    ${status.enabled ? '🟢 启用' : '🔴 禁用'}
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
                    ${status.useConsole ? '🟢 启用' : '🔴 禁用'}
                </span>
            </div>
        </div>
        
        <div class="controls">
            <div class="controls-left">
                <button class="btn btn-primary" onclick="refreshLogs()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M8 16H3v5"/>
                    </svg>
                    刷新日志
                </button>
                <button class="btn btn-danger" onclick="clearLogs()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    清空日志
                </button>
                <button class="btn btn-secondary" onclick="window.close()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    关闭
                </button>
            </div>
            <div>
                <span class="log-count">📊 共 ${logs.length} 条日志</span>
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
            }).join('') : '<div class="empty-state">📝 暂无日志记录</div>'}
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
                        
                        logContainer.innerHTML = newContent || '<div class="empty-state">📝 暂无日志记录</div>';
                        
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
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #1a1a1a;
            --primary-hover: #000000;
            --accent-color: #67E9E9;
            --accent-hover: #2BCCCC;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: rgba(255, 255, 255, 0.15);
            --bg-secondary: rgba(255, 255, 255, 0.08);
            --bg-glass: rgba(26, 26, 26, 0.95);
            --shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.2);
            --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
            --header-bg: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d1117 100%);
        }
        
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
        }
        
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
            pointer-events: none;
            z-index: -1;
        }
        
        body::after {
            content: '';
            position: fixed;
            top: 50%; left: 50%;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(103, 233, 233, 0.05) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: -1;
            animation: pulse 8s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .modal {
            background: var(--bg-glass);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: var(--shadow);
            border: 2px solid var(--border-color);
            width: 100%;
            max-width: 600px;
            overflow: hidden;
            animation: modalIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .modal::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%);
            animation: shimmer 3s infinite;
            pointer-events: none;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .header {
            background: var(--header-bg);
            color: var(--text-primary);
            padding: 24px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
            animation: headerShimmer 4s infinite;
            pointer-events: none;
        }
        
        @keyframes headerShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 1;
        }
        
        .logo {
            width: 32px;
            height: 32px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            animation: logoFloat 3s ease-in-out infinite;
        }
        
        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }
        
        .title {
            font-size: 20px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .github-link {
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1;
            transition: all 0.3s ease;
        }
        
        .github-link:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .content {
            padding: 32px 24px;
            position: relative;
        }
        
        .content-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message {
            background: rgba(103, 233, 233, 0.1);
            border: 1px solid var(--accent-color);
            border-left: 4px solid var(--accent-color);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary);
            animation: fadeInUp 0.8s ease-out 0.4s both;
            position: relative;
            overflow: hidden;
        }
        
        .message::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, var(--accent-color), transparent);
            animation: progress 2s ease-out;
        }
        
        @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
        }
        
        .options {
            margin-bottom: 24px;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .option-item {
            padding: 16px 20px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 14px;
            background: rgba(255, 255, 255, 0.03);
            position: relative;
            overflow: hidden;
            color: var(--text-primary);
        }
        
        .option-item::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 0;
            background: var(--accent-color);
            transition: width 0.3s ease;
        }
        
        .option-item:hover {
            background: var(--bg-secondary);
            border-color: var(--accent-color);
            transform: translateX(5px);
        }
        
        .option-item:hover::before {
            width: 4px;
        }
        
        .option-item.selected {
            background: rgba(103, 233, 233, 0.1);
            border-color: var(--accent-color);
            transform: translateX(5px);
        }
        
        .option-item.selected::before {
            width: 4px;
        }
        
        .option-icon {
            width: 20px;
            height: 20px;
            color: var(--accent-color);
            flex-shrink: 0;
            animation: iconGlow 2s ease-in-out infinite;
        }
        
        @keyframes iconGlow {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(103, 233, 233, 0.3)); }
            50% { filter: drop-shadow(0 0 8px rgba(103, 233, 233, 0.6)); }
        }
        
        .custom-input {
            margin-bottom: 24px;
            animation: fadeInUp 0.8s ease-out 0.8s both;
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
            transition: all 0.3s ease;
            line-height: 1.5;
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
        }
        
        .custom-input textarea::placeholder {
            color: var(--text-secondary);
        }
        
        .custom-input textarea:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(103, 233, 233, 0.1);
            background: rgba(255, 255, 255, 0.05);
        }
        
        .actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            animation: fadeInUp 0.8s ease-out 1s both;
        }
        
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
            position: relative;
            overflow: hidden;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 0; height: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transition: all 0.3s ease;
            transform: translate(-50%, -50%);
        }
        
        .btn:hover::before {
            width: 100px; height: 100px;
        }
        
        .btn-primary {
            background: var(--primary-color);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }
        
        .btn-primary:hover:not(:disabled) {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: var(--text-primary);
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
            border-top: 2px solid var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .success-state {
            text-align: center;
            padding: 40px 20px;
            animation: fadeInUp 0.8s ease-out both;
        }
        
        .success-icon {
            margin-bottom: 20px;
            color: var(--accent-color);
            animation: successPulse 2s ease-in-out infinite;
        }
        
        @keyframes successPulse {
            0%, 100% { 
                transform: scale(1);
                filter: drop-shadow(0 0 8px rgba(103, 233, 233, 0.3));
            }
            50% { 
                transform: scale(1.1);
                filter: drop-shadow(0 0 16px rgba(103, 233, 233, 0.6));
            }
        }
        
        .success-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 12px;
        }
        
        .success-message {
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1.5;
        }
        
        .selected-env-info {
            margin-top: 20px;
            padding: 16px;
            background: rgba(103, 233, 233, 0.1);
            border: 1px solid var(--accent-color);
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .env-label {
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 500;
        }
        
        .env-value {
            color: var(--accent-color);
            font-size: 16px;
            font-weight: 600;
            font-family: var(--font-mono);
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <div class="header-left">
                <img class="logo" src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/cloudbase-logo.svg" alt="CloudBase Logo" />
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
            <h1 class="content-title">AI 需要您确认</h1>
            <div class="message">${message}</div>
            
            ${optionsArray ? `
            <div class="options" id="options">
                ${optionsArray.map((option: string, index: number) => `
                    <div class="option-item" onclick="selectOption('${option}')" style="animation-delay: ${index * 0.1}s;">
                        <svg class="option-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                        </svg>
                        <span>${option}</span>
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
                    确认执行
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
            
            updateSubmitButton();
        }
        
        function updateSubmitButton() {
            const customInput = document.getElementById('customInput').value.trim();
            const submitBtn = document.getElementById('submitBtn');
            
            if (selectedOption || customInput) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            }
        }
        
        function submit() {
            const customInput = document.getElementById('customInput').value.trim();
            const data = selectedOption || customInput;
            
            if (!data) return;
            
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('submitBtn').disabled = true;
            
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'clarification',
                    data: data
                })
            }).then(response => response.json())
              .then(result => {
                if (result.success) {
                    window.close();
                }
              }).catch(err => {
                console.error('Error:', err);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('submitBtn').disabled = false;
              });
        }
        
        function cancel() {
            fetch('/api/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(() => {
                window.close();
            });
        }
        
        // Initialize
        updateSubmitButton();
    </script>
</body>
</html>`;
  }

  private getConfirmationHTML(message: string, risks?: string[], options?: string[]): string {
    const availableOptions = options || ['确认执行', '取消操作'];
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudBase AI Toolkit - 操作确认</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary-color: #1a1a1a;
            --primary-hover: #000000;
            --accent-color: #67E9E9;
            --accent-hover: #2BCCCC;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: rgba(255, 255, 255, 0.15);
            --bg-secondary: rgba(255, 255, 255, 0.08);
            --bg-glass: rgba(26, 26, 26, 0.95);
            --warning-color: #ff6b6b;
            --warning-bg: rgba(255, 107, 107, 0.1);
            --warning-border: rgba(255, 107, 107, 0.3);
            --shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.2);
            --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
            --header-bg: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d1117 100%);
        }
        
        body {
            font-family: var(--font-mono);
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
        }
        
        /* Custom scrollbar styles */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--accent-color);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
            pointer-events: none;
            z-index: -1;
        }
        
        body::after {
            content: '';
            position: fixed;
            top: 50%; left: 50%;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(255, 107, 107, 0.03) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: -1;
            animation: pulse 8s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .modal {
            background: var(--bg-glass);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: var(--shadow);
            border: 2px solid var(--border-color);
            width: 100%;
            max-width: 600px;
            overflow: hidden;
            animation: modalIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .modal::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%);
            animation: shimmer 3s infinite;
            pointer-events: none;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        @keyframes modalIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .header {
            background: var(--header-bg);
            color: var(--text-primary);
            padding: 24px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
            animation: headerShimmer 4s infinite;
            pointer-events: none;
        }
        
        @keyframes headerShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 1;
        }
        
        .logo {
            width: 32px;
            height: 32px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            animation: logoFloat 3s ease-in-out infinite;
        }
        
        @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
        }
        
        .title {
            font-size: 20px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .github-link {
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1;
            transition: all 0.3s ease;
        }
        
        .github-link:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .content {
            padding: 32px 24px;
            position: relative;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .content-title {
            font-size: 24px;
            margin-bottom: 8px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        .message {
            background: rgba(103, 233, 233, 0.1);
            border: 1px solid var(--accent-color);
            border-left: 4px solid var(--accent-color);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary);
            animation: fadeInUp 0.8s ease-out 0.4s both;
            position: relative;
            overflow: scroll;
            white-space: pre;
            max-height: 300px;
        }
        
        .message::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, var(--accent-color), transparent);
            animation: progress 2s ease-out;
        }
        
        @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
        }
        
        .risks {
            background: var(--warning-bg);
            border: 1px solid var(--warning-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .risks-title {
            color: var(--warning-color);
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: warningGlow 2s ease-in-out infinite;
        }
        
        @keyframes warningGlow {
            0%, 100% { filter: drop-shadow(0 0 2px rgba(255, 107, 107, 0.3)); }
            50% { filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.6)); }
        }
        
        .risk-item {
            color: var(--text-primary);
            margin-bottom: 8px;
            padding-left: 24px;
            position: relative;
        }
        
        .risk-item:before {
            content: "⚠️";
            position: absolute;
            left: 0;
            color: var(--warning-color);
        }
        
        .options {
            margin-bottom: 24px;
            animation: fadeInUp 0.8s ease-out 0.8s both;
        }
        
        .option-item {
            padding: 16px 20px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 14px;
            background: rgba(255, 255, 255, 0.03);
            position: relative;
            overflow: hidden;
            color: var(--text-primary);
        }
        
        .option-item::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 0;
            background: var(--accent-color);
            transition: width 0.3s ease;
        }
        
        .option-item.confirm::before {
            background: var(--accent-color);
        }
        
        .option-item.cancel::before {
            background: var(--warning-color);
        }
        
        .option-item:hover {
            background: var(--bg-secondary);
            transform: translateX(5px);
        }
        
        .option-item:hover::before {
            width: 4px;
        }
        
        .option-item.selected {
            background: rgba(103, 233, 233, 0.1);
            border-color: var(--accent-color);
            transform: translateX(5px);
        }
        
        .option-item.selected.cancel {
            background: rgba(255, 107, 107, 0.1);
            border-color: var(--warning-color);
        }
        
        .option-item.selected::before {
            width: 4px;
        }
        
        .option-icon {
            width: 20px;
            height: 20px;
            color: var(--accent-color);
            flex-shrink: 0;
        }
        
        .option-item.cancel .option-icon {
            color: var(--warning-color);
        }
        
        .loading {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 14px;
            animation: fadeInUp 0.8s ease-out 1s both;
        }
        
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--border-color);
            border-top: 2px solid var(--accent-color);
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
                <img class="logo" src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/cloudbase-logo.svg" alt="CloudBase Logo" />
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                操作确认
            </h1>
            <div class="message">${message}</div>
            
            ${risks && risks.length > 0 ? `
            <div class="risks">
                <div class="risks-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    风险提示
                </div>
                ${risks.map(risk => `<div class="risk-item">${risk}</div>`).join('')}
            </div>
            ` : ''}
            
            <div class="options">
                ${availableOptions.map((option: string, index: number) => {
                    const isCancel = option.includes('取消') || option.toLowerCase().includes('cancel');
                    const className = isCancel ? 'cancel' : 'confirm';
                    const iconPath = isCancel 
                        ? '<path d="M18 6L6 18M6 6l12 12"/>'
                        : '<path d="M20 6L9 17l-5-5"/>';
                        
                    return `
                        <div class="option-item ${className}" onclick="selectOption('${option}')" style="animation-delay: ${index * 0.1}s;">
                            <svg class="option-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${iconPath}
                            </svg>
                            <span>${option}</span>
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
            
            // Auto submit after selection
            setTimeout(() => {
                submit();
            }, 500);
        }
        
        function submit() {
            if (!selectedOption) return;
            
            document.getElementById('loading').style.display = 'flex';
            
            const isConfirmed = !selectedOption.includes('取消') && !selectedOption.toLowerCase().includes('cancel');
            
            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'confirmation',
                    data: {
                        confirmed: isConfirmed,
                        option: selectedOption
                    }
                })
            }).then(response => response.json())
              .then(result => {
                if (result.success) {
                    window.close();
                }
              }).catch(err => {
                console.error('Error:', err);
                document.getElementById('loading').style.display = 'none';
              });
        }
        
        function cancel() {
            fetch('/api/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(() => {
                window.close();
            });
        }
    </script>
</body>
</html>`;
  }

  // 公共方法获取运行状态
  get running(): boolean {
    return this.isRunning;
  }

  // 公共方法获取端口
  get currentPort(): number {
    return this.port;
  }
}

// 单例实例
let interactiveServerInstance: InteractiveServer | null = null;

export function getInteractiveServer(mcpServer?: any): InteractiveServer {
  if (!interactiveServerInstance) {
    interactiveServerInstance = new InteractiveServer(mcpServer);
  } else if (mcpServer && !interactiveServerInstance.mcpServer) {
    // 如果实例已存在但没有 mcpServer，更新它
    interactiveServerInstance.mcpServer = mcpServer;
  }
  return interactiveServerInstance;
}

export async function resetInteractiveServer(): Promise<void> {
  if (interactiveServerInstance) {
    try {
      await interactiveServerInstance.stop();
    } catch (err) {
      error('Error stopping existing server instance:', err);
    }
    interactiveServerInstance = null;
  }
}

export async function getInteractiveServerSafe(mcpServer?: any): Promise<InteractiveServer> {
  // 如果当前实例存在但不在运行状态，先清理
  if (interactiveServerInstance && !interactiveServerInstance.running) {
    try {
      await interactiveServerInstance.stop();
    } catch (err) {
      debug('Error stopping non-running server:', err);
    }
    interactiveServerInstance = null;
  }
  
  return getInteractiveServer(mcpServer);
}

