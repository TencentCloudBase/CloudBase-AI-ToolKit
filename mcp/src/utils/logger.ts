import fsSync from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LoggerOptions {
  enabled?: boolean;
  level?: LogLevel;
  logFile?: string;
  console?: boolean;
  maxLogFiles?: number; // 保留的最大日志文件数量
  logDir?: string; // 日志目录
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private enabled: boolean;
  private level: LogLevel;
  private baseLogFile: string;
  private logDir: string;
  private useConsole: boolean;
  private maxLogFiles: number;
  
  // 写入队列相关
  private writeQueue: LogEntry[] = [];
  private isWriting = false;
  private writePromise: Promise<void> | null = null;

  constructor(options: LoggerOptions = {}) {
    // 默认开启
    this.enabled = options.enabled ?? true;
    this.level = options.level ?? LogLevel.INFO;
    this.useConsole = options.console ?? false;
    this.maxLogFiles = options.maxLogFiles ?? 30; // 默认保留30天的日志
    
    // 设置日志目录 - 使用 homedir 确保跨系统兼容
    this.logDir = options.logDir ?? path.join(os.homedir(), '.cloudbase-mcp', 'logs');
    
    // 基础日志文件名（不含日期）
    this.baseLogFile = options.logFile ?? 'cloudbase-mcp.log';
    
    // 程序退出时确保日志写入完成
    this.setupExitHandlers();
    
    // 立即尝试创建目录（同步方式）
    this.ensureLogDirSync();
    
    // 异步初始化日志目录（作为备份）
    this.initLogDir();
  }

  private ensureLogDirSync() {
    try {
      // 使用同步方式创建目录
      if (!fsSync.existsSync(this.logDir)) {
        fsSync.mkdirSync(this.logDir, { recursive: true });
        console.log(`日志目录创建成功（同步）: ${this.logDir}`);
      } else {
        console.log(`日志目录已存在（同步）: ${this.logDir}`);
      }
    } catch (error) {
      console.error(`同步创建日志目录失败: ${this.logDir}`, error instanceof Error ? error.message : String(error));
      // 如果同步创建失败，回退到 homedir 下的备用目录
      this.logDir = path.join(os.homedir(), '.cloudbase-mcp', 'logs-fallback');
      console.log(`回退到备用目录: ${this.logDir}`);
    }
  }

  private async initLogDir() {
    try {
      await this.ensureLogDir();
    } catch (error) {
      console.error('初始化日志目录失败:', error instanceof Error ? error.message : String(error));
    }
  }

  private async ensureLogDir() {
    try {
      // 检查目录是否已存在
      try {
        await fs.access(this.logDir);
        console.log(`日志目录已存在: ${this.logDir}`);
        return;
      } catch {
        // 目录不存在，需要创建
      }
      
      // 创建目录
      await fs.mkdir(this.logDir, { recursive: true });
      console.log(`日志目录创建成功: ${this.logDir}`);
    } catch (error) {
      console.error(`创建日志目录失败: ${this.logDir}`, error instanceof Error ? error.message : String(error));
      
      // 如果创建目录失败，回退到 homedir 下的备用目录
      const fallbackDir = path.join(os.homedir(), '.cloudbase-mcp', 'logs-fallback');
      console.log(`回退到备用目录: ${fallbackDir}`);
      this.logDir = fallbackDir;
    }
  }

  private setupExitHandlers() {
    // 确保程序退出前日志写入完成
    const flushAndExit = async (signal: string) => {
      await this.flush();
      process.exit(signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
    };

    process.on('SIGINT', () => flushAndExit('SIGINT'));
    process.on('SIGTERM', () => flushAndExit('SIGTERM'));
    process.on('exit', () => this.flushSync());
  }

  private getCurrentLogFile(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${this.baseLogFile}-${dateStr}.log`);
  }

  private async writeLog(level: LogLevel, message: string, data?: any) {
    if (!this.enabled || level < this.level) return;

    const timestamp = new Date().toISOString();
    const entry: LogEntry = { level, message, data, timestamp };
    
    // 添加到写入队列
    this.writeQueue.push(entry);
    
    // 如果没有正在写入，开始写入
    if (!this.isWriting) {
      this.writePromise = this.processQueue();
    }
    
    // 返回写入完成的promise
    return this.writePromise;
  }

  private async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;
    
    this.isWriting = true;
    
    try {
      while (this.writeQueue.length > 0) {
        const entry = this.writeQueue.shift()!;
        await this.writeEntry(entry);
      }
    } finally {
      this.isWriting = false;
    }
  }

  private async writeEntry(entry: LogEntry) {
    const levelName = LogLevel[entry.level];
    const logMessage = entry.data 
      ? `[${entry.timestamp}] [${levelName}] ${entry.message} ${JSON.stringify(entry.data, null, 2)}`
      : `[${entry.timestamp}] [${levelName}] ${entry.message}`;

    // 输出到控制台（在开发模式或明确启用时）
    if (this.useConsole) {
      console.error(logMessage); // 使用 stderr 避免污染 stdout
    }

    // 写入日志文件
    const logFile = this.getCurrentLogFile();
    try {
      await fs.appendFile(logFile, logMessage + '\n');
      
      // 定期清理旧日志文件
      await this.cleanupOldLogs();
    } catch (error) {
      // 改进错误处理：在控制台输出错误，但不抛出异常
      console.error(`日志写入失败 [${new Date().toISOString()}]:`, error instanceof Error ? error.message : String(error));
      
      // 如果是权限错误或其他严重错误，尝试写入到备用的错误日志
      if (logFile !== path.join(os.tmpdir(), 'cloudbase-mcp-error.log')) {
        try {
          const errorLog = path.join(os.tmpdir(), 'cloudbase-mcp-error.log');
          await fs.appendFile(errorLog, `日志写入失败: ${logMessage}\n错误: ${error instanceof Error ? error.message : String(error)}\n`, 'utf-8');
        } catch (fallbackError) {
          // 最后的备选方案：直接输出到 stderr
          console.error('备选日志写入也失败:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        }
      }
    }
  }

  private async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith(this.baseLogFile) && file.endsWith('.log'))
        .map(file => {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})\.log$/);
          return {
            name: file,
            path: path.join(this.logDir, file),
            date: dateMatch ? new Date(dateMatch[1]) : new Date(0)
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // 删除超过保留数量的旧日志文件
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      // 静默处理清理错误
    }
  }

  // 确保所有待写入的日志都被处理
  async flush() {
    if (this.writePromise) {
      await this.writePromise;
    }
    await this.processQueue();
  }

  // 同步flush（用于exit事件）
  private flushSync() {
    // Node.js 的同步API在exit事件中可能不工作，这里只是尽力而为
    try {
      if (this.writeQueue.length > 0) {
        console.error(`程序退出时还有 ${this.writeQueue.length} 条日志未写入`);
      }
    } catch (error) {
      // 静默处理
    }
  }

  debug(message: string, data?: any) {
    return this.writeLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    return this.writeLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    return this.writeLog(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    return this.writeLog(LogLevel.ERROR, message, data);
  }

  // 设置日志级别
  setLevel(level: LogLevel) {
    this.level = level;
  }

  // 启用/禁用日志
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // 获取当前日志文件路径
  getLogFile(): string {
    return this.getCurrentLogFile();
  }

  // 获取日志目录
  getLogDir(): string {
    return this.logDir;
  }

  // 清理指定日期的日志文件
  async clearLogs(date?: string) {
    try {
      if (date) {
        // 清理指定日期的日志
        const logFile = path.join(this.logDir, `${this.baseLogFile}-${date}.log`);
        await fs.writeFile(logFile, '');
      } else {
        // 清理所有日志文件
        const files = await fs.readdir(this.logDir);
        const logFiles = files.filter(file => file.startsWith(this.baseLogFile) && file.endsWith('.log'));
        for (const file of logFiles) {
          await fs.writeFile(path.join(this.logDir, file), '');
        }
      }
    } catch (error) {
      // 静默处理
    }
  }

  // 读取日志内容
  async getLogs(maxLines: number = 1000, date?: string): Promise<string[]> {
    try {
      const logFile = date 
        ? path.join(this.logDir, `${this.baseLogFile}-${date}.log`)
        : this.getCurrentLogFile();
      
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // 返回最近的 maxLines 行
      return lines.slice(-maxLines);
    } catch (error) {
      return [`读取日志文件失败: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  // 获取所有日志文件信息
  async getLogFiles(): Promise<Array<{date: string, path: string, size: number}>> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith(this.baseLogFile) && file.endsWith('.log'))
        .map(async file => {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})\.log$/);
          return {
            date: dateMatch ? dateMatch[1] : 'unknown',
            path: filePath,
            size: stats.size
          };
        });
      
      return await Promise.all(logFiles);
    } catch (error) {
      return [];
    }
  }

  // 获取日志状态信息
  getStatus() {
    return {
      enabled: this.enabled,
      level: LogLevel[this.level],
      currentLogFile: this.getCurrentLogFile(),
      logDir: this.logDir,
      useConsole: this.useConsole,
      queueLength: this.writeQueue.length,
      isWriting: this.isWriting,
      maxLogFiles: this.maxLogFiles
    };
  }
}

// 创建全局 logger 实例
export const logger = new Logger({
  enabled: (process.env.MCP_DEBUG ?? 'true') === 'true',
  level: LogLevel.DEBUG,
  console: (process.env.NODE_ENV === 'development') || (process.env.MCP_CONSOLE_LOG === 'true')
});

// 便捷的导出函数
export const debug = (message: string, data?: any) => logger.debug(message, data);
export const info = (message: string, data?: any) => logger.info(message, data);
export const warn = (message: string, data?: any) => logger.warn(message, data);
export const error = (message: string, data?: any) => logger.error(message, data);

// 日志管理函数
export const getLogs = (maxLines?: number, date?: string) => logger.getLogs(maxLines, date);
export const getLoggerStatus = () => logger.getStatus();
export const clearLogs = (date?: string) => logger.clearLogs(date);
export const flushLogs = () => logger.flush();
export const getLogFiles = () => logger.getLogFiles(); 