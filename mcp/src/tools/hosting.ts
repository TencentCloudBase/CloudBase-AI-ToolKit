import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';
import { conditionalRegisterTool } from '../utils/cloud-mode.js';

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

export function registerHostingTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // uploadFiles - 上传文件到静态网站托管 (cloud-incompatible)
  conditionalRegisterTool(
    server,
    "uploadFiles",
    {
      title: "上传静态文件",
      description: "上传文件到静态网站托管",
      inputSchema: {
        localPath: z.string().optional().describe("本地文件或文件夹路径，需要是绝对路径，例如 /tmp/files/data.txt"),
        cloudPath: z.string().optional().describe("云端文件或文件夹路径，例如files/data.txt"),
        files: z.array(z.object({
          localPath: z.string(),
          cloudPath: z.string()
        })).default([]).describe("多文件上传配置"),
        ignore: z.union([z.string(), z.array(z.string())]).optional().describe("忽略文件模式")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "hosting"
      }
    },
    async ({ localPath, cloudPath, files = [], ignore }: { 
      localPath?: string; 
      cloudPath?: string; 
      files?: Array<{localPath: string; cloudPath: string}>; 
      ignore?: string | string[] 
    }) => {
      const cloudbase = await getManager()
      const result = await cloudbase.hosting.uploadFiles({
        localPath,
        cloudPath,
        files,
        ignore
      });
      
      // 获取环境信息
      const envInfo = await cloudbase.env.getEnvInfo() as ExtendedEnvInfo;
      const staticDomain = envInfo.EnvInfo?.StaticStorages?.[0]?.StaticDomain;
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...result,
              staticDomain,
              message: "文件上传成功",
              accessUrl: staticDomain ? `https://${staticDomain}/${cloudPath || ''}` : "请检查静态托管配置"
            }, null, 2)
          }
        ]
      };
    }
  );

  // getWebsiteConfig - 获取静态网站托管配置
  server.registerTool?.(
    "getWebsiteConfig",
    {
      title: "查询静态托管配置",
      description: "获取静态网站托管配置",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "hosting"
      }
    },
    async () => {
      const cloudbase = await getManager()
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

  // deleteFiles - 删除静态网站托管文件
  server.registerTool?.(
    "deleteFiles",
    {
      title: "删除静态文件",
      description: "删除静态网站托管的文件或文件夹",
      inputSchema: {
        cloudPath: z.string().describe("云端文件或文件夹路径"),
        isDir: z.boolean().default(false).describe("是否为文件夹")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        category: "hosting"
      }
    },
    async ({ cloudPath, isDir = false }: { cloudPath: string; isDir?: boolean }) => {
      const cloudbase = await getManager()
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
  server.registerTool?.(
    "findFiles",
    {
      title: "搜索静态文件",
      description: "搜索静态网站托管的文件",
      inputSchema: {
        prefix: z.string().describe("匹配前缀"),
        marker: z.string().optional().describe("起始对象键标记"),
        maxKeys: z.number().optional().describe("单次返回最大条目数")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "hosting"
      }
    },
    async ({ prefix, marker, maxKeys }: { prefix: string; marker?: string; maxKeys?: number }) => {
      const cloudbase = await getManager()
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

  // domainManagement - 统一的域名管理工具
  server.registerTool?.(
    "domainManagement",
    {
      title: "静态托管域名管理",
      description: "统一的域名管理工具，支持绑定、解绑、查询和修改域名配置",
      inputSchema: {
        action: z.enum(["create", "delete", "check", "modify"]).describe("操作类型: create=绑定域名, delete=解绑域名, check=查询域名配置, modify=修改域名配置"),
        // 绑定域名参数
        domain: z.string().optional().describe("域名"),
        certId: z.string().optional().describe("证书ID（绑定域名时必需）"),
        
        domains: z.array(z.string()).optional().describe("域名列表（查询配置时使用）"),
        // 修改域名参数
        domainId: z.number().optional().describe("域名ID（修改配置时必需）"),
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
        }).optional().describe("域名配置（修改配置时使用）")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "hosting"
      }
    },
    async ({ action, domain, certId, domains, domainId, domainConfig }: {
      action: "create" | "delete" | "check" | "modify";
      domain?: string;
      certId?: string;
      domains?: string[];
      domainId?: number;
      domainConfig?: any;
    }) => {
      const cloudbase = await getManager()
      let result;

      switch (action) {
        case "create":
          if (!domain || !certId) {
            throw new Error("绑定域名需要提供域名和证书ID");
          }
          result = await cloudbase.hosting.CreateHostingDomain({
            domain,
            certId
          });
          break;

        case "delete":
          if (!domain) {
            throw new Error("解绑域名需要提供域名");
          }
          result = await cloudbase.hosting.deleteHostingDomain({
            domain
          });
          break;

        case "check":
          if (!domains || domains.length === 0) {
            throw new Error("查询域名配置需要提供域名列表");
          }
          result = await cloudbase.hosting.tcbCheckResource({
            domains
          });
          break;

        case "modify":
          if (!domain || domainId === undefined || !domainConfig) {
            throw new Error("修改域名配置需要提供域名、域名ID和配置信息");
          }
          result = await cloudbase.hosting.tcbModifyAttribute({
            domain,
            domainId,
            domainConfig
          });
          break;

        default:
          throw new Error(`不支持的操作类型: ${action}`);
      }

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
