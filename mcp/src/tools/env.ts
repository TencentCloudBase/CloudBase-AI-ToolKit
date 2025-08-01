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
        openWorldHint: true,
        category: "env"
      }
    },
    async ({ forceUpdate = false }: { forceUpdate?: boolean }) => {
      try {
        const { selectedEnvId, cancelled, error, noEnvs } = await _promptAndSetEnvironmentId(forceUpdate, server);

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
        openWorldHint: false,
        category: "env"
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

  // envQuery - 环境查询（合并 listEnvs + getEnvInfo + getEnvAuthDomains）
  server.registerTool?.(
    "envQuery",
    {
      title: "环境查询",
      description: "查询云开发环境相关信息，支持查询环境列表、当前环境信息和安全域名。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains，为兼容旧AI规则可继续使用这些名称）",
      inputSchema: {
        action: z.enum(["list", "info", "domains"]).describe("查询类型：list=环境列表，info=当前环境信息，domains=安全域名列表")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "env"
      }
    },
    async ({ action }: { action: "list" | "info" | "domains" }) => {
      try {
        let result;
        
        switch (action) {
          case "list":
            const cloudbaseList = await getCloudBaseManager({ cloudBaseOptions, requireEnvId: false });
            result = await cloudbaseList.env.listEnvs();
            break;
            
          case "info":
            const cloudbaseInfo = await getManager();
            result = await cloudbaseInfo.env.getEnvInfo();
            break;
            
          case "domains":
            const cloudbaseDomains = await getManager();
            result = await cloudbaseDomains.env.getEnvAuthDomains();
            break;
            
          default:
            throw new Error(`不支持的查询类型: ${action}`);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `环境查询失败: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // envDomainManagement - 环境域名管理（合并 createEnvDomain + deleteEnvDomain）
  server.registerTool?.(
    "envDomainManagement",
    {
      title: "环境域名管理",
      description: "管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称）",
      inputSchema: {
        action: z.enum(["create", "delete"]).describe("操作类型：create=添加域名，delete=删除域名"),
        domains: z.array(z.string()).describe("安全域名数组")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false, // 注意：delete操作虽然是破坏性的，但这里采用较宽松的标注
        idempotentHint: false,
        openWorldHint: true,
        category: "env"
      }
    },
    async ({ action, domains }: { action: "create" | "delete", domains: string[] }) => {
      try {
        const cloudbase = await getManager();
        let result;
        
        switch (action) {
          case "create":
            result = await cloudbase.env.createEnvDomain(domains);
            break;
            
          case "delete":
            result = await cloudbase.env.deleteEnvDomain(domains);
            break;
            
          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `域名管理操作失败: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // updateEnvInfo - 保持独立
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
        openWorldHint: true,
        category: "env"
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
} 