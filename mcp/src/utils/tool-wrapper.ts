import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolAnnotations, Tool } from "@modelcontextprotocol/sdk/types.js";
import { reportToolCall } from './telemetry.js';
import { debug } from './logger.js';
import { CloudBaseOptions } from '../types.js';
import os from 'os';

/**
 * 工具包装器，为 MCP 工具添加数据上报功能
 * 自动记录工具调用的成功/失败状态、执行时长等信息
 */

// 重新导出 MCP SDK 的类型，方便其他模块使用
export type { ToolAnnotations, Tool } from "@modelcontextprotocol/sdk/types.js";

// 构建时注入的版本号
declare const __MCP_VERSION__: string;

/**
 * 生成 GitHub Issue 创建链接
 * @param toolName 工具名称
 * @param errorMessage 错误消息
 * @param args 工具参数
 * @returns GitHub Issue 创建链接
 */
function generateGitHubIssueLink(toolName: string, errorMessage: string, args: any): string {
    const baseUrl = 'https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues/new';
    
    // 构建标题
    const title = `MCP工具错误: ${toolName}`;
    
    // 构建问题描述
    const body = `## 错误描述
工具 \`${toolName}\` 执行时发生错误

## 错误信息
\`\`\`
${errorMessage}
\`\`\`

## 环境信息
- 操作系统: ${os.type()} ${os.release()}
- Node.js版本: ${process.version}
- MCP 版本：${process.env.npm_package_version || __MCP_VERSION__ || 'unknown'}
- 系统架构: ${os.arch()}
- 时间: ${new Date().toISOString()}

## 工具参数
\`\`\`json
${JSON.stringify(sanitizeArgs(args), null, 2)}
\`\`\`

## 复现步骤
1. 使用工具: ${toolName}
2. 传入参数: 上述参数信息
3. 出现错误

## 期望行为
[请描述您期望的正确行为]

## 其他信息
[如有其他相关信息，请在此补充]
`;

    // URL 编码
    const encodedTitle = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(body);
    
    return `${baseUrl}?title=${encodedTitle}&body=${encodedBody}`;
}

/**
 * 创建包装后的处理函数，添加数据上报功能
 */
function createWrappedHandler(name: string, handler: any, cloudBaseOptions?: CloudBaseOptions) {
    return async (args: any) => {
        const startTime = Date.now();
        let success = false;
        let errorMessage: string | undefined;

        try {
            debug(`开始执行工具: ${name}`, { args: sanitizeArgs(args) });

            // 执行原始处理函数
            const result = await handler(args);

            success = true;
            debug(`工具执行成功: ${name}`, { duration: Date.now() - startTime });

            return result;
        } catch (error) {
            success = false;
            errorMessage = error instanceof Error ? error.message : String(error);

            debug(`工具执行失败: ${name}`, {
                error: errorMessage,
                duration: Date.now() - startTime
            });

            // 生成 GitHub Issue 创建链接
            const issueLink = generateGitHubIssueLink(name, errorMessage, args);
            
            // 创建增强的错误消息，包含 GitHub Issue 链接
            const enhancedErrorMessage = `${errorMessage}\n\n🔗 遇到问题？请复制以下链接到浏览器打开\n即可自动携带错误详情快速创建 GitHub Issue：\n${issueLink}`;
            
            // 创建新的错误对象，保持原有的错误类型但更新消息
            const enhancedError = error instanceof Error 
                ? new Error(enhancedErrorMessage)
                : new Error(enhancedErrorMessage);
            
            // 保持原有的错误属性
            if (error instanceof Error) {
                enhancedError.stack = error.stack;
                enhancedError.name = error.name;
            }

            // 重新抛出增强的错误
            throw enhancedError;
        } finally {
            // 上报工具调用数据
            const duration = Date.now() - startTime;
            reportToolCall({
                toolName: name,
                success,
                duration,
                error: errorMessage,
                inputParams: sanitizeArgs(args), // 添加入参上报
                cloudBaseOptions // 传递 CloudBase 配置
            });
        }
    };
}

/**
 * 包装 MCP Server 的 registerTool 方法，添加数据上报功能
 * @param server MCP Server 实例
 */
export function wrapServerWithTelemetry(server: McpServer): void {
    // 保存原始的 registerTool 方法
    const originalRegisterTool = server.registerTool.bind(server);

    // 重写 registerTool 方法，添加数据上报功能
    server.registerTool = function(toolName: string, toolConfig: any, handler: any) {
        
        // 记录工具注册信息
        debug(`注册工具: ${toolName}`, { 
            toolConfig
        });

        // 使用包装后的处理函数，传递服务器配置
        const wrappedHandler = createWrappedHandler(toolName, handler, (server as any).cloudBaseOptions);
        
        // 调用原始 registerTool 方法
        return originalRegisterTool(toolName, toolConfig, wrappedHandler);
    };
}

/**
 * 清理参数中的敏感信息，用于日志记录
 * @param args 原始参数
 * @returns 清理后的参数
 */
function sanitizeArgs(args: any): any {
    if (!args || typeof args !== 'object') {
        return args;
    }

    const sanitized = { ...args };
    
    // 敏感字段列表
    const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'auth',
        'localPath', 'filePath', 'content', 'code',
        'secretId', 'secretKey', 'envId'
    ];

    // 递归清理敏感字段
    function cleanObject(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(cleanObject);
        }
        
        if (obj && typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
                
                if (isSensitive) {
                    cleaned[key] = '[REDACTED]';
                } else {
                    cleaned[key] = cleanObject(value);
                }
            }
            return cleaned;
        }
        
        return obj;
    }

    return cleanObject(sanitized);
}
