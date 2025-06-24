import { z } from "zod";
import { getCloudBaseManager, resetCloudBaseManagerCache } from '../cloudbase-manager.js'
import { logout } from '../auth.js'
import { clearUserEnvId, _promptAndSetEnvironmentId } from './interactive.js'
import { debug } from '../utils/logger.js'
import { ExtendedMcpServer } from '../server.js';

export function registerEnvTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // login - 登录云开发环境
  server.registerTool?.(
    "login",
    {
      title: "登录云开发",
      description: "登录云开发环境并选择要使用的环境",
      inputSchema: {
        forceUpdate: z.boolean().optional().describe("是否强制重新选择环境")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ forceUpdate = false }: { forceUpdate?: boolean }) => {
      try {
        const { selectedEnvId, cancelled, error, noEnvs } = await _promptAndSetEnvironmentId(forceUpdate);

        debug("login", { selectedEnvId, cancelled, error, noEnvs });

        if (error) {
          return { content: [{ type: "text", text: error }] };
        }

        if (noEnvs) {
          return { content: [{ type: "text", text: "当前账户下暂无可用的云开发环境，请先在腾讯云控制台创建环境" }] };
        }

        if (cancelled) {
          return { content: [{ type: "text", text: "用户取消了登录" }] };
        }

        if (selectedEnvId) {
          return {
            content: [{
              type: "text",
              text: `✅ 登录成功，当前环境: ${selectedEnvId}`
            }]
          };
        }

        throw new Error("登录失败");
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `登录失败: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // logout - 退出云开发环境
  server.registerTool?.(
    "logout",
    {
      title: "退出登录",
      description: "退出云开发环境",
      inputSchema: {
        confirm: z.literal("yes").describe("确认操作，默认传 yes")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      try {
        // 登出账户
        await logout();
        // 清理环境ID配置
        await clearUserEnvId();
        resetCloudBaseManagerCache();
        
        return {
          content: [{
            type: "text",
            text: "✅ 已退出登录"
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `退出失败: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // listEnvs
  server.registerTool?.(
    "listEnvs",
    {
      title: "查询环境列表", 
      description: "获取所有云开发环境信息",
      inputSchema: {
        confirm: z.literal("yes").describe("确认操作，默认传 yes")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async () => {
      const cloudbase = await getCloudBaseManager({ cloudBaseOptions, requireEnvId: false })
      const result = await cloudbase.env.listEnvs();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // getEnvAuthDomains
  server.registerTool?.(
    "getEnvAuthDomains",
    {
      title: "查询安全域名",
      description: "获取云开发环境的合法域名列表",
      inputSchema: {
        confirm: z.literal("yes").describe("确认操作，默认传 yes")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async () => {
      const cloudbase = await getManager()
      const result = await cloudbase.env.getEnvAuthDomains();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // createEnvDomain
  server.registerTool?.(
    "createEnvDomain",
    {
      title: "添加安全域名",
      description: "为云开发环境添加安全域名",
      inputSchema: {
        domains: z.array(z.string()).describe("安全域名数组")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ domains }: { domains: string[] }) => {
      const cloudbase = await getManager()
      const result = await cloudbase.env.createEnvDomain(domains);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // deleteEnvDomain
  server.registerTool?.(
    "deleteEnvDomain",
    {
      title: "删除安全域名",
      description: "删除云开发环境的指定安全域名",
      inputSchema: {
        domains: z.array(z.string()).describe("安全域名数组")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ domains }: { domains: string[] }) => {
      const cloudbase = await getManager()
      const result = await cloudbase.env.deleteEnvDomain(domains);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // getEnvInfo
  server.registerTool?.(
    "getEnvInfo", 
    {
      title: "查询环境信息",
      description: "获取当前云开发环境信息",
      inputSchema: {
        confirm: z.literal("yes").describe("确认操作，默认传 yes")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true
      }
    },
    async () => {
      const cloudbase = await getManager()
      const result = await cloudbase.env.getEnvInfo();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // updateEnvInfo
  server.registerTool?.(
    "updateEnvInfo",
    {
      title: "更新环境信息",
      description: "更新云开发环境信息",
      inputSchema: {
        alias: z.string().describe("环境别名")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ alias }: { alias: string }) => {
      const cloudbase = await getManager()
      const result = await cloudbase.env.updateEnvInfo(alias);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // // getLoginConfigList
  // server.tool(
  //   "getLoginConfigList",
  //   "拉取登录配置列表",
  //   {},
  //   async () => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.env.getLoginConfigList();
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // createLoginConfig
  // server.tool(
  //   "createLoginConfig",
  //   "创建登录方式",
  //   {
  //     platform: z.enum(["WECHAT-OPEN", "WECHAT-PUBLIC", "QQ", "ANONYMOUS"]).describe("平台类型"),
  //     appId: z.string().describe("第三方平台的AppID"),
  //     appSecret: z.string().optional().describe("第三方平台的AppSecret")
  //   },
  //   async ({ platform, appId, appSecret }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.env.createLoginConfig(platform, appId, appSecret);
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // updateLoginConfig
  // server.tool(
  //   "updateLoginConfig",
  //   "更新登录方式配置",
  //   {
  //     configId: z.string().describe("配置的记录ID"),
  //     status: z.enum(["ENABLE", "DISABLE"]).describe("配置状态"),
  //     appId: z.string().describe("第三方平台的AppId"),
  //     appSecret: z.string().optional().describe("第三方平台的AppSecret")
  //   },
  //   async ({ configId, status, appId, appSecret }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.env.updateLoginConfig(configId, status, appId, appSecret);
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );

  // // createCustomLoginKeys
  // server.tool(
  //   "createCustomLoginKeys",
  //   "创建自定义登录密钥",
  //   {},
  //   async () => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.env.createCustomLoginKeys();
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(result, null, 2)
  //         }
  //       ]
  //     };
  //   }
  // );
} 