import { getLoginState } from './auth.js'
import { ensureEnvId, autoSetupEnvironmentId } from './tools/interactive.js'
import CloudBase from "@cloudbase/manager-node";
import { debug, error } from './utils/logger.js';

const ENV_ID_TIMEOUT = 30000; // 30 seconds

let cachedEnvId: string | null = null;
let envIdPromise: Promise<string> | null = null;

async function getEnvIdWithCache(): Promise<string> {
    if (cachedEnvId) return cachedEnvId;
    if (envIdPromise) return envIdPromise;

    envIdPromise = (async () => {
        let userEnvId = await ensureEnvId();
        if (!userEnvId) {
            debug("未找到环境ID，尝试自动设置...");
            userEnvId = await autoSetupEnvironmentId();
            if (!userEnvId) {
                throw new Error("CloudBase Environment ID not found after auto setup. Please set CLOUDBASE_ENV_ID or run setupEnvironmentId tool.");
            }
        }
        cachedEnvId = userEnvId;
        return userEnvId;
    })();

    // 增加超时保护
    const timeoutPromise = new Promise<string>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`EnvId 获取超时（${ENV_ID_TIMEOUT / 1000}秒）`));
        }, ENV_ID_TIMEOUT);
    });

    return Promise.race([envIdPromise, timeoutPromise])
        .catch(err => {
            envIdPromise = null;
            throw err;
        });
}

interface GetManagerOptions {
    requireEnvId?: boolean;
}

/**
 * 每次都实时获取最新的 token/secretId/secretKey
 */
export async function getCloudBaseManager(options: GetManagerOptions = {}): Promise<CloudBase> {
    const { requireEnvId = true } = options;

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
            finalEnvId = await getEnvIdWithCache();
        }

        // envId 优先顺序：cache > loginState > undefined
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