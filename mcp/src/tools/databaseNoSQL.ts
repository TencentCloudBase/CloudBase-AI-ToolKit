import CloudBase from "@cloudbase/manager-node";
import { z } from "zod";
import { getCloudBaseManager, logCloudBaseResult } from "../cloudbase-manager.js";
import { ExtendedMcpServer } from "../server.js";
import { Logger } from "../types.js";

const CATEGORY = "NoSQL database";

// 获取数据库实例ID
async function getDatabaseInstanceId(getManager: () => Promise<any>) {
  const cloudbase = await getManager();
  const { EnvInfo } = await cloudbase.env.getEnvInfo();
  if (!EnvInfo?.Databases?.[0]?.InstanceId) {
    throw new Error("无法获取数据库实例ID");
  }
  return EnvInfo.Databases[0].InstanceId;
}

export function registerDatabaseTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions,如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;
  const logger = server.logger;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // readNoSqlDatabaseStructure
  server.registerTool?.(
    "readNoSqlDatabaseStructure",
    {
      title: "读取 NoSQL 数据库结构",
      description: "读取 NoSQL 数据库结构",
      inputSchema: {
        action: z.enum([
          "listCollections",
          "describeCollection",
          "checkCollection",
          "listIndexes",
          "checkIndex",
        ]).describe(`listCollections: 列出集合列表
describeCollection: 描述集合
checkCollection: 检查集合是否存在
listIndexes: 列出索引列表
checkIndex: 检查索引是否存在`),
        limit: z
          .number()
          .optional()
          .describe("返回数量限制(listCollections 操作时可选)"),
        offset: z
          .number()
          .optional()
          .describe("偏移量(listCollections 操作时可选)"),
        collectionName: z
          .string()
          .optional()
          .describe(
            "集合名称(describeCollection、listIndexes、checkIndex 操作时必填)",
          ),
        indexName: z
          .string()
          .optional()
          .describe("索引名称(checkIndex 操作时必填)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ action, limit, offset, collectionName, indexName }) => {
      const cloudbase = await getManager();

      if (action === "listCollections") {
        const result = await cloudbase.database.listCollections({
          MgoOffset: offset,
          MgoLimit: limit,
        });
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  requestId: result.RequestId,
                  collections: result.Collections,
                  pager: result.Pager,
                  message: "获取 NoSQL 数据库集合列表成功",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (action === "checkCollection") {
        if (!collectionName) {
          throw new Error("检查集合时必须提供 collectionName");
        }
        const result =
          await cloudbase.database.checkCollectionExists(collectionName);
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  exists: result.Exists,
                  requestId: result.RequestId,
                  message: result.Exists
                    ? "云开发数据库集合已存在"
                    : "云开发数据库集合不存在",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (action === "describeCollection") {
        if (!collectionName) {
          throw new Error("查看集合详情时必须提供 collectionName");
        }
        const result =
          await cloudbase.database.describeCollection(collectionName);
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  requestId: result.RequestId,
                  indexNum: result.IndexNum,
                  indexes: result.Indexes,
                  message: "获取云开发数据库集合信息成功",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (action === "listIndexes") {
        if (!collectionName) {
          throw new Error("获取索引列表时必须提供 collectionName");
        }
        const result =
          await cloudbase.database.describeCollection(collectionName);
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  requestId: result.RequestId,
                  indexNum: result.IndexNum,
                  indexes: result.Indexes,
                  message: "获取索引列表成功",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (action === "checkIndex") {
        if (!collectionName || !indexName) {
          throw new Error("检查索引时必须提供 collectionName 和 indexName");
        }
        const result = await cloudbase.database.checkIndexExists(
          collectionName,
          indexName,
        );
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  exists: result.Exists,
                  requestId: result.RequestId,
                  message: result.Exists ? "索引已存在" : "索引不存在",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      throw new Error(`不支持的操作类型: ${action}`);
    },
  );

  // writeNoSqlDatabaseStructure
  server.registerTool?.(
    "writeNoSqlDatabaseStructure",
    {
      title: "修改 NoSQL 数据库结构",
      description: "修改 NoSQL 数据库结构",
      inputSchema: {
        action: z.enum(["createCollection", "updateCollection"])
          .describe(`createCollection: 创建集合
updateCollection: 更新集合`),
        collectionName: z.string().describe("集合名称"),
        updateOptions: z
          .object({
            CreateIndexes: z
              .array(
                z.object({
                  IndexName: z.string(),
                  MgoKeySchema: z.object({
                    MgoIsUnique: z.boolean(),
                    MgoIndexKeys: z.array(
                      z.object({
                        Name: z.string(),
                        Direction: z.string(),
                      }),
                    ),
                  }),
                }),
              )
              .optional(),
            DropIndexes: z
              .array(
                z.object({
                  IndexName: z.string(),
                }),
              )
              .optional(),
          })
          .optional()
          .describe("更新选项(updateCollection 时使用)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ action, collectionName, updateOptions }) => {
      try {
        const cloudbase = await getManager();
        if (action === "createCollection") {
          const result =
            await cloudbase.database.createCollection(collectionName);
          logCloudBaseResult(server.logger, result);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    requestId: result.RequestId,
                    action,
                    message: "云开发数据库集合创建成功",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        if (action === "updateCollection") {
          if (!updateOptions) {
            throw new Error("更新集合时必须提供 options");
          }
          const result = await cloudbase.database.updateCollection(
            collectionName,
            updateOptions,
          );
          logCloudBaseResult(server.logger, result);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    requestId: result.RequestId,
                    action,
                    message: "云开发数据库集合更新成功",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        throw new Error(`不支持的操作类型: ${action}`);
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  action,
                  error: error.message,
                  message: "集合创建/更新操作失败",
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );

  // readNoSqlDatabaseContent
  server.registerTool?.(
    "readNoSqlDatabaseContent",
    {
      title: "查询并获取 NoSQL 数据库数据记录",
      description: "查询并获取 NoSQL 数据库数据记录",
      inputSchema: {
        collectionName: z.string().describe("集合名称"),
        query: z
          .union([z.object({}).passthrough(), z.string()])
          .optional()
          .describe("查询条件(对象或字符串,推荐对象)"),
        projection: z
          .union([z.object({}).passthrough(), z.string()])
          .optional()
          .describe("返回字段投影(对象或字符串,推荐对象)"),
        sort: z
          .union([z.object({}).passthrough(), z.string()])
          .optional()
          .describe("排序条件(对象或字符串,推荐对象)"),
        limit: z.number().optional().describe("返回数量限制"),
        offset: z.number().optional().describe("跳过的记录数"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ collectionName, query, projection, sort, limit, offset }) => {
      try {
        const cloudbase = await getManager();
        const instanceId = await getDatabaseInstanceId(getManager);
        // 兼容对象和字符串
        const toJSONString = (v: any) =>
          typeof v === "object" && v !== null ? JSON.stringify(v) : v;
        const result = await cloudbase.commonService("flexdb").call({
          Action: "Query",
          Param: {
            TableName: collectionName,
            MgoQuery: toJSONString(query),
            MgoProjection: toJSONString(projection),
            MgoSort: toJSONString(sort),
            MgoLimit: limit ?? 100, // 默认返回100条,避免底层SDK缺参报错
            MgoOffset: offset,
            Tag: instanceId,
          },
        });
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  requestId: result.RequestId,
                  data: result.Data,
                  pager: result.Pager,
                  message: "文档查询成功",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message,
                  message: "文档查询失败",
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );

  // writeNoSqlDatabaseContent
  server.registerTool?.(
    "writeNoSqlDatabaseContent",
    {
      title: "修改 NoSQL 数据库数据记录",
      description: "修改 NoSQL 数据库数据记录",
      inputSchema: {
        action: z.enum(["insert", "update", "delete"])
          .describe(`createCollection: 创建数据
updateCollection: 更新数据
deleteCollection: 删除数据`),
        collectionName: z.string().describe("集合名称"),
        documents: z
          .array(z.object({}).passthrough())
          .optional()
          .describe("要插入的文档对象数组,每个文档都是对象(insert 操作必填)"),
        query: z
          .union([z.object({}).passthrough(), z.string()])
          .optional()
          .describe("查询条件(对象或字符串,推荐对象)(update/delete 操作必填)"),
        update: z
          .union([z.object({}).passthrough(), z.string()])
          .optional()
          .describe("更新内容(对象或字符串,推荐对象)(update 操作必填)"),
        isMulti: z
          .boolean()
          .optional()
          .describe("是否更新多条记录(update/delete 操作可选)"),
        upsert: z
          .boolean()
          .optional()
          .describe("是否在不存在时插入(update 操作可选)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({
      action,
      collectionName,
      documents,
      query,
      update,
      isMulti,
      upsert,
    }) => {
      if (action === "insert") {
        if (!documents) {
          throw new Error("insert 操作时必须提供 documents");
        }
        const text = await insertDocuments({
          collectionName,
          documents,
          getManager,
          logger,
        });
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }
      if (action === "update") {
        if (!query) {
          throw new Error("update 操作时必须提供 query");
        }
        if (!update) {
          throw new Error("update 操作时必须提供 update");
        }
        const text = await updateDocuments({
          collectionName,
          query,
          update,
          isMulti,
          upsert,
          getManager,
          logger,
        });
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }
      if (action === "delete") {
        if (!query) {
          throw new Error("delete 操作时必须提供 query");
        }
        const text = await deleteDocuments({
          collectionName,
          query,
          isMulti,
          getManager,
          logger,
        });
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }

      throw new Error(`不支持的操作类型: ${action}`);
    },
  );
}

async function insertDocuments({
  collectionName,
  documents,
  getManager,
  logger,
}: {
  collectionName: string;
  documents: object[];
  getManager: () => Promise<CloudBase>;
  logger?: Logger;
}) {
  try {
    const cloudbase = await getManager();
    const instanceId = await getDatabaseInstanceId(getManager);
    // 将对象数组序列化为字符串数组
    const docsAsStrings = documents.map((doc) => JSON.stringify(doc));
    const result = await cloudbase.commonService("flexdb").call({
      Action: "PutItem",
      Param: {
        TableName: collectionName,
        MgoDocs: docsAsStrings,
        Tag: instanceId,
      },
    });
    logCloudBaseResult(logger, result);
    return JSON.stringify(
      {
        success: true,
        requestId: result.RequestId,
        insertedIds: result.InsertedIds,
        message: "文档插入成功",
      },
      null,
      2,
    );
  } catch (error: any) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "文档插入失败",
      },
      null,
      2,
    );
  }
}

async function updateDocuments({
  collectionName,
  query,
  update,
  isMulti,
  upsert,
  getManager,
  logger,
}: {
  collectionName: string;
  query: object | string;
  update: object | string;
  isMulti?: boolean;
  upsert?: boolean;
  getManager: () => Promise<CloudBase>;
  logger?: Logger;
}) {
  try {
    const cloudbase = await getManager();
    const instanceId = await getDatabaseInstanceId(getManager);
    const toJSONString = (v: any) =>
      typeof v === "object" && v !== null ? JSON.stringify(v) : v;
    const result = await cloudbase.commonService("flexdb").call({
      Action: "UpdateItem",
      Param: {
        TableName: collectionName,
        MgoQuery: toJSONString(query),
        MgoUpdate: toJSONString(update),
        MgoIsMulti: isMulti,
        MgoUpsert: upsert,
        Tag: instanceId,
      },
    });
    logCloudBaseResult(logger, result);
    return JSON.stringify(
      {
        success: true,
        requestId: result.RequestId,
        modifiedCount: result.ModifiedNum,
        matchedCount: result.MatchedNum,
        upsertedId: result.UpsertedId,
        message: "文档更新成功",
      },
      null,
      2,
    );
  } catch (error: any) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "文档更新失败",
      },
      null,
      2,
    );
  }
}

async function deleteDocuments({
  collectionName,
  query,
  isMulti,
  getManager,
  logger,
}: {
  collectionName: string;
  query: object | string;
  isMulti?: boolean;
  getManager: () => Promise<CloudBase>;
  logger?: Logger;
}) {
  try {
    const cloudbase = await getManager();
    const instanceId = await getDatabaseInstanceId(getManager);
    const toJSONString = (v: any) =>
      typeof v === "object" && v !== null ? JSON.stringify(v) : v;
    const result = await cloudbase.commonService("flexdb").call({
      Action: "DeleteItem",
      Param: {
        TableName: collectionName,
        MgoQuery: toJSONString(query),
        MgoIsMulti: isMulti,
        Tag: instanceId,
      },
    });
    logCloudBaseResult(logger, result);
    return JSON.stringify(
      {
        success: true,
        requestId: result.RequestId,
        deleted: result.Deleted,
        message: "文档删除成功",
      },
      null,
      2,
    );
  } catch (error: any) {
    return JSON.stringify(
      {
        success: false,
        error: error.message,
        message: "文档删除失败",
      },
      null,
      2,
    );
  }
}
