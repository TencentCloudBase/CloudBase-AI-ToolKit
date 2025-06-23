import { getLoginState } from './auth.js'
import { loadEnvIdFromUserConfig, saveEnvIdToUserConfig, autoSetupEnvironmentId } from './tools/interactive.js'
import CloudBase from "@cloudbase/manager-node";
import { debug, error } from './utils/logger.js';
import { CloudBaseOptions } from './types.js';
const ENV_ID_TIMEOUT = 300000; // 300 seconds

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
    async getEnvId(): Promise<string> {
        // 1. 优先使用内存缓存
        if (this.cachedEnvId) {
            debug('使用内存缓存的环境ID:', this.cachedEnvId);
            return this.cachedEnvId;
        }

        // 2. 如果正在获取中，等待结果
        if (this.envIdPromise) {
            return this.envIdPromise;
        }

        // 3. 开始获取环境ID
        this.envIdPromise = this._fetchEnvId();

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

    private async _fetchEnvId(): Promise<string> {
        try {
            // 1. 检查进程环境变量
            if (process.env.CLOUDBASE_ENV_ID) {
                debug('使用进程环境变量的环境ID:', process.env.CLOUDBASE_ENV_ID);
                this.cachedEnvId = process.env.CLOUDBASE_ENV_ID;
                return this.cachedEnvId;
            }

            // 2. 从配置文件读取
            const fileEnvId = await loadEnvIdFromUserConfig();
            if (fileEnvId) {
                debug('从配置文件读取到环境ID:', fileEnvId);
                this._setCachedEnvId(fileEnvId);
                return fileEnvId;
            }

            // 3. 自动设置环境ID
            debug('未找到环境ID，尝试自动设置...');
            const autoEnvId = await autoSetupEnvironmentId();
            if (!autoEnvId) {
                throw new Error("CloudBase Environment ID not found after auto setup. Please set CLOUDBASE_ENV_ID or run setupEnvironmentId tool.");
            }

            debug('自动设置环境ID成功:', autoEnvId);
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
        debug('已更新环境ID缓存:', envId);
    }

    // 手动设置环境ID（用于外部调用）
    async setEnvId(envId: string) {
        this._setCachedEnvId(envId);
        // 同步保存到配置文件
        await saveEnvIdToUserConfig(envId);
        debug('手动设置环境ID并保存到文件:', envId);
    }
}

// 全局实例
const envManager = new EnvironmentManager();

// 导出环境ID获取函数
export async function getEnvId(cloudBaseOptions?: CloudBaseOptions): Promise<string> {
    // 如果传入了 cloudBaseOptions 且包含 envId，直接返回
    if (cloudBaseOptions?.envId) {
        debug('使用传入的 envId:', cloudBaseOptions.envId);
        return cloudBaseOptions.envId;
    }

    // 否则使用默认逻辑
    return envManager.getEnvId();
}

// 导出函数保持兼容性
export function resetCloudBaseManagerCache() {
    envManager.reset();
}

export interface GetManagerOptions {
    requireEnvId?: boolean;
    cloudBaseOptions?: CloudBaseOptions;
}

/**
 * 每次都实时获取最新的 token/secretId/secretKey
 */
export async function getCloudBaseManager(options: GetManagerOptions = {}): Promise<CloudBase> {
    const { requireEnvId = true, cloudBaseOptions } = options;

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
            finalEnvId = await envManager.getEnvId();
        }

        // envId 优先顺序：获取到的envId > loginState中的envId > undefined
        const manager = new CloudBase({
            secretId,
            secretKey,
            envId: finalEnvId || loginEnvId,
            token,
            proxy: process.env.http_proxy
        });
        return manager;
    } catch (err) {
        error('Failed to initialize CloudBase Manager:', err instanceof Error ? err.message : String(err));
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
        secretId: cloudBaseOptions.secretId,
        secretKey: cloudBaseOptions.secretKey,
        envId: cloudBaseOptions.envId,
        token: cloudBaseOptions.token,
        proxy: cloudBaseOptions.proxy || process.env.http_proxy,
        region: cloudBaseOptions.region,
        envType: cloudBaseOptions.envType
    });

    return manager;
}

// 导出环境管理器实例供其他地方使用
export { envManager };