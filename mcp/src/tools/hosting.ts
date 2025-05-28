import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'

// 定义扩展的EnvInfo接口，包含StaticStorages属性
interface ExtendedEnvInfo {
  EnvInfo: {
    StaticStorages?: Array<{
      StaticDomain: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export function registerHostingTools(server: McpServer) {
  // uploadFiles - 上传文件到静态网站托管
  server.tool(
    "uploadFiles",
    "上传文件到静态网站托管",
    {
      localPath: z.string().optional().describe("本地文件或文件夹路径，需要是绝对路径，例如 /tmp/files/data.txt"),
      cloudPath: z.string().optional().describe("云端文件或文件夹路径，例如files/data.txt"),
      files: z.array(z.object({
        localPath: z.string(),
        cloudPath: z.string()
      })).default([]).describe("多文件上传配置"),
      ignore: z.union([z.string(), z.array(z.string())]).optional().describe("忽略文件模式")
    },
    async ({ localPath, cloudPath, files, ignore }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.uploadFiles({
        localPath,
        cloudPath,
        files,
        ignore
      });
      
      // 获取环境信息
      const envInfo = await cloudbase.env.getEnvInfo() as ExtendedEnvInfo;
      
      // 获取静态网站地址
      let staticDomain = "";
      if (envInfo?.EnvInfo?.StaticStorages && envInfo.EnvInfo.StaticStorages.length > 0) {
        staticDomain = envInfo.EnvInfo.StaticStorages[0].StaticDomain;
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              uploadResult: result?.files.map((item: { Key: any; }) => {
                return item.Key
              }),
              staticWebsiteUrl: staticDomain ? `https://${staticDomain}` : "",
              // 返回文件的完整访问URL
              fileUrl: staticDomain && cloudPath ? `https://${staticDomain}/${cloudPath}` : ""
            }, null, 2)
          }
        ]
      };
    }
  );

  // listFiles - 获取文件列表
  server.tool(
    "listFiles",
    "获取静态网站托管的文件列表",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.listFiles();
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

  // deleteFiles - 删除文件
  server.tool(
    "deleteFiles",
    "删除静态网站托管的文件或文件夹",
    {
      cloudPath: z.string().describe("云端文件或文件夹路径"),
      isDir: z.boolean().default(false).describe("是否为文件夹")
    },
    async ({ cloudPath, isDir }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.deleteFiles({
        cloudPath,
        isDir
      });
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

  // findFiles - 搜索文件
  server.tool(
    "findFiles",
    "搜索静态网站托管的文件",
    {
      prefix: z.string().describe("匹配前缀"),
      marker: z.string().optional().describe("起始对象键标记"),
      maxKeys: z.number().optional().describe("单次返回最大条目数")
    },
    async ({ prefix, marker, maxKeys }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.findFiles({
        prefix,
        marker,
        maxKeys
      });
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

  // // setWebsiteDocument - 配置静态网站文档
  // server.tool(
  //   "setWebsiteDocument",
  //   "配置静态网站的错误文档、索引文档和重定向规则",
  //   {
  //     indexDocument: z.string().describe("索引文档路径"),
  //     errorDocument: z.string().optional().describe("错误文档路径"),
  //     routingRules: z.array(z.object({
  //       keyPrefixEquals: z.string().optional(),
  //       httpErrorCodeReturnedEquals: z.string().optional(),
  //       replaceKeyWith: z.string().optional(),
  //       replaceKeyPrefixWith: z.string().optional()
  //     })).optional().describe("重定向规则")
  //   },
  //   async ({ indexDocument, errorDocument, routingRules }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.hosting.setWebsiteDocument({
  //       indexDocument,
  //       errorDocument,
  //       routingRules
  //     });
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

  // createHostingDomain - 绑定自定义域名
  server.tool(
    "createHostingDomain",
    "绑定自定义域名",
    {
      domain: z.string().describe("自定义域名"),
      certId: z.string().describe("证书ID")
    },
    async ({ domain, certId }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.CreateHostingDomain({
        domain,
        certId
      });
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

  // deleteHostingDomain - 解绑自定义域名
  server.tool(
    "deleteHostingDomain",
    "解绑自定义域名",
    {
      domain: z.string().describe("自定义域名")
    },
    async ({ domain }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.deleteHostingDomain({
        domain
      });
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

  // getWebsiteConfig - 获取静态网站配置
  server.tool(
    "getWebsiteConfig",
    "获取静态网站配置",
    {
      confirm: z.literal("yes").describe("确认操作，默认传 yes")
    },
    async () => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.getWebsiteConfig();
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

  // tcbCheckResource - 获取域名配置
  server.tool(
    "tcbCheckResource",
    "获取域名配置",
    {
      domains: z.array(z.string()).describe("域名列表")
    },
    async ({ domains }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.tcbCheckResource({
        domains
      });
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

  // tcbModifyAttribute - 修改域名配置
  server.tool(
    "tcbModifyAttribute",
    "修改域名配置",
    {
      domain: z.string().describe("域名"),
      domainId: z.number().describe("域名ID"),
      domainConfig: z.object({
        Refer: z.object({
          Switch: z.string(),
          RefererRules: z.array(z.object({
            RefererType: z.string(),
            Referers: z.array(z.string()),
            AllowEmpty: z.boolean()
          })).optional()
        }).optional(),
        Cache: z.array(z.object({
          RuleType: z.string(),
          RuleValue: z.string(),
          CacheTtl: z.number()
        })).optional(),
        IpFilter: z.object({
          Switch: z.string(),
          FilterType: z.string().optional(),
          Filters: z.array(z.string()).optional()
        }).optional(),
        IpFreqLimit: z.object({
          Switch: z.string(),
          Qps: z.number().optional()
        }).optional()
      }).describe("域名配置")
    },
    async ({ domain, domainId, domainConfig }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.hosting.tcbModifyAttribute({
        domain,
        domainId,
        domainConfig
      });
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
