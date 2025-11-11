import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js';
import { ExtendedMcpServer } from '../server.js';

// 获取数据库实例ID
async function getDatabaseInstanceId(getManager: () => Promise<any>) {
  const cloudbase = await getManager()
  const { EnvInfo } = await cloudbase.env.getEnvInfo();
  if (!EnvInfo?.Databases?.[0]?.InstanceId) {
    throw new Error("无法获取数据库实例ID");
  }
  return EnvInfo.Databases[0].InstanceId;
}

export function registerDatabaseTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });
  // 创建/更新 云开发数据库集合（向后兼容：默认create）
  server.registerTool?.(
    "createCollection",
    {
      title: "创建数据库集合",
      description: "管理云开发数据库集合：默认创建。可通过 action 指定 update。",
      inputSchema: {
        action: z.enum(["create", "update"]).optional().describe("操作类型：create=创建(默认)，update=更新集合配置"),
        collectionName: z.string().describe("云开发数据库集合名称"),
        options: z.object({
          CreateIndexes: z.array(z.object({
            IndexName: z.string(),
            MgoKeySchema: z.object({
              MgoIsUnique: z.boolean(),
              MgoIndexKeys: z.array(z.object({
                Name: z.string(),
                Direction: z.string()
              }))
            })
          })).optional(),
          DropIndexes: z.array(z.object({
            IndexName: z.string()
          })).optional()
        }).optional().describe("更新选项（action=update 时使用）")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ action = "create", collectionName, options }: { action?: "create" | "update"; collectionName: string; options?: any }) => {
      try {
        const cloudbase = await getManager()
        if (action === "create") {
          const result = await cloudbase.database.createCollection(collectionName);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  requestId: result.RequestId,
                  action,
                  message: "云开发数据库集合创建成功"
                }, null, 2)
              }
            ]
          };
        }

        if (action === "update") {
          if (!options) {
            throw new Error("更新集合时必须提供 options");
          }
          const result = await cloudbase.database.updateCollection(collectionName, options);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  requestId: result.RequestId,
                  action,
                  message: "云开发数据库集合更新成功"
                }, null, 2)
              }
            ]
          };
        }

        throw new Error(`不支持的操作类型: ${action}`);
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                action,
                error: error.message,
                message: "集合创建/更新操作失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // collectionQuery - 集合查询（check/describe/list）并扩展索引查询（index_list/index_check）
  server.registerTool?.(
    "collectionQuery",
    {
      title: "集合查询",
      description: "数据库集合的查询操作，支持检查存在性、查看详情、列表查询；并支持索引列表与检查。（兼容旧名称）",
      inputSchema: {
        action: z.enum(["check", "describe", "list", "index_list", "index_check"]).describe("操作类型：check=检查是否存在，describe=查看详情，list=列表查询，index_list=索引列表，index_check=检查索引是否存在"),
        collectionName: z.string().optional().describe("集合名称（check、describe、index_list、index_check 操作时必填）"),
        indexName: z.string().optional().describe("索引名称（index_check 操作时必填）"),
        limit: z.number().optional().describe("返回数量限制（list操作时可选）"),
        offset: z.number().optional().describe("偏移量（list操作时可选）")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ action, collectionName, indexName, limit, offset }: { 
      action: "check" | "describe" | "list" | "index_list" | "index_check", 
      collectionName?: string, 
      indexName?: string,
      limit?: number, 
      offset?: number 
    }) => {
      try {
        const cloudbase = await getManager();
        let result;

        switch (action) {
          case "check":
            if (!collectionName) {
              throw new Error("检查集合时必须提供 collectionName");
            }
            result = await cloudbase.database.checkCollectionExists(collectionName);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  exists: result.Exists,
                  requestId: result.RequestId,
                  message: result.Exists ? "云开发数据库集合已存在" : "云开发数据库集合不存在"
                }, null, 2)
              }]
            };

          case "describe":
            if (!collectionName) {
              throw new Error("查看集合详情时必须提供 collectionName");
            }
            result = await cloudbase.database.describeCollection(collectionName);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  requestId: result.RequestId,
                  indexNum: result.IndexNum,
                  indexes: result.Indexes,
                  message: "获取云开发数据库集合信息成功"
                }, null, 2)
              }]
            };

          case "list":
            result = await cloudbase.database.listCollections({
              MgoOffset: offset,
              MgoLimit: limit
            });
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  requestId: result.RequestId,
                  collections: result.Collections,
                  pager: result.Pager,
                  message: "获取云开发数据库集合列表成功"
                }, null, 2)
              }]
            };

          case "index_list":
            if (!collectionName) {
              throw new Error("获取索引列表时必须提供 collectionName");
            }
            result = await cloudbase.database.describeCollection(collectionName);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  requestId: result.RequestId,
                  indexNum: result.IndexNum,
                  indexes: result.Indexes,
                  message: "获取索引列表成功"
                }, null, 2)
              }]
            };

          case "index_check":
            if (!collectionName || !indexName) {
              throw new Error("检查索引时必须提供 collectionName 和 indexName");
            }
            result = await cloudbase.database.checkIndexExists(collectionName, indexName);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  exists: result.Exists,
                  requestId: result.RequestId,
                  message: result.Exists ? "索引已存在" : "索引不存在"
                }, null, 2)
              }]
            };

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message,
              message: `集合查询失败: ${action}`
            }, null, 2)
          }]
        };
      }
    }
  );

  // 更新云开发数据库集合（创建/删除索引）
  server.registerTool?.(
    "updateCollection",
    {
      title: "更新数据库集合",
      description: "更新云开发数据库集合配置（创建或删除索引）",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        options: z.object({
          CreateIndexes: z.array(z.object({
            IndexName: z.string(),
            MgoKeySchema: z.object({
              MgoIsUnique: z.boolean(),
              MgoIndexKeys: z.array(z.object({
                Name: z.string(),
                Direction: z.string()
              }))
            })
          })).optional(),
          DropIndexes: z.array(z.object({
            IndexName: z.string()
          })).optional()
        }).describe("更新选项，支持创建和删除索引")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, options }: { collectionName: string; options: any }) => {
      try {
        const cloudbase = await getManager()
        const result = await cloudbase.database.updateCollection(collectionName, options);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                message: "云开发数据库集合更新成功"
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
                message: "云开发数据库集合更新失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );



  // 检查索引是否存在
  server.registerTool?.(
    "checkIndexExists",
    {
      title: "检查索引是否存在",
      description: "检查索引是否存在",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        indexName: z.string().describe("索引名称")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, indexName }: { collectionName: string; indexName: string }) => {
      try {
        const cloudbase = await getManager()
        const result = await cloudbase.database.checkIndexExists(collectionName, indexName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                exists: result.Exists,
                requestId: result.RequestId,
                message: result.Exists ? "索引已存在" : "索引不存在"
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
                message: "检查索引失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 插入文档
  server.registerTool?.(
    "insertDocuments",
    {
      title: "插入文档",
      description: "向云开发数据库集合中插入一个或多个文档（支持对象数组）",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        documents: z.array(z.object({}).passthrough()).describe("要插入的文档对象数组，每个文档都是对象")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, documents }: { collectionName: string; documents: object[] }) => {
      try {
        const cloudbase = await getManager()
        const instanceId = await getDatabaseInstanceId(getManager);
        // 将对象数组序列化为字符串数组
        const docsAsStrings = documents.map(doc => JSON.stringify(doc));
        const result = await cloudbase.commonService('flexdb').call({
          Action: 'PutItem',
          Param: {
            TableName: collectionName,
            MgoDocs: docsAsStrings,
            Tag: instanceId
          }
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                insertedIds: result.InsertedIds,
                message: "文档插入成功"
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
                message: "文档插入失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 查询文档
  server.registerTool?.(
    "queryDocuments",
    {
      title: "查询文档",
      description: "查询云开发数据库集合中的文档（支持对象参数）",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        query: z.union([z.object({}).passthrough(), z.string()]).optional().describe("查询条件（对象或字符串，推荐对象）"),
        projection: z.union([z.object({}).passthrough(), z.string()]).optional().describe("返回字段投影（对象或字符串，推荐对象）"),
        sort: z.union([z.object({}).passthrough(), z.string()]).optional().describe("排序条件（对象或字符串，推荐对象）"),
        limit: z.number().optional().describe("返回数量限制"),
        offset: z.number().optional().describe("跳过的记录数")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, query, projection, sort, limit, offset }: {
      collectionName: string;
      query?: object | string;
      projection?: object | string;
      sort?: object | string;
      limit?: number;
      offset?: number
    }) => {
      try {
        const cloudbase = await getManager()
        const instanceId = await getDatabaseInstanceId(getManager);
        // 兼容对象和字符串
        const toJSONString = (v: any) => typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
        const result = await cloudbase.commonService('flexdb').call({
          Action: 'Query',
          Param: {
            TableName: collectionName,
            MgoQuery: toJSONString(query),
            MgoProjection: toJSONString(projection),
            MgoSort: toJSONString(sort),
            MgoLimit: limit ?? 100, // 默认返回100条，避免底层SDK缺参报错
            MgoOffset: offset,
            Tag: instanceId
          }
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                data: result.Data,
                pager: result.Pager,
                message: "文档查询成功"
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
                message: "文档查询失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 更新文档
  server.registerTool?.(
    "updateDocuments",
    {
      title: "更新文档",
      description: "更新云开发数据库集合中的文档（支持对象参数）",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        query: z.union([z.object({}).passthrough(), z.string()]).describe("查询条件（对象或字符串，推荐对象）"),
        update: z.union([z.object({}).passthrough(), z.string()]).describe("更新内容（对象或字符串，推荐对象）"),
        isMulti: z.boolean().optional().describe("是否更新多条记录"),
        upsert: z.boolean().optional().describe("是否在不存在时插入")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, query, update, isMulti, upsert }: {
      collectionName: string;
      query: object | string;
      update: object | string;
      isMulti?: boolean;
      upsert?: boolean
    }) => {
      try {
        const cloudbase = await getManager()
        const instanceId = await getDatabaseInstanceId(getManager);
        const toJSONString = (v: any) => typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
        const result = await cloudbase.commonService('flexdb').call({
          Action: 'UpdateItem',
          Param: {
            TableName: collectionName,
            MgoQuery: toJSONString(query),
            MgoUpdate: toJSONString(update),
            MgoIsMulti: isMulti,
            MgoUpsert: upsert,
            Tag: instanceId
          }
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                modifiedCount: result.ModifiedNum,
                matchedCount: result.MatchedNum,
                upsertedId: result.UpsertedId,
                message: "文档更新成功"
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
                message: "文档更新失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 删除文档
  server.registerTool?.(
    "deleteDocuments",
    {
      title: "删除文档",
      description: "删除云开发数据库集合中的文档（支持对象参数）",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称"),
        query: z.union([z.object({}).passthrough(), z.string()]).describe("查询条件（对象或字符串，推荐对象）"),
        isMulti: z.boolean().optional().describe("是否删除多条记录")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName, query, isMulti }: {
      collectionName: string;
      query: object | string;
      isMulti?: boolean
    }) => {
      try {
        const cloudbase = await getManager()
        const instanceId = await getDatabaseInstanceId(getManager);
        const toJSONString = (v: any) => typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
        const result = await cloudbase.commonService('flexdb').call({
          Action: 'DeleteItem',
          Param: {
            TableName: collectionName,
            MgoQuery: toJSONString(query),
            MgoIsMulti: isMulti,
            Tag: instanceId
          }
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                deleted: result.Deleted,
                message: "文档删除成功"
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
                message: "文档删除失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );
}