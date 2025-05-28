import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { logout } from '../auth.js'

export function registerEnvTools(server: McpServer) {
  // logout
  server.tool(
    "logout",
    "登出当前云开发账户",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async ({ confirm }) => {
      const result = await logout();
      return {
        content: [
          {
            type: "text",
            text: "success"
          }
        ]
      };
    }
  );

  // listEnvs
  server.tool(
    "listEnvs",
    "获取所有云开发环境信息",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
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
  server.tool(
    "getEnvAuthDomains",
    "获取云开发环境的合法域名列表",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
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
  server.tool(
    "createEnvDomain",
    "为云开发环境添加安全域名",
    {
      domains: z.array(z.string()).describe("安全域名数组")
    },
    async ({ domains }) => {
      const cloudbase = await getCloudBaseManager()
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
  server.tool(
    "deleteEnvDomain",
    "删除云开发环境的指定安全域名",
    {
      domains: z.array(z.string()).describe("安全域名数组")
    },
    async ({ domains }) => {
      const cloudbase = await getCloudBaseManager()
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
  server.tool(
    "getEnvInfo",
    "获取当前云开发环境信息",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
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
  server.tool(
    "updateEnvInfo",
    "修改云开发环境别名",
    {
      alias: z.string().describe("环境别名")
    },
    async ({ alias }) => {
      const cloudbase = await getCloudBaseManager()
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