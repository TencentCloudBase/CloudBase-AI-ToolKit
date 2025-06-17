import fs from 'fs/promises';
import path from 'path';
import os from 'os';

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
}

class Logger {
  private enabled: boolean;
  private level: LogLevel;
  private logFile: string | null;
  private useConsole: boolean;

  constructor(options: LoggerOptions = {}) {
    // 默认开启
    this.enabled = options.enabled ?? true;
    this.level = options.level ?? LogLevel.INFO;
    this.useConsole = options.console ?? false;
    
    // 默认日志文件路径
    this.logFile = options.logFile ?? path.join(os.tmpdir(), 'cloudbase-mcp.log');
  }

  private async writeLog(level: LogLevel, message: string, data?: any) {
    if (!this.enabled || level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const logMessage = data 
      ? `[${timestamp}] [${levelName}] ${message} ${JSON.stringify(data, null, 2)}`
      : `[${timestamp}] [${levelName}] ${message}`;

    // 输出到控制台（在开发模式或明确启用时）
    if (this.useConsole) {
      console.error(logMessage); // 使用 stderr 避免污染 stdout
    }

    // 写入日志文件
    if (this.logFile) {
      try {
        await fs.appendFile(this.logFile, logMessage + '\n');
      } catch (error) {
        // 静默处理日志写入错误，避免影响主要功能
      }
    }
  }

  debug(message: string, data?: any) {
    this.writeLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.writeLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.writeLog(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.writeLog(LogLevel.ERROR, message, data);
  }

  // 设置日志级别
  setLevel(level: LogLevel) {
    this.level = level;
  }

  // 启用/禁用日志
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // 获取日志文件路径
  getLogFile(): string | null {
    return this.logFile;
  }

  // 清理日志文件
  async clearLogs() {
    if (this.logFile) {
      try {
        await fs.writeFile(this.logFile, '');
      } catch (error) {
        // 静默处理
      }
    }
  }

  // 读取日志内容
  async getLogs(maxLines: number = 1000): Promise<string[]> {
    if (!this.logFile) return [];
    
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // 返回最近的 maxLines 行
      return lines.slice(-maxLines);
    } catch (error) {
      return [`读取日志文件失败: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  // 获取日志状态信息
  getStatus() {
    return {
      enabled: this.enabled,
      level: LogLevel[this.level],
      logFile: this.logFile,
      useConsole: this.useConsole
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
export const getLogs = (maxLines?: number) => logger.getLogs(maxLines);
export const getLoggerStatus = () => logger.getStatus();
export const clearLogs = () => logger.clearLogs(); 