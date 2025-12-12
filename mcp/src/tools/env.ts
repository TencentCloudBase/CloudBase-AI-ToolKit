import { z } from "zod";
import { logout } from "../auth.js";
import {
  getCloudBaseManager,
  logCloudBaseResult,
  resetCloudBaseManagerCache,
} from "../cloudbase-manager.js";
import { ExtendedMcpServer } from "../server.js";
import { debug } from "../utils/logger.js";
import { _promptAndSetEnvironmentId } from "./interactive.js";
import { getClaudePrompt } from "./rag.js";

export function registerEnvTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  const getManager = () => getCloudBaseManager({ cloudBaseOptions, mcpServer: server });

  // login - 登录云开发环境
  server.registerTool?.(
    "login",
    {
      title: "登录云开发",
      description:
        "登录云开发环境，在生成包含云开发 CloudBase 相关功能前**必须**先调用此工具进行登录。登录云开发环境并选择要使用的环境。",
      inputSchema: {
        forceUpdate: z.boolean().optional().describe("是否强制重新选择环境"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "env",
      },
    },
    async ({ forceUpdate = false }: { forceUpdate?: boolean }) => {
      let isSwitching = false;

      try {
        // 使用 while 循环处理用户切换账号的情况
        while (true) {
          // CRITICAL: Ensure server is passed correctly
          debug("[env] Calling _promptAndSetEnvironmentId with server:", {
            hasServer: !!server,
            serverType: typeof server,
            hasServerServer: !!server?.server,
            hasServerIde: !!server?.ide,
            serverIde: server?.ide
          });
          
          const {
            selectedEnvId,
            cancelled,
            error,
            noEnvs,
            switch: switchAccount,
          } = await _promptAndSetEnvironmentId(forceUpdate, {
            server, // Pass ExtendedMcpServer instance
            loginFromCloudBaseLoginPage: isSwitching,
            // When switching account, ignore environment variables to force Web login
            ignoreEnvVars: isSwitching,
          });

          isSwitching = Boolean(switchAccount);

          debug("login", {
            selectedEnvId,
            cancelled,
            error,
            noEnvs,
            switchAccount,
          });

          if (error) {
            return { content: [{ type: "text", text: error }] };
          }

          if (cancelled) {
            return { content: [{ type: "text", text: "用户取消了登录" }] };
          }

          // 用户选择切换账号，先 logout 再重新登录
          if (switchAccount) {
            debug("User requested switch account, logging out...");
            try {
              await logout();
              resetCloudBaseManagerCache();
              debug("Logged out successfully, restarting login flow...");
              // Set isSwitching to true so next iteration will ignore env vars
              // and force Web authentication to allow account switching
              isSwitching = true;
              // 继续循环，重新显示登录界面
              continue;
            } catch (logoutError) {
              debug("Logout failed during switch", { error: logoutError });
              continue;
            }
          }

          if (selectedEnvId) {
            // Get CLAUDE.md prompt content (skip for CodeBuddy IDE)
            let promptContent = "";
            const currentIde = server.ide || process.env.INTEGRATION_IDE;
            if (currentIde !== "CodeBuddy") {
              try {
                promptContent = await getClaudePrompt();
              } catch (promptError) {
                debug("Failed to get CLAUDE prompt", { error: promptError });
                // Continue with login success even if prompt fetch fails
              }
            }

            const successMessage = `✅ 登录成功，当前环境: ${selectedEnvId}`;
            const promptMessage = promptContent
              ? `\n\n⚠️ 重要提示：后续所有云开发相关的开发工作必须严格遵循以下开发规范和最佳实践：\n\n${promptContent}`
              : "";

            return {
              content: [
                {
                  type: "text",
                  text: successMessage + promptMessage,
                },
              ],
            };
          }

          throw new Error("登录失败");
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `登录失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // logout - 退出云开发环境
  server.registerTool?.(
    "logout",
    {
      title: "退出登录",
      description: "退出云开发环境",
      inputSchema: {
        confirm: z.literal("yes").describe("确认操作，默认传 yes"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        category: "env",
      },
    },
    async () => {
      try {
        // 登出账户
        await logout();
        // 清理环境ID缓存
        resetCloudBaseManagerCache();

        return {
          content: [
            {
              type: "text",
              text: "✅ 已退出登录",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `退出失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // envQuery - 环境查询（合并 listEnvs + getEnvInfo + getEnvAuthDomains + getWebsiteConfig）
  server.registerTool?.(
    "envQuery",
    {
      title: "环境查询",
      description:
        "查询云开发环境相关信息，支持查询环境列表、当前环境信息、安全域名和静态网站托管配置。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains/getWebsiteConfig，为兼容旧AI规则可继续使用这些名称）",
      inputSchema: {
        action: z
          .enum(["list", "info", "domains", "hosting"])
          .describe(
            "查询类型：list=环境列表，info=当前环境信息，domains=安全域名列表，hosting=静态网站托管配置",
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "env",
      },
    },
    async ({ action }: { action: "list" | "info" | "domains" | "hosting" }) => {
      try {
        let result;

        switch (action) {
          case "list":
            try {
              const cloudbaseList = await getCloudBaseManager({
                cloudBaseOptions,
                requireEnvId: true,
                mcpServer: server, // Pass server for IDE detection
              });
              // Use commonService to call DescribeEnvs with filter parameters
              // Filter parameters match the reference conditions provided by user
              result = await cloudbaseList.commonService("tcb").call({
                Action: "DescribeEnvs",
                Param: {
                  EnvTypes: ["weda", "baas"], // Include weda and baas (normal) environments
                  IsVisible: false, // Filter out invisible environments
                  Channels: ["dcloud", "iotenable", "tem", "scene_module"], // Filter special channels
                },
              });
              logCloudBaseResult(server.logger, result);
              // Transform response format to match original listEnvs() format
              if (result && result.EnvList) {
                result = { EnvList: result.EnvList };
              } else if (result && result.Data && result.Data.EnvList) {
                result = { EnvList: result.Data.EnvList };
              } else {
                // Fallback to original method if format is unexpected
                debug("Unexpected response format, falling back to listEnvs()");
                result = await cloudbaseList.env.listEnvs();
                logCloudBaseResult(server.logger, result);
              }
            } catch (error) {
              debug("获取环境列表时出错，尝试降级到 listEnvs():", error instanceof Error ? error : new Error(String(error)));
              // Fallback to original method on error
              try {
                const cloudbaseList = await getCloudBaseManager({
                  cloudBaseOptions,
                  requireEnvId: true,
                  mcpServer: server, // Pass server for IDE detection
                });
                result = await cloudbaseList.env.listEnvs();
                logCloudBaseResult(server.logger, result);
              } catch (fallbackError) {
                debug("降级到 listEnvs() 也失败:", fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
                return {
                  content: [
                    {
                      type: "text",
                      text:
                        "获取环境列表时出错: " +
                        (fallbackError instanceof Error
                          ? fallbackError.message
                          : String(fallbackError)),
                    },
                  ],
                };
              }
            }
            break;

          case "info":
            const cloudbaseInfo = await getManager();
            result = await cloudbaseInfo.env.getEnvInfo();
            logCloudBaseResult(server.logger, result);
            break;

          case "domains":
            const cloudbaseDomains = await getManager();
            result = await cloudbaseDomains.env.getEnvAuthDomains();
            logCloudBaseResult(server.logger, result);
            break;

          case "hosting":
            const cloudbaseHosting = await getManager();
            result = await cloudbaseHosting.hosting.getWebsiteConfig();
            logCloudBaseResult(server.logger, result);
            break;

          default:
            throw new Error(`不支持的查询类型: ${action}`);
        }

        let responseText = JSON.stringify(result, null, 2);

        // For info action, append CLAUDE.md prompt content (skip for CodeBuddy IDE)
        const currentIde = server.ide || process.env.INTEGRATION_IDE;
        if (action === "info" && currentIde !== "CodeBuddy") {
          try {
            const promptContent = await getClaudePrompt();
            if (promptContent) {
              responseText += `\n\n⚠️ 重要提示：后续所有云开发相关的开发工作必须严格遵循以下开发规范和最佳实践：\n\n${promptContent}`;
            }
          } catch (promptError) {
            debug("Failed to get CLAUDE prompt in envQuery", {
              error: promptError,
            });
            // Continue without prompt if fetch fails
          }
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `环境查询失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );

  // envDomainManagement - 环境域名管理（合并 createEnvDomain + deleteEnvDomain）
  server.registerTool?.(
    "envDomainManagement",
    {
      title: "环境域名管理",
      description:
        "管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称）",
      inputSchema: {
        action: z
          .enum(["create", "delete"])
          .describe("操作类型：create=添加域名，delete=删除域名"),
        domains: z.array(z.string()).describe("安全域名数组"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false, // 注意：delete操作虽然是破坏性的，但这里采用较宽松的标注
        idempotentHint: false,
        openWorldHint: true,
        category: "env",
      },
    },
    async ({
      action,
      domains,
    }: {
      action: "create" | "delete";
      domains: string[];
    }) => {
      try {
        const cloudbase = await getManager();
        let result;

        switch (action) {
          case "create":
            result = await cloudbase.env.createEnvDomain(domains);
            logCloudBaseResult(server.logger, result);
            break;

          case "delete":
            result = await cloudbase.env.deleteEnvDomain(domains);
            logCloudBaseResult(server.logger, result);
            break;

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `域名管理操作失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
