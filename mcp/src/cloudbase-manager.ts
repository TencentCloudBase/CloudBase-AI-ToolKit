import CloudBase from "@cloudbase/manager-node";
import { getLoginState } from './auth.js';
import { autoSetupEnvironmentId } from './tools/interactive.js';
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
            const autoEnvId = await autoSetupEnvironmentId(mcpServer);
            if (!autoEnvId) {
                throw new Error("CloudBase Environment ID not found after auto setup. Please set CLOUDBASE_ENV_ID or run setupEnvironmentId tool.");
            }

            debug('自动设置环境ID成功:', { envId: autoEnvId });
            this._setCachedEnvId(autoEnvId);
            return autoEnvId;

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
