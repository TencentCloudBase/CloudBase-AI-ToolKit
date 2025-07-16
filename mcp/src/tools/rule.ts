import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js';
import { ExtendedMcpServer } from '../server.js';

/**
 * 统一安全规则类型
 * resourceType: "database" | "storage" | "functions"
 * resourceId: 资源ID（如集合名、bucket名、函数名等，部分类型可为空）
 */
const ResourceTypeEnum = z.enum(["database", "storage", "functions"]);

export function registerRuleTools(server: ExtendedMcpServer) {
  const cloudBaseOptions = server.cloudBaseOptions;
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // 读安全规则
  server.registerTool?.(
    "getSecurityRule",
    {
      title: "查询安全规则",
      description: "读取数据库、云函数、云存储等的安全规则配置。resourceType 支持 database、storage、functions。resourceId 为空时读取全局规则。",
      inputSchema: {
        resourceType: ResourceTypeEnum.describe("资源类型：database=数据库，storage=云存储，functions=云函数"),
        resourceId: z.string().optional().describe("资源ID，如集合名、bucket名、函数名等。部分类型可为空")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "rule"
      }
    },
    async ({ resourceType, resourceId }: { resourceType: string; resourceId?: string }) => {
      try {
        const cloudbase = await getManager();
        let result;
        switch (resourceType) {
          case "database":
            result = await cloudbase.database.getRule({ collectionName: resourceId });
            break;
          case "storage":
            result = await cloudbase.storage.getRule({ bucket: resourceId });
            break;
          case "functions":
            result = await cloudbase.functions.getRule({ functionName: resourceId });
            break;
          default:
            throw new Error(`不支持的资源类型: ${resourceType}`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                resourceType,
                resourceId,
                rule: result.Rule,
                requestId: result.RequestId,
                message: "安全规则获取成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                resourceType,
                resourceId,
                message: "安全规则获取失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 写安全规则
  server.registerTool?.(
    "setSecurityRule",
    {
      title: "设置安全规则",
      description: "写入数据库、云函数、云存储等的安全规则配置。resourceType 支持 database、storage、functions。resourceId 为空时设置全局规则。rule 必须为字符串，格式参考官方文档。",
      inputSchema: {
        resourceType: ResourceTypeEnum.describe("资源类型：database=数据库，storage=云存储，functions=云函数"),
        resourceId: z.string().optional().describe("资源ID，如集合名、bucket名、函数名等。部分类型可为空"),
        rule: z.string().describe("安全规则内容，必须为字符串，格式参考官方文档")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "rule"
      }
    },
    async ({ resourceType, resourceId, rule }: { resourceType: string; resourceId?: string; rule: string }) => {
      try {
        const cloudbase = await getManager();
        let result;
        switch (resourceType) {
          case "database":
            result = await cloudbase.database.setRule({ collectionName: resourceId, rule });
            break;
          case "storage":
            result = await cloudbase.storage.setRule({ bucket: resourceId, rule });
            break;
          case "functions":
            result = await cloudbase.functions.setRule({ functionName: resourceId, rule });
            break;
          default:
            throw new Error(`不支持的资源类型: ${resourceType}`);
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                resourceType,
                resourceId,
                requestId: result.RequestId,
                message: "安全规则设置成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                resourceType,
                resourceId,
                message: "安全规则设置失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );
} 