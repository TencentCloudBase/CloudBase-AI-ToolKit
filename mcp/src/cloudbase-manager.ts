import CloudBase from "@cloudbase/manager-node";
import { getLoginState } from './auth.js';
import { _promptAndSetEnvironmentId, type EnvSetupFailureInfo } from './tools/interactive.js';
import { CloudBaseOptions, Logger } from './types.js';
import { debug, error } from './utils/logger.js';
const ENV_ID_TIMEOUT = 600000; // 10 minutes (600 seconds) - matches InteractiveServer timeout

// 统一的环境ID管理类
class EnvironmentManager {
    private cachedEnvId: string | null = null;
    private envIdPromise: Promise<string> | null = null;

    // 重置缓存
    reset() {
        this.cachedEnvId = null;
        this.envIdPromise = null;
        delete process.env.CLOUDBASE_ENV_ID;
    }

    // 获取环境ID的核心逻辑
    async getEnvId(mcpServer?: any): Promise<string> {
        // 1. 优先使用内存缓存
        if (this.cachedEnvId) {
            debug('使用内存缓存的环境ID:', { envId: this.cachedEnvId });
            return this.cachedEnvId;
        }

        // 2. 如果正在获取中，等待结果
        if (this.envIdPromise) {
            return this.envIdPromise;
        }

        // 3. 开始获取环境ID (pass mcpServer for IDE detection)
        this.envIdPromise = this._fetchEnvId(mcpServer);

        // 增加超时保护
        const timeoutPromise = new Promise<string>((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error(`EnvId 获取超时（${ENV_ID_TIMEOUT / 1000}秒）`));
            }, ENV_ID_TIMEOUT);
        });

        try {
            const result = await Promise.race([this.envIdPromise, timeoutPromise]);
            return result;
        } catch (err) {
            this.envIdPromise = null;
            throw err;
        }
    }

    private async _fetchEnvId(mcpServer?: any): Promise<string> {
        try {
            // 1. 检查进程环境变量
            if (process.env.CLOUDBASE_ENV_ID) {
                debug('使用进程环境变量的环境ID:', { envId: process.env.CLOUDBASE_ENV_ID });
                this.cachedEnvId = process.env.CLOUDBASE_ENV_ID;
                return this.cachedEnvId;
            }

            // 2. 自动设置环境ID (pass mcpServer for IDE detection)
            debug('未找到环境ID，尝试自动设置...');
            let setupResult;
            try {
                setupResult = await _promptAndSetEnvironmentId(true, { server: mcpServer });
            } catch (setupError) {
                // Preserve original error information
                const errorObj = setupError instanceof Error ? setupError : new Error(String(setupError));
                error('自动设置环境ID时发生异常:', {
                    error: errorObj.message,
                    stack: errorObj.stack,
                    name: errorObj.name,
                });
                // Re-throw with enhanced context
                const enhancedError = new Error(`自动设置环境ID失败: ${errorObj.message}`);
                (enhancedError as any).originalError = errorObj;
                (enhancedError as any).failureInfo = {
                    reason: 'unknown_error' as const,
                    error: errorObj.message,
                    errorCode: 'SETUP_EXCEPTION',
                };
                throw enhancedError;
            }
            
            const autoEnvId = setupResult.selectedEnvId;
            
            if (!autoEnvId) {
                // Build detailed error message from failure info
                const errorMessage = this._buildDetailedErrorMessage(setupResult.failureInfo);
                error('自动设置环境ID失败:', {
                    reason: setupResult.failureInfo?.reason,
                    errorCode: setupResult.failureInfo?.errorCode,
                    error: setupResult.failureInfo?.error,
                    details: setupResult.failureInfo?.details,
                });
                
                // Create error with detailed information
                const detailedError = new Error(errorMessage);
                (detailedError as any).failureInfo = setupResult.failureInfo;
                throw detailedError;
            }

            debug('自动设置环境ID成功:', { envId: autoEnvId });
            this._setCachedEnvId(autoEnvId);
            return autoEnvId;

        } catch (err) {
            // Log the error with full context before re-throwing
            const errorObj = err instanceof Error ? err : new Error(String(err));
            error('获取环境ID失败:', {
                message: errorObj.message,
                stack: errorObj.stack,
                name: errorObj.name,
                failureInfo: (errorObj as any).failureInfo,
                originalError: (errorObj as any).originalError,
            });
            throw errorObj;
        } finally {
            this.envIdPromise = null;
        }
    }

    // 统一设置缓存的方法
    private _setCachedEnvId(envId: string) {
        this.cachedEnvId = envId;
        process.env.CLOUDBASE_ENV_ID = envId;
        debug('已更新环境ID缓存:', { envId });
    }

    // Build detailed error message from failure info
    private _buildDetailedErrorMessage(failureInfo?: EnvSetupFailureInfo): string {
        if (!failureInfo) {
            return "CloudBase Environment ID not found after auto setup. Please set CLOUDBASE_ENV_ID or run setupEnvironmentId tool.";
        }

        const { reason, error: errorMsg, errorCode, helpUrl, details } = failureInfo;
        
        let message = "CloudBase Environment ID not found after auto setup.\n\n";
        message += `原因: ${this._getReasonDescription(reason)}\n`;
        
        if (errorMsg) {
            message += `错误: ${errorMsg}\n`;
        }
        
        if (errorCode) {
            message += `错误代码: ${errorCode}\n`;
        }

        // Add specific details based on failure reason
        if (reason === 'tcb_init_failed' && details?.initTcbError) {
            const initError = details.initTcbError;
            if (initError.needRealNameAuth) {
                message += "\n需要完成实名认证才能使用 CloudBase 服务。\n";
            }
            if (initError.needCamAuth) {
                message += "\n需要 CAM 权限才能使用 CloudBase 服务。\n";
            }
        }

        if (reason === 'env_creation_failed' && details?.createEnvError) {
            const createError = details.createEnvError;
            message += `\n环境创建失败: ${createError.message || '未知错误'}\n`;
        }

        if (reason === 'env_query_failed' && details?.queryEnvError) {
            message += `\n环境查询失败: ${details.queryEnvError}\n`;
        }

        if (reason === 'timeout' && details?.timeoutDuration) {
            message += `\n超时时间: ${details.timeoutDuration / 1000} 秒\n`;
            message += "提示: 请确保浏览器窗口已打开，并在规定时间内完成环境选择。\n";
        }

        message += "\n解决方案:\n";
        message += "1. 手动设置环境ID: 设置环境变量 CLOUDBASE_ENV_ID\n";
        message += "2. 使用工具设置: 运行 setupEnvironmentId 工具\n";
        
        if (helpUrl) {
            message += `3. 查看帮助文档: ${helpUrl}\n`;
        } else {
            message += "3. 查看帮助文档: https://docs.cloudbase.net/cli-v1/env\n";
        }

        return message;
    }

    private _getReasonDescription(reason: EnvSetupFailureInfo['reason']): string {
        const descriptions: Record<EnvSetupFailureInfo['reason'], string> = {
            'timeout': '环境选择超时',
            'cancelled': '用户取消了环境选择',
            'no_environments': '没有可用环境',
            'login_failed': '登录失败',
            'tcb_init_failed': 'CloudBase 服务初始化失败',
            'env_query_failed': '环境列表查询失败',
            'env_creation_failed': '环境创建失败',
            'unknown_error': '未知错误',
        };
        return descriptions[reason] || '未知原因';
    }

    // 手动设置环境ID（用于外部调用）
    async setEnvId(envId: string) {
        this._setCachedEnvId(envId);
        debug('手动设置环境ID并更新缓存:', { envId });
    }

    // Get cached envId without triggering fetch (for optimization)
    getCachedEnvId(): string | null {
        return this.cachedEnvId;
    }
}

// 全局实例
const envManager = new EnvironmentManager();

// 导出环境ID获取函数
export async function getEnvId(cloudBaseOptions?: CloudBaseOptions): Promise<string> {
    // 如果传入了 cloudBaseOptions 且包含 envId，直接返回
    if (cloudBaseOptions?.envId) {
        debug('使用传入的 envId:', { envId: cloudBaseOptions.envId });
        return cloudBaseOptions.envId;
    }

    // 否则使用默认逻辑
    return envManager.getEnvId();
}

// 导出函数保持兼容性
export function resetCloudBaseManagerCache() {
    envManager.reset();
}

// 导出获取缓存环境ID的函数，供遥测模块使用
export function getCachedEnvId(): string | null {
    return envManager.getCachedEnvId();
}

export interface GetManagerOptions {
    requireEnvId?: boolean;
    cloudBaseOptions?: CloudBaseOptions;
    mcpServer?: any; // Optional MCP server instance for IDE detection (e.g., CodeBuddy)
}

/**
 * 每次都实时获取最新的 token/secretId/secretKey
 */
export async function getCloudBaseManager(options: GetManagerOptions = {}): Promise<CloudBase> {
    const { requireEnvId = true, cloudBaseOptions, mcpServer } = options;

    // 如果传入了 cloudBaseOptions，直接使用传入的配置
    if (cloudBaseOptions) {
        debug('使用传入的 CloudBase 配置');
        return createCloudBaseManagerWithOptions(cloudBaseOptions);
    }

    try {
        const loginState = await getLoginState();
        const {
            envId: loginEnvId,
            secretId,
            secretKey,
            token
        } = loginState;

        let finalEnvId: string | undefined;
        if (requireEnvId) {
            // Optimize: Check if envManager has cached envId first (fast path)
            // If cached, use it directly; otherwise check loginEnvId before calling getEnvId()
            // This avoids unnecessary async calls when we have a valid envId available
            const cachedEnvId = envManager.getCachedEnvId();
            if (cachedEnvId) {
                debug('使用 envManager 缓存的环境ID:', {cachedEnvId});
                finalEnvId = cachedEnvId;
            } else if (loginEnvId) {
                // If no cache but loginState has envId, use it to avoid triggering auto-setup
                debug('使用 loginState 中的环境ID:', {loginEnvId});
                finalEnvId = loginEnvId;
            } else {
                // Only call envManager.getEnvId() when neither cache nor loginState has envId
                // This may trigger auto-setup flow (pass mcpServer for IDE detection)
                finalEnvId = await envManager.getEnvId(mcpServer);
            }
        }

        // envId priority: envManager.cachedEnvId > envManager.getEnvId() > loginState.envId > undefined
        // Note: envManager.cachedEnvId has highest priority as it reflects user's latest environment switch
        const manager = new CloudBase({
            secretId,
            secretKey,
            envId: finalEnvId || loginEnvId,
            token,
            proxy: process.env.http_proxy,
        });
        return manager;
    } catch (err) {
        error('Failed to initialize CloudBase Manager:', err instanceof Error ? err : new Error(String(err)));
        throw err;
    }
}

/**
 * 使用传入的 CloudBase 配置创建 manager，不使用缓存
 * @param cloudBaseOptions 传入的 CloudBase 配置选项
 * @returns CloudBase manager 实例
 */
export function createCloudBaseManagerWithOptions(cloudBaseOptions: CloudBaseOptions): CloudBase {
    debug('使用传入的 CloudBase 配置创建 manager:', cloudBaseOptions);

    const manager = new CloudBase({
        ...cloudBaseOptions,
        proxy: cloudBaseOptions.proxy || process.env.http_proxy,
    });

    return manager;
}

/**
 * Extract RequestId from result object
 */
export function extractRequestId(result: any): string | undefined {
    if (!result || typeof result !== 'object') {
        return undefined;
    }

    // Try common RequestId field names
    if ('RequestId' in result && result.RequestId) {
        return String(result.RequestId);
    }
    if ('requestId' in result && result.requestId) {
        return String(result.requestId);
    }
    if ('request_id' in result && result.request_id) {
        return String(result.request_id);
    }

    return undefined;
}

/**
 * Log CloudBase manager call result with RequestId
 */
export function logCloudBaseResult(logger: Logger | undefined, result: any): void {
    if (!logger) {
        return;
    }

    const requestId = extractRequestId(result);
    logger({
        type: 'capiResult',
        requestId,
        result,
    });
}

// 导出环境管理器实例供其他地方使用
export { envManager };
