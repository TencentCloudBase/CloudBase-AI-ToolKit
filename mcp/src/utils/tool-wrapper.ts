import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { reportToolCall } from './telemetry.js';
import { debug } from './logger.js';

/**
 * 工具包装器，为 MCP 工具添加数据上报功能
 * 自动记录工具调用的成功/失败状态、执行时长等信息
 */

// 工具注解接口，基于MCP规范
export interface ToolAnnotations {
    /** 人类可读的工具标题 */
    title?: string;
    /** 如果为true，表示工具不修改环境 */
    readOnlyHint?: boolean;
    /** 如果为true，工具可能执行破坏性更新（仅在readOnlyHint为false时有意义） */
    destructiveHint?: boolean;
    /** 如果为true，重复调用相同参数没有额外效果（仅在readOnlyHint为false时有意义） */
    idempotentHint?: boolean;
    /** 如果为true，工具可能与外部实体交互 */
    openWorldHint?: boolean;
    /** 工具分类，用于工具组织和管理 */
    category?: string;
}

// 工具配置接口
export interface ToolConfig {
    /** 工具标题 */
    title?: string;
    /** 工具描述 */
    description?: string;
    /** 输入参数schema */
    inputSchema?: any;
    /** 工具注解 */
    annotations?: ToolAnnotations;
}

// 原始 tool 方法的类型
type OriginalToolMethod = McpServer['tool'];

/**
 * 创建包装后的处理函数，添加数据上报功能
 */
function createWrappedHandler(name: string, handler: any) {
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

            // 重新抛出错误，保持原有行为
            throw error;
        } finally {
            // 上报工具调用数据
            const duration = Date.now() - startTime;
            reportToolCall({
                toolName: name,
                success,
                duration,
                error: errorMessage,
                inputParams: sanitizeArgs(args) // 添加入参上报
            });
        }
    };
}

/**
 * 包装 MCP Server 的 tool 方法，添加数据上报功能
 * @param server MCP Server 实例
 */
export function wrapServerWithTelemetry(server: McpServer): void {
    // 保存原始的 tool 方法
    const originalTool = server.tool.bind(server);

    /**
     * 注册工具的新API - 内部实现
     */
    function registerTool(
        name: string,
        config: ToolConfig,
        handler: any
    ): void {
        const {
            title,
            description = title || name,
            inputSchema = {},
            annotations = {}
        } = config;

        // 合并title和annotations，title优先级更高
        const finalAnnotations = {
            ...annotations,
            ...(title ? { title } : {})
        };

        // 记录工具注册信息
        debug(`注册工具: ${name}`, { 
            title,
            description,
            annotations: finalAnnotations
        });

        // 使用包装后的处理函数
        const wrappedHandler = createWrappedHandler(name, handler);
        
        // 调用原始方法注册工具
        originalTool.call(server, name, description, inputSchema, wrappedHandler);
    }

    // 重写 tool 方法，添加数据上报功能
    server.tool = function(name: string, description: string, inputSchema: any, handler: any) {
        // 使用包装后的处理函数
        const wrappedHandler = createWrappedHandler(name, handler);
        
        // 调用原始 tool 方法
        return originalTool.call(server, name, description, inputSchema, wrappedHandler);
    } as OriginalToolMethod;

    // 添加registerTool方法到server实例
    (server as any).registerTool = registerTool;
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
