import { z } from "zod";
import { getLoginState } from "../auth.js";
import {
  envManager,
  getCloudBaseManager,
  logCloudBaseResult,
} from "../cloudbase-manager.js";
import { getInteractiveServer } from "../interactive-server.js";
import { ExtendedMcpServer } from "../server.js";
import { isCloudMode } from "../utils/cloud-mode.js";
import { debug, error, warn } from "../utils/logger.js";
import { telemetryReporter } from "../utils/telemetry.js";
import {
  checkAndCreateFreeEnv,
  checkAndInitTcbService,
  getUinForTelemetry,
  type EnvSetupContext
} from "./env-setup.js";

/**
 * Call CAM API to get user AppId without depending on loginState
 * @returns User info including Uin, OwnerUin, and AppId
 */
async function getUserAppIdFromCam(): Promise<{ Uin: string; OwnerUin: string; AppId: number } | null> {
  try {
    debug("[interactive] Calling CAM API GetUserAppId via commonService...");
    
    const cloudbase = await getCloudBaseManager({
      requireEnvId: false,
    });
    
    const result = await cloudbase.commonService("cam").call({
      Action: "GetUserAppId",
      Param: {},
    });
    
    debug("[interactive] CAM API call succeeded:", result);
    
    // CAM API returns data directly at top level, not wrapped in Response
    if (result && (result.Uin || result.uin)) {
      return {
        Uin: result.Uin || result.uin || "",
        OwnerUin: result.OwnerUin || result.ownerUin || "",
        AppId: result.AppId || result.appId || 0,
      };
    }
    
    // Fallback: try Response wrapper (for compatibility)
    if (result && result.Response) {
      return {
        Uin: result.Response.Uin || result.Response.uin || "",
        OwnerUin: result.Response.OwnerUin || result.Response.ownerUin || "",
        AppId: result.Response.AppId || result.Response.appId || 0,
      };
    }
    
    return null;
  } catch (error) {
    debug("[interactive] Failed to get user AppId from CAM API:", 
      error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export function registerInteractiveTools(server: ExtendedMcpServer) {
  // 统一的交互式对话工具 (cloud-incompatible)
  server.registerTool(
    "interactiveDialog",
    {
      title: "交互式对话",
      description:
        "统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm",
      inputSchema: {
        type: z
          .enum(["clarify", "confirm"])
          .describe("交互类型: clarify=需求澄清, confirm=任务确认"),
        message: z.string().optional().describe("对话消息内容"),
        options: z.array(z.string()).optional().describe("可选的预设选项"),
        forceUpdate: z.boolean().optional().describe("是否强制更新环境ID配置"),
        risks: z.array(z.string()).optional().describe("操作风险提示"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        category: "interactive",
      },
    },
    async ({
      type,
      message,
      options,
      forceUpdate = false,
      risks,
    }: {
      type: "clarify" | "confirm";
      message?: string;
      options?: string[];
      forceUpdate?: boolean;
      risks?: string[];
    }) => {
      try {
        switch (type) {
          case "clarify": {
            if (!message) {
              throw new Error("需求澄清必须提供message参数");
            }

            const interactiveServer = getInteractiveServer(server);
            const result = await interactiveServer.clarifyRequest(
              message,
              options,
            );

            if (result.cancelled) {
              return {
                content: [{ type: "text", text: "用户取消了需求澄清" }],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `📝 用户澄清反馈:\n${result.data}`,
                },
              ],
            };
          }

          case "confirm": {
            if (!message) {
              throw new Error("任务确认必须提供message参数");
            }

            let dialogMessage = `🎯 即将执行任务:\n${message}`;

            if (risks && risks.length > 0) {
              dialogMessage += `\n\n⚠️ 风险提示:\n${risks.map((risk) => `• ${risk}`).join("\n")}`;
            }

            dialogMessage += `\n\n是否继续执行此任务？`;

            const dialogOptions = options || [
              "确认执行",
              "取消操作",
              "需要修改任务",
            ];

            const interactiveServer = getInteractiveServer(server);
            const result = await interactiveServer.clarifyRequest(
              dialogMessage,
              dialogOptions,
            );

            if (
              result.cancelled ||
              (result.data &&
                result.data.includes &&
                result.data.includes("取消"))
            ) {
              return {
                content: [{ type: "text", text: "❌ 用户取消了任务执行" }],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `✅ 用户确认: ${result.data}`,
                },
              ],
            };
          }

          default:
            throw new Error(`不支持的交互类型: ${type}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `交互对话出错: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

// 封装了获取环境、提示选择、保存配置的核心逻辑
export async function _promptAndSetEnvironmentId(
  autoSelectSingle: boolean,
  options?: { server?: any; loginFromCloudBaseLoginPage?: boolean; ignoreEnvVars?: boolean },
): Promise<{
  selectedEnvId: string | null;
  cancelled: boolean;
  error?: string;
  noEnvs?: boolean;
  switch?: boolean;
}> {
  const server = options?.server;

  // Initialize setup context for auto-provisioning flow
  let setupContext: EnvSetupContext = {};

  debug("[interactive] Starting _promptAndSetEnvironmentId", {
    autoSelectSingle,
    hasServer: !!server,
    serverType: typeof server,
    serverIsPromise: server instanceof Promise,
    hasServerServer: !!server?.server,
    hasServerIde: !!server?.ide,
    ignoreEnvVars: options?.ignoreEnvVars,
    optionsKeys: options ? Object.keys(options).join(', ') : 'null',
  });
  
  if (!server) {
    error("[interactive] CRITICAL: options?.server is undefined! This will cause IDE detection to fail.");
    error("[interactive] options object:", options);
  }

  // 1. 确保用户已登录
  debug("[interactive] Step 1: Checking login state...");
  const loginState = await getLoginState({
    fromCloudBaseLoginPage: options?.loginFromCloudBaseLoginPage,
    ignoreEnvVars: options?.ignoreEnvVars,
  });
  debug("[interactive] Login state:", {
    hasLoginState: !!loginState,
    hasUin: !!(
      loginState && typeof loginState === "object" && "uin" in loginState
    ),
  });
  if (!loginState) {
    debug("[interactive] User not logged in");
    return {
      selectedEnvId: null,
      cancelled: false,
      error: "请先登录云开发账户",
    };
  }

  // Get UIN for telemetry
  debug("[interactive] Getting UIN for telemetry...");
  setupContext.uin = await getUinForTelemetry();
  debug("[interactive] UIN retrieved:", { uin: setupContext.uin });

  // 2. 获取CloudBase manager and check/init TCB service
  // Fix: Pass cloudBaseOptions to ensure correct environment context
  debug("[interactive] Step 2: Getting CloudBase manager...");
  const serverCloudBaseOptions = server?.cloudBaseOptions;
  const cloudbase = await getCloudBaseManager({
    requireEnvId: false,
    cloudBaseOptions: serverCloudBaseOptions,
  });
  debug("[interactive] CloudBase manager obtained");

  // Step 2.1: Check and initialize TCB service if needed
  // Check if retry is requested (from interactive server session data)
  // Ensure server is resolved if it's a Promise (CLI mode)
  // IMPORTANT: server from options is ExtendedMcpServer instance, not a Promise
  // But we need to ensure it's properly passed through the chain
  let resolvedServer = server instanceof Promise ? await server : server;
  
  // FALLBACK: If server is not provided, try to get from existing InteractiveServer instance
  // This handles the case when autoSetupEnvironmentId is called without server parameter
  // Note: In CloudMode with multiple server instances, this may not work perfectly,
  // but it's better than nothing. The ideal solution is to always pass server parameter.
  if (!resolvedServer) {
    debug("[interactive] server is undefined, trying to get from existing InteractiveServer instance...");
    const existingInteractiveServer = getInteractiveServer();
    if (existingInteractiveServer && existingInteractiveServer.mcpServer) {
      resolvedServer = existingInteractiveServer.mcpServer;
      debug("[interactive] Got server from existing InteractiveServer instance:", {
        hasServer: !!resolvedServer,
        hasServerServer: !!resolvedServer?.server,
        hasIde: !!resolvedServer?.ide
      });
    } else {
      warn("[interactive] WARNING: resolvedServer is undefined and no existing InteractiveServer instance found!");
      warn("[interactive] This may happen when autoSetupEnvironmentId is called before any tool that sets mcpServer.");
      warn("[interactive] IDE detection (e.g., CodeBuddy) will fail, and browser will be opened instead.");
    }
  }
  
  debug("[interactive] Resolved server:", {
    isPromise: server instanceof Promise,
    hasServer: !!resolvedServer,
    hasServerServer: !!resolvedServer?.server,
    hasIde: !!resolvedServer?.ide,
    ide: resolvedServer?.ide || process.env.INTEGRATION_IDE,
    serverType: typeof resolvedServer,
    serverKeys: resolvedServer ? Object.keys(resolvedServer).slice(0, 10).join(', ') : 'null'
  });
  
  const interactiveServer = getInteractiveServer(resolvedServer);
  const currentSessionId = server?.currentSessionId; // We need to pass this somehow
  let shouldRetry = false;
  
  if (currentSessionId) {
    const sessionData = (interactiveServer as any).sessionData?.get(currentSessionId);
    if (sessionData?.retryInitTcb) {
      shouldRetry = true;
      sessionData.retryInitTcb = false; // Clear retry flag
      debug("[interactive] Retry InitTcb requested, will retry initialization");
    }
  }
  
  debug("[interactive] Step 2.1: Checking and initializing TCB service...", { shouldRetry });
  
  // If retry is requested and we have an error, force re-initialization
  if (shouldRetry && setupContext.initTcbError) {
    debug("[interactive] Retrying InitTcb due to user request");
    // Reset context to force re-initialization
    setupContext.tcbServiceInitialized = false;
    setupContext.initTcbError = undefined;
  }
  
  setupContext = await checkAndInitTcbService(cloudbase, setupContext);
  debug("[interactive] TCB service setup completed:", {
    tcbServiceChecked: setupContext.tcbServiceChecked,
    tcbServiceInitialized: setupContext.tcbServiceInitialized,
    hasInitTcbError: !!setupContext.initTcbError,
    initTcbError: setupContext.initTcbError ? {
      code: setupContext.initTcbError.code,
      message: setupContext.initTcbError.message,
      needCamAuth: setupContext.initTcbError.needCamAuth,
      needRealNameAuth: setupContext.initTcbError.needRealNameAuth
    } : undefined
  });

  // 3. 获取可用环境列表（使用过滤参数）
  debug("[interactive] Step 3: Querying environment list...");
  let envResult;
  let queryEnvSuccess = false;
  let queryEnvError: string | undefined;

  try {
    // Use commonService to call DescribeEnvs with filter parameters
    // Filter parameters match the reference conditions provided by user
    const queryParams = {
      EnvTypes: ["weda", "baas"], // Include weda and baas (normal) environments
      IsVisible: false, // Filter out invisible environments
      Channels: ["dcloud", "iotenable", "tem", "scene_module"], // Filter special channels
    };
    debug("[interactive] DescribeEnvs params:", queryParams);
    
    envResult = await cloudbase.commonService("tcb").call({
      Action: "DescribeEnvs",
      Param: queryParams,
    });
    logCloudBaseResult(server?.logger, envResult);
    // Transform response format to match original listEnvs() format
    if (envResult && envResult.EnvList) {
      envResult = { EnvList: envResult.EnvList };
    } else if (envResult && envResult.Data && envResult.Data.EnvList) {
      envResult = { EnvList: envResult.Data.EnvList };
    } else {
      // Fallback to original method if format is unexpected
      debug("Unexpected response format, falling back to listEnvs()");
      envResult = await cloudbase.env.listEnvs();
      logCloudBaseResult(server?.logger, envResult);
    }
    queryEnvSuccess = true;
  } catch (error) {
    queryEnvError = error instanceof Error ? error.message : String(error);
    debug("获取环境ID时出错，尝试降级到 listEnvs():", error instanceof Error ? error : new Error(String(error)));
    // Fallback to original method on error
    try {
      envResult = await cloudbase.env.listEnvs();
      logCloudBaseResult(server?.logger, envResult);
      queryEnvSuccess = true;
    } catch (fallbackError) {
      queryEnvError = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      debug("降级到 listEnvs() 也失败:", fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
    }
  }

  // Report query_env_list event
  await telemetryReporter.report('toolkit_env_setup', {
    step: 'query_env_list',
    success: queryEnvSuccess ? 'true' : 'false',
    uin: setupContext.uin || 'unknown',
    error: queryEnvError ? queryEnvError.substring(0, 200) : undefined,
    envCount: (envResult?.EnvList || []).length
  });

  debug("[interactive] Environment query result:", {
    hasResult: !!envResult,
    envCount: (envResult?.EnvList || []).length,
    querySuccess: queryEnvSuccess,
    queryError: queryEnvError
  });

  const { EnvList } = envResult || {};
  let selectedEnvId: string | null = null;

  // 4. 如果没有环境，尝试自动创建免费环境
  const inCloudMode = isCloudMode();
  debug("[interactive] Step 4: Checking environment count and cloud mode:", {
    envCount: EnvList?.length || 0,
    inCloudMode
  });

  if (!EnvList || EnvList.length === 0) {
    debug("[interactive] No environments found");
    
    // Report no_envs event
    await telemetryReporter.report('toolkit_env_setup', {
      step: 'no_envs',
      success: 'true',
      uin: setupContext.uin || 'unknown'
    });

    // Only try to create free environment if TCB service is initialized successfully
    // If InitTcb failed, skip environment creation
    if (!setupContext.initTcbError && setupContext.tcbServiceInitialized) {
      debug("[interactive] TCB service initialized, attempting to create free environment...");
      
      // Try to create free environment (both normal and cloud mode)
      debug("[interactive] Calling checkAndCreateFreeEnv...");
      const { success, envId, context: createContext } = 
        await checkAndCreateFreeEnv(cloudbase, setupContext);
      
      setupContext = { ...setupContext, ...createContext };

      debug("[interactive] checkAndCreateFreeEnv result:", {
        success,
        envId,
        envIdType: typeof envId,
        envIdValid: !!(envId && typeof envId === 'string' && envId.trim() !== ''),
        hasCreateEnvError: !!setupContext.createEnvError,
        createEnvError: setupContext.createEnvError ? {
          code: setupContext.createEnvError.code,
          message: setupContext.createEnvError.message
        } : undefined,
        promotionalActivities: setupContext.promotionalActivities,
        tcbServiceInitialized: setupContext.tcbServiceInitialized,
        hasInitTcbError: !!setupContext.initTcbError
      });

      // Check all possible scenarios
      debug("[interactive] Analyzing creation result:", {
        success,
        envId,
        envIdType: typeof envId,
        envIdTruthy: !!envId,
        hasCreateEnvError: !!setupContext.createEnvError,
        createEnvErrorCode: setupContext.createEnvError?.code,
        promotionalActivitiesCount: setupContext.promotionalActivities?.length || 0
      });

      if (success && envId) {
        // Validate envId before using it
        if (typeof envId === 'string' && envId.trim() !== '') {
          const trimmedEnvId = envId.trim();
          
          // Verify the environment exists by querying the list again
          // Sometimes creation is async and env might not be immediately available
          debug("[interactive] Verifying created environment exists in list...");
          try {
            const verifyResult = await cloudbase.commonService("tcb").call({
              Action: "DescribeEnvs",
              Param: {
                EnvTypes: ["weda", "baas"],
                IsVisible: false,
                Channels: ["dcloud", "iotenable", "tem", "scene_module"],
              },
            });
            
            const verifyEnvList = verifyResult?.EnvList || verifyResult?.Data?.EnvList || [];
            const envExists = verifyEnvList.some((env: any) => env.EnvId === trimmedEnvId);
            
            debug("[interactive] Environment verification result:", {
              envId: trimmedEnvId,
              exists: envExists,
              totalEnvs: verifyEnvList.length,
              envIds: verifyEnvList.map((e: any) => e.EnvId)
            });
            
            if (envExists) {
              // Auto-select the newly created environment
              selectedEnvId = trimmedEnvId;
              await envManager.setEnvId(selectedEnvId);
              debug("[interactive] Auto-selected newly created environment:", { envId: selectedEnvId });
              return { selectedEnvId, cancelled: false };
            } else {
              // Environment was created but not yet available in list
              // This might be async creation, set a helpful error
              debug("[interactive] WARNING: Environment created but not yet available in list", {
                envId: trimmedEnvId,
                availableEnvs: verifyEnvList.length
              });
              setupContext.createEnvError = {
                code: "EnvNotYetAvailable",
                message: "环境正在创建中，请稍等片刻后刷新页面或重新尝试",
                helpUrl: "https://buy.cloud.tencent.com/lowcode?buyType=tcb&channel=mcp"
              };
            }
          } catch (verifyErr) {
            // If verification fails, still try to use the envId
            debug("[interactive] Environment verification failed, using envId anyway:", {
              error: verifyErr instanceof Error ? verifyErr.message : String(verifyErr),
              envId: trimmedEnvId
            });
            selectedEnvId = trimmedEnvId;
            await envManager.setEnvId(selectedEnvId);
            debug("[interactive] Auto-selected newly created environment (verification skipped):", { envId: selectedEnvId });
            return { selectedEnvId, cancelled: false };
          }
        } else {
          debug("[interactive] ERROR: Created environment but envId is invalid:", {
            envId,
            type: typeof envId,
            value: String(envId)
          });
          // Set error if envId is invalid
          setupContext.createEnvError = {
            code: "InvalidEnvId",
            message: "环境创建成功但环境ID无效，请稍后重试",
            helpUrl: "https://buy.cloud.tencent.com/lowcode?buyType=tcb&channel=mcp"
          };
        }
      } else if (success && !envId) {
        // Success but no envId - this is a problem
        debug("[interactive] ERROR: Creation reported success but no envId returned:", {
          success,
          envId,
          promotionalActivities: setupContext.promotionalActivities
        });
        setupContext.createEnvError = {
          code: "MissingEnvId",
          message: "环境创建成功但未返回环境ID，请稍后重试或手动创建环境",
          helpUrl: "https://buy.cloud.tencent.com/lowcode?buyType=tcb&channel=mcp"
        };
      } else if (!success && !setupContext.createEnvError) {
        // Failed but no error set - this shouldn't happen but handle it
        debug("[interactive] WARNING: Environment creation failed but no error was set", {
          success,
          envId,
          promotionalActivities: setupContext.promotionalActivities,
          promotionalActivitiesCount: setupContext.promotionalActivities?.length || 0
        });
        // Set a default error message
        setupContext.createEnvError = {
          code: "CreateEnvFailed",
          message: "免费环境创建失败，请手动创建环境",
          helpUrl: "https://buy.cloud.tencent.com/lowcode?buyType=tcb&channel=mcp"
        };
      }
      
      // Log final state
      debug("[interactive] Final state after environment creation attempt:", {
        success,
        envId,
        hasCreateEnvError: !!setupContext.createEnvError,
        createEnvError: setupContext.createEnvError
      });
    } else {
      debug("[interactive] Skipping free environment creation:", {
        hasInitTcbError: !!setupContext.initTcbError,
        tcbServiceInitialized: setupContext.tcbServiceInitialized,
        reason: setupContext.initTcbError ? "TCB initialization failed" : "TCB service not initialized"
      });
    }

    // If creation failed in cloud mode, return error message
    if (inCloudMode) {
      debug("[interactive] CloudMode: Returning error message");
      let errorMsg = "未找到可用环境";
      if (setupContext.initTcbError) {
        errorMsg += `\nCloudBase 初始化失败: ${setupContext.initTcbError.message}`;
      }
      if (setupContext.createEnvError) {
        errorMsg += `\n环境创建失败: ${setupContext.createEnvError.message}`;
      }
      const helpUrl = setupContext.createEnvError?.helpUrl || setupContext.initTcbError?.helpUrl;
      if (helpUrl) {
        errorMsg += `\n请访问: ${helpUrl}`;
      }
      return {
        selectedEnvId: null,
        cancelled: false,
        error: errorMsg,
        noEnvs: true
      };
    }

    // In normal mode, show UI (even if creation failed or skipped)
    // UI will display error context if available
    debug("[interactive] Normal mode: Will show UI with error context:", {
      hasInitTcbError: !!setupContext.initTcbError,
      hasCreateEnvError: !!setupContext.createEnvError,
      skippedCreation: !setupContext.tcbServiceInitialized || !!setupContext.initTcbError
    });
  }

  // 5. CloudMode: Auto-select first environment if available
  if (inCloudMode && EnvList && EnvList.length > 0) {
    selectedEnvId = EnvList[0].EnvId;
    if (selectedEnvId) {
      debug("CloudMode: Auto-selected first environment:", { envId: selectedEnvId });
      await envManager.setEnvId(selectedEnvId);
      return { selectedEnvId, cancelled: false };
    }
  }

  // 6. 显示环境选择页面（即使只有一个环境也显示，让用户确认）
  // interactiveServer 已在前面声明，直接使用
  // 提取账号 UIN 用于显示
  // Try to get UIN from CAM API first, fallback to loginState
  const accountInfo: { uin?: string } = {};
  
  // Try to get user info from CAM API
  debug("[interactive] Attempting to get user info from CAM API...");
  const camUserInfo = await getUserAppIdFromCam();
  
  // Use OwnerUin as the main account identifier
  if (camUserInfo && camUserInfo.OwnerUin) {
    accountInfo.uin = camUserInfo.OwnerUin;
    debug("[interactive] Got OwnerUIN from CAM API:", { ownerUin: camUserInfo.OwnerUin, uin: camUserInfo.Uin });
  } else if (camUserInfo && camUserInfo.Uin) {
    // Fallback to Uin if OwnerUin is not available
    accountInfo.uin = camUserInfo.Uin;
    debug("[interactive] Got UIN from CAM API (OwnerUin not available):", { uin: camUserInfo.Uin });
  }
  
  // Fallback to loginState if CAM API didn't work
  if (!accountInfo.uin && loginState && typeof loginState === "object" && "uin" in loginState) {
    accountInfo.uin = String(loginState.uin);
    debug("[interactive] Using UIN from loginState:", { uin: accountInfo.uin });
  }

  // Report display_env_selection event
  await telemetryReporter.report('toolkit_env_setup', {
    step: 'display_env_selection',
    success: 'true',
    uin: setupContext.uin || 'unknown',
    envIds: (EnvList || []).map((env: any) => env.EnvId).join(',')
  });

  debug("[interactive] Step 6: Calling collectEnvId with error context:", {
    envCount: (EnvList || []).length,
    hasInitTcbError: !!setupContext.initTcbError,
    hasCreateEnvError: !!setupContext.createEnvError,
    initTcbError: setupContext.initTcbError,
    createEnvError: setupContext.createEnvError
  });

  const result = await interactiveServer.collectEnvId(
    EnvList || [],
    accountInfo,
    setupContext, // Pass error context
    cloudbase, // Pass manager for refreshing env list
    resolvedServer, // Pass resolved MCP server instance for IDE detection
  );

  if (result.cancelled) {
    return { selectedEnvId: null, cancelled: true };
  }
  if (result.switch) {
    // Report switch_account event
    await telemetryReporter.report('toolkit_env_setup', {
      step: 'switch_account',
      success: 'true',
      uin: setupContext.uin || 'unknown'
    });
    return { selectedEnvId: null, cancelled: false, switch: true };
  }
  selectedEnvId = result.data;

  // 7. 更新环境ID缓存
  if (selectedEnvId) {
    // Update memory cache and process.env to prevent environment mismatch
    await envManager.setEnvId(selectedEnvId);
    debug("环境ID已更新缓存:", { envId: selectedEnvId });
  }

  return { selectedEnvId, cancelled: false };
}

// 自动设置环境ID（无需MCP工具调用）
export async function autoSetupEnvironmentId(mcpServer?: any): Promise<string | null> {
  try {
    const { selectedEnvId, cancelled, error, noEnvs } =
      await _promptAndSetEnvironmentId(true, { server: mcpServer });

    if (error || noEnvs || cancelled) {
      debug("Auto setup environment ID interrupted or failed silently.", {
        error,
        noEnvs,
        cancelled,
      });
      return null;
    }

    debug("Auto setup environment ID successful.", { selectedEnvId });
    return selectedEnvId;
  } catch (error) {
    console.error("自动配置环境ID时出错:", error);
    return null;
  }
}
