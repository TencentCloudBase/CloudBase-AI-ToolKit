import { getLoginState } from './auth.js'
import { ensureEnvId, autoSetupEnvironmentId } from './tools/interactive.js'
import CloudBase from "@cloudbase/manager-node";
import { debug,error } from './utils/logger.js';

let initializationPromise: Promise<CloudBase> | null = null;
let noEnvIdInitializationPromise: Promise<CloudBase> | null = null;
const INITIALIZATION_TIMEOUT = 30000; // 30 seconds

interface GetManagerOptions {
    requireEnvId?: boolean;
}

export function getCloudBaseManager(options: GetManagerOptions = {}): Promise<CloudBase> {
    const { requireEnvId = true } = options;

    if (requireEnvId) {
        if (initializationPromise) {
            return initializationPromise;
        }

        const executor = async (): Promise<CloudBase> => {
            try {
                // 检查并确保环境ID已配置
                let userEnvId = await ensureEnvId();
                if (!userEnvId) {
                    debug("未找到环境ID，尝试自动设置...");
                    userEnvId = await autoSetupEnvironmentId();
                    
                    if (!userEnvId) {
                        throw new Error("CloudBase Environment ID not found after auto setup. Please set CLOUDBASE_ENV_ID or run setupEnvironmentId tool.");
                    }
                }

                const loginState = await getLoginState()
                const {
                    envId,
                    secretId,
                    secretKey,
                    token
                } = loginState;

                const manager = new CloudBase({
                    secretId,
                    secretKey,
                    envId: userEnvId,
                    token,
                    proxy: process.env.http_proxy
                });

                return manager;
            } catch (err) {
                error('Failed to initialize CloudBase Manager:', err);
                throw err;
            }
        };

        const timeoutPromise = new Promise<CloudBase>((_, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error(`CloudBase Manager initialization timed out after ${INITIALIZATION_TIMEOUT / 1000} seconds.`));
            }, INITIALIZATION_TIMEOUT);
        });

        initializationPromise = Promise.race([executor(), timeoutPromise]);
        
        initializationPromise.catch(() => {
            initializationPromise = null;
        });

        return initializationPromise;
    }

    if (noEnvIdInitializationPromise) {
        return noEnvIdInitializationPromise;
    }

    const noEnvIdExecutor = async (): Promise<CloudBase> => {
        try {
            const loginState = await getLoginState();
            const {
                secretId,
                secretKey,
                token
            } = loginState;

            const manager = new CloudBase({
                secretId,
                secretKey,
                token,
                proxy: process.env.http_proxy
            });

            return manager;
        } catch (err) {
            error('Failed to initialize CloudBase Manager (no envId):', err instanceof Error ? err.message : String(err));
            throw err;
        }
    };
    
    const timeoutPromise = new Promise<CloudBase>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`CloudBase Manager (no envId) initialization timed out after ${INITIALIZATION_TIMEOUT / 1000} seconds.`));
        }, INITIALIZATION_TIMEOUT);
    });

    noEnvIdInitializationPromise = Promise.race([noEnvIdExecutor(), timeoutPromise]);

    noEnvIdInitializationPromise.catch(() => {
        noEnvIdInitializationPromise = null;
    });

    return noEnvIdInitializationPromise;
}