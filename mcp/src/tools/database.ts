import { z } from "zod";
import { getCloudBaseManager, getEnvId } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';


// 云开发数据库集合相关的类型定义
type CreateIndexOption = {
  IndexName: string;
  MgoKeySchema: {
    MgoIsUnique: boolean;
    MgoIndexKeys: Array<{
      Name: string;
      Direction: string;
    }>;
  };
};

type DropIndexOption = {
  IndexName: string;
};

type UpdateCollectionOption = {
  CreateIndexes?: CreateIndexOption[];
  DropIndexes?: DropIndexOption[];
};

// 获取数据库实例ID
async function getDatabaseInstanceId(getManager: () => Promise<any>) {
  const cloudbase = await getManager()
  const { EnvInfo } = await cloudbase.env.getEnvInfo();
  if (!EnvInfo?.Databases?.[0]?.InstanceId) {
    throw new Error("无法获取数据库实例ID");
  }
  return EnvInfo.Databases[0].InstanceId;
}

// 递归解析字段结构的函数
function parseFieldStructure(field: any, fieldName: string, schema: any, depth: number = 0, maxDepth: number = 5): any {
  if (depth > maxDepth) {
    return {
      name: fieldName,
      type: field.type,
      title: field.title || fieldName,
      description: field.description || '',
      error: '递归深度超限'
    };
  }

  const fieldInfo: any = {
    name: fieldName,
    type: field.type,
    format: field.format,
    title: field.title || fieldName,
    description: field.description || '',
    required: schema.required?.includes(fieldName) || false,
    depth: depth
  };

  // 处理 array 类型字段
  if (field.type === 'array' && field.items) {
    try {
      fieldInfo.items = parseFieldStructure(field.items, `${fieldName}_item`, schema, depth + 1, maxDepth);
    } catch (error: any) {
      fieldInfo.items = {
        name: `${fieldName}_item`,
        type: 'unknown',
        title: '数组元素',
        description: '数组元素结构解析失败',
        error: error.message
      };
    }
  }

  // 处理 object 类型字段
  if (field.type === 'object' && field.properties) {
    try {
      fieldInfo.properties = Object.keys(field.properties).map(key => 
        parseFieldStructure(field.properties[key], key, field, depth + 1, maxDepth)
      );
    } catch (error: any) {
      fieldInfo.properties = [{
        name: 'property',
        type: 'unknown',
        title: '对象属性',
        description: '对象属性结构解析失败',
        error: error.message
      }];
    }
  }

  // 处理关联关系
  if (field['x-parent']) {
    fieldInfo.linkage = field['x-parent'];
  }

  // 添加其他属性
  if (field.enum) fieldInfo.enum = field.enum;
  if (field.default !== undefined) fieldInfo.default = field.default;

  return fieldInfo;
}

// 生成SDK使用文档的函数
function generateSDKDocs(modelName: string, modelTitle: string, userFields: any[], relations: any[]): string {
  // 获取主要字段（前几个非关联字段）
  const mainFields = userFields.filter(f => !f.linkage);
  const requiredFields = userFields.filter(f => f.required);
  const stringFields = userFields.filter(f => f.type === 'string' && !f.linkage);
  const numberFields = userFields.filter(f => f.type === 'number');

  // 生成字段示例值
  const generateFieldValue = (field: any): string => {
    if (field.enum && field.enum.length > 0) {
      return `"${field.enum[0]}"`;
    }
    switch (field.type) {
      case 'string':
        return field.format === 'email' ? '"user@example.com"' :
               field.format === 'url' ? '"https://example.com"' :
               `"示例${field.title || field.name}"`;
      case 'number':
        return field.format === 'currency' ? '99.99' : '1';
      case 'boolean':
        return field.default !== undefined ? field.default : 'true';
      case 'array':
        // 如果有子结构信息，生成更详细的示例
        if (field.items) {
          const itemValue = generateFieldValue(field.items);
          return `[${itemValue}]`;
        }
        return '[]';
      case 'object':
        // 如果有子结构信息，生成更详细的示例
        if (field.properties && field.properties.length > 0) {
          const props = field.properties.slice(0, 2).map((prop: any) => 
            `${prop.name}: ${generateFieldValue(prop)}`
          ).join(', ');
          return `{${props}}`;
        }
        return '{}';
      default:
        return `"${field.title || field.name}值"`;
    }
  };

  // 生成创建数据示例
  const createDataExample = mainFields.map(field =>
    `    ${field.name}: ${generateFieldValue(field)}, // ${field.description || field.title || field.name}`
  ).join('\n');

  // 生成更新数据示例
  const updateDataExample = mainFields.slice(0, 2).map(field =>
    `    ${field.name}: ${generateFieldValue(field)}, // ${field.description || field.title || field.name}`
  ).join('\n');

  // 生成查询条件示例
  const queryField = stringFields[0] || mainFields[0];
  const queryExample = queryField ?
    `      ${queryField.name}: {\n        $eq: ${generateFieldValue(queryField)}, // 根据${queryField.description || queryField.title || queryField.name}查询\n      },` :
    '      _id: {\n        $eq: "记录ID", // 根据ID查询\n      },';

  return `# 数据模型 ${modelTitle} (${modelName}) SDK 使用文档

## 数据模型字段说明

${userFields.map(field => {
  let fieldDoc = `- **${field.name}** (${field.type})`;
  if (field.required) fieldDoc += ' *必填*';
  if (field.description) fieldDoc += `: ${field.description}`;
  if (field.format) fieldDoc += ` [格式: ${field.format}]`;
  if (field.enum) fieldDoc += ` [可选值: ${field.enum.join(', ')}]`;
  if (field.default !== undefined) fieldDoc += ` [默认值: ${field.default}]`;
  
  // 添加复杂字段结构的说明
  if (field.type === 'array' && field.items) {
    fieldDoc += `\n  - 数组元素: ${field.items.type}`;
    if (field.items.description) fieldDoc += ` (${field.items.description})`;
  }
  if (field.type === 'object' && field.properties && field.properties.length > 0) {
    fieldDoc += `\n  - 对象属性:`;
    field.properties.slice(0, 3).forEach((prop: any) => {
      fieldDoc += `\n    - ${prop.name} (${prop.type})`;
    });
    if (field.properties.length > 3) {
      fieldDoc += `\n    - ... 还有 ${field.properties.length - 3} 个属性`;
    }
  }
  
  return fieldDoc;
}).join('\n')}

${relations.length > 0 ? `
## 关联关系

${relations.map(rel =>
  `- **${rel.field}**: 关联到 ${rel.targetModel} 模型的 ${rel.foreignKey} 字段`
).join('\n')}
` : ''}

## 增删改查操作

### 创建数据

#### 创建单条数据 \`create\`

\`\`\`javascript
const { data } = await models.${modelName}.create({
  data: {
${createDataExample}
  },
});

// 返回创建的记录 id
console.log(data);
// { id: "7d8ff72c665eb6c30243b6313aa8539e"}
\`\`\`

#### 创建多条数据 \`createMany\`

\`\`\`javascript
const { data } = await models.${modelName}.createMany({
  data: [
    {
${createDataExample}
    },
    {
${createDataExample}
    },
  ],
});

// 返回创建的记录 idList
console.log(data);
// {
//   "idList": [
//       "7d8ff72c665ebe5c02442a1a7b29685e",
//       "7d8ff72c665ebe5c02442a1b77feba4b"
//   ]
// }
\`\`\`

### 更新数据

#### 更新单条数据 \`update\`

\`\`\`javascript
const { data } = await models.${modelName}.update({
  data: {
${updateDataExample}
  },
  filter: {
    where: {
      _id: {
        $eq: "记录ID", // 推荐传入_id数据标识进行操作
      },
    },
  },
});

// 返回更新成功的条数
console.log(data);
// { count: 1}
\`\`\`

#### 创建或更新数据 \`upsert\`

\`\`\`javascript
const recordData = {
${createDataExample}
  _id: "指定ID",
};

const { data } = await models.${modelName}.upsert({
  create: recordData,
  update: recordData,
  filter: {
    where: {
      _id: {
        $eq: recordData._id,
      },
    },
  },
});

console.log(data);
// 新增时返回: { "count": 0, "id": "指定ID" }
// 更新时返回: { "count": 1, "id": "" }
\`\`\`

#### 更新多条数据 \`updateMany\`

\`\`\`javascript
const { data } = await models.${modelName}.updateMany({
  data: {
${updateDataExample}
  },
  filter: {
    where: {
${queryExample}
    },
  },
});

// 返回更新成功的条数
console.log(data);
// { "count": 5 }
\`\`\`

### 删除数据

#### 删除单条 \`delete\`

\`\`\`javascript
const { data } = await models.${modelName}.delete({
  filter: {
    where: {
      _id: {
        $eq: "记录ID", // 推荐传入_id数据标识进行操作
      },
    },
  },
});

// 返回删除成功的条数
console.log(data);
// { "count": 1 }
\`\`\`

#### 删除多条 \`deleteMany\`

\`\`\`javascript
const { data } = await models.${modelName}.deleteMany({
  filter: {
    where: {
${queryExample}
    },
  },
});

// 返回删除成功的条数
console.log(data);
// { "count": 3 }
\`\`\`

### 读取数据

#### 读取单条数据 \`get\`

\`\`\`javascript
const { data } = await models.${modelName}.get({
  filter: {
    where: {
      _id: {
        $eq: "记录ID", // 推荐传入_id数据标识进行操作
      },
    },
  },
});

// 返回查询到的数据
console.log(data);
// {
//   "_id": "记录ID",
${userFields.slice(0, 5).map(field =>
  `//   "${field.name}": ${generateFieldValue(field)}, // ${field.description || field.title || field.name}`
).join('\n')}
//   "createdAt": 1717488585078,
//   "updatedAt": 1717490751944
// }
\`\`\`

#### 读取多条数据 \`list\`

\`\`\`javascript
const { data } = await models.${modelName}.list({
  filter: {
    where: {
${queryExample}
    },
  },
  getCount: true, // 开启用来获取总数
});

// 返回查询到的数据列表 records 和 总数 total
console.log(data);
// {
//   "records": [
//     {
//       "_id": "记录ID1",
${userFields.slice(0, 3).map(field =>
  `//       "${field.name}": ${generateFieldValue(field)}, // ${field.description || field.title || field.name}`
).join('\n')}
//       "createdAt": 1717488585078,
//       "updatedAt": 1717490751944
//     },
//     // ... 更多记录
//   ],
//   "total": 10
// }
\`\`\`

## 查询条件和排序

### 常用查询条件

\`\`\`javascript
// 等于查询
const { data } = await models.${modelName}.list({
  filter: {
    where: {
${queryField ? `      ${queryField.name}: {
        $eq: ${generateFieldValue(queryField)}, // ${queryField.description || queryField.title || queryField.name}等于指定值
      },` : '      _id: { $eq: "记录ID" },'}
    },
  },
});

${stringFields.length > 0 ? `// 模糊查询
const { data: searchData } = await models.${modelName}.list({
  filter: {
    where: {
      ${stringFields[0].name}: {
        $regex: "关键词", // ${stringFields[0].description || stringFields[0].title || stringFields[0].name}包含关键词
      },
    },
  },
});` : ''}

${numberFields.length > 0 ? `// 范围查询
const { data: rangeData } = await models.${modelName}.list({
  filter: {
    where: {
      ${numberFields[0].name}: {
        $gte: 10, // ${numberFields[0].description || numberFields[0].title || numberFields[0].name}大于等于10
        $lte: 100, // ${numberFields[0].description || numberFields[0].title || numberFields[0].name}小于等于100
      },
    },
  },
});` : ''}
\`\`\`

### 排序

\`\`\`javascript
const { data } = await models.${modelName}.list({
  filter: {
    where: {},
    orderBy: [
      {
        ${mainFields[0] ? `${mainFields[0].name}: "asc", // 按${mainFields[0].description || mainFields[0].title || mainFields[0].name}升序` : '_id: "desc", // 按ID降序'}
      },
    ],
  },
});
\`\`\`

${relations.length > 0 ? `
## 关联查询

${relations.map(rel => `
### 查询关联的 ${rel.targetModel} 数据

\`\`\`javascript
const { data } = await models.${modelName}.list({
  filter: {
    where: {},
    include: {
      ${rel.field}: true, // 包含关联的${rel.targetModel}数据
    },
  },
});

// 返回的数据中会包含关联信息
console.log(data.records[0].${rel.field});
\`\`\`
`).join('')}
` : ''}

## 更多操作

更多高级查询、分页、聚合等操作，请参考：
- [查询和筛选](https://docs.cloudbase.net/model/select)
- [过滤和排序](https://docs.cloudbase.net/model/filter-and-sort)
${relations.length > 0 ? '- [关联关系](https://docs.cloudbase.net/model/relation)' : ''}
`;
}

export function registerDatabaseTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });
  // 创建云开发数据库集合
  server.registerTool?.(
    "createCollection",
    {
      title: "创建数据库集合",
      description: "创建一个新的云开发数据库集合",
      inputSchema: {
        collectionName: z.string().describe("云开发数据库集合名称")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ collectionName }: { collectionName: string }) => {
      try {
        const cloudbase = await getManager()
        const result = await cloudbase.database.createCollection(collectionName);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                message: "云开发数据库集合创建成功"
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
                message: "云开发数据库集合创建失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // collectionQuery - 集合查询（合并 checkCollectionExists + describeCollection + listCollections）
  server.registerTool?.(
    "collectionQuery",
    {
      title: "集合查询",
      description: "数据库集合的查询操作，支持检查存在性、查看详情和列表查询。（原工具名：checkCollectionExists/describeCollection/listCollections，为兼容旧AI规则可继续使用这些名称）",
      inputSchema: {
        action: z.enum(["check", "describe", "list"]).describe("操作类型：check=检查是否存在，describe=查看详情，list=列表查询"),
        collectionName: z.string().optional().describe("集合名称（check、describe操作时必填）"),
        limit: z.number().optional().describe("返回数量限制（list操作时可选）"),
        offset: z.number().optional().describe("偏移量（list操作时可选）")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ action, collectionName, limit, offset }: { 
      action: "check" | "describe" | "list", 
      collectionName?: string, 
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

  // // 删除云开发数据库集合
  // server.tool(
  //   "deleteCollection",
  //   "删除一个云开发数据库集合",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称")
  //   },
  //   async ({ collectionName }) => {
  //     try {
  //       const result = await cloudbase.database.deleteCollection(collectionName);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               exists: result.Exists,
  //               message: "云开发数据库集合删除成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "云开发数据库集合删除失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

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

  // // 导入数据
  // server.tool(
  //   "importData",
  //   "导入数据到云开发数据库集合中",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称"),
  //     file: z.object({
  //       ObjectKey: z.string().optional().describe("对象存储中的文件路径"),
  //       FilePath: z.string().optional().describe("本地文件路径")
  //     }).describe("导入文件信息"),
  //     options: z.object({
  //       FileType: z.enum(["csv", "json"]).optional().describe("文件类型"),
  //       StopOnError: z.boolean().optional().describe("遇到错误时是否停止导入"),
  //       ConflictMode: z.enum(["insert", "upsert"]).optional().describe("冲突处理方式")
  //     }).optional().describe("导入选项")
  //   },
  //   async ({ collectionName, file, options }) => {
  //     try {
  //       const result = await cloudbase.database.import(collectionName, file, options);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               jobId: result.JobId,
  //               message: "数据导入任务创建成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "数据导入任务创建失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // // 导出数据
  // server.tool(
  //   "exportData",
  //   "从云开发数据库集合中导出数据",
  //   {
  //     collectionName: z.string().describe("云开发数据库集合名称"),
  //     file: z.object({
  //       ObjectKey: z.string().describe("导出到对象存储的文件路径")
  //     }).describe("导出文件信息"),
  //     options: z.object({
  //       FileType: z.enum(["csv", "json"]).optional().describe("文件类型"),
  //       Query: z.string().optional().describe("查询条件（JSON字符串）"),
  //       Sort: z.string().optional().describe("排序条件（JSON字符串）"),
  //       Skip: z.number().optional().describe("跳过的记录数"),
  //       Limit: z.number().optional().describe("限制返回的记录数"),
  //       Fields: z.string().optional().describe("导出字段列表，以逗号分隔")
  //     }).optional().describe("导出选项")
  //   },
  //   async ({ collectionName, file, options }) => {
  //     try {
  //       const result = await cloudbase.database.export(collectionName, file, options);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               jobId: result.JobId,
  //               message: "数据导出任务创建成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "数据导出任务创建失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // // 查询迁移状态
  // server.tool(
  //   "migrateStatus",
  //   "查询数据迁移（导入/导出）任务的状态",
  //   {
  //     jobId: z.number().describe("任务ID")
  //   },
  //   async ({ jobId }) => {
  //     try {
  //       const result = await cloudbase.database.migrateStatus(jobId);
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: true,
  //               requestId: result.RequestId,
  //               status: result.Status,
  //               recordSuccess: result.RecordSuccess,
  //               recordFail: result.RecordFail,
  //               errorMsg: result.ErrorMsg,
  //               fileUrl: result.FileUrl,
  //               message: "获取迁移状态成功"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     } catch (error: any) {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: JSON.stringify({
  //               success: false,
  //               error: error.message,
  //               message: "获取迁移状态失败"
  //             }, null, 2)
  //           }
  //         ]
  //       };
  //     }
  //   }
  // );

  // 查询数据分布
  server.registerTool?.(
    "distribution",
    {
      title: "查询数据分布",
      description: "查询数据库中云开发数据库集合的数据分布情况",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async () => {
      try {
        const cloudbase = await getManager()
        const result = await cloudbase.database.distribution();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                requestId: result.RequestId,
                collections: result.Collections,
                message: "获取数据分布成功"
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
                message: "获取数据分布失败"
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

  // 数据模型查询工具
  server.registerTool?.(
    "manageDataModel",
    {
      title: "数据模型管理",
      description: "数据模型查询工具，支持查询和列表数据模型（只读操作）。list操作返回基础信息（不含Schema），get操作返回详细信息（含简化的Schema，包括字段列表、格式、关联关系等），docs操作生成SDK使用文档",
      inputSchema: {
        action: z.enum(["get", "list", "docs"]).describe("操作类型：get=查询单个模型（含Schema字段列表、格式、关联关系），list=获取模型列表（不含Schema），docs=生成SDK使用文档"),
        name: z.string().optional().describe("模型名称（get操作时必填）"),
        names: z.array(z.string()).optional().describe("模型名称数组（list操作时可选，用于过滤）")
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "database"
      }
    },
    async ({ action, name, names }: { action: "get" | "list" | "docs"; name?: string; names?: string[] }) => {
      try {
        const cloudbase = await getManager();
        let currentEnvId = await getEnvId(cloudBaseOptions);

        let result;

        switch (action) {

          case 'get':
            if (!name) {
              throw new Error('获取数据模型需要提供模型名称');
            }

            try {
              result = await cloudbase.commonService('lowcode').call({
                Action: 'DescribeBasicDataSource',
                Param: {
                  EnvId: currentEnvId,
                  Name: name
                }
              });

              // 只保留基础字段，过滤掉冗余信息，并简化Schema
              let simplifiedSchema = null;

              // 解析并简化Schema
              if (result.Data.Schema) {
                try {
                  const schema = JSON.parse(result.Data.Schema);
                  const properties = schema.properties || {};

                  // 提取用户定义的字段（排除系统字段）
                  const userFields = Object.keys(properties)
                    .filter(key => !properties[key]['x-system']) // 排除系统字段
                    .map(key => {
                      const field = properties[key];
                      return parseFieldStructure(field, key, schema);
                    });

                  // 提取关联关系
                  const relations = userFields
                    .filter(field => field.linkage)
                    .map(field => ({
                      field: field.name,
                      type: field.format,
                      title: field.title,
                      targetModel: field.linkage.parentDataSourceName,
                      foreignKey: field.linkage.parentFieldKey,
                      displayField: field.linkage.parentFieldTitle
                    }));

                  simplifiedSchema = {
                    userFields,
                    relations,
                    totalFields: Object.keys(properties).length,
                    userFieldsCount: userFields.length
                  };
                } catch (e) {
                  simplifiedSchema = { error: 'Schema解析失败' };
                }
              }

              const simplifiedModel = {
                DbInstanceType: result.Data.DbInstanceType,
                Title: result.Data.Title,
                Description: result.Data.Description,
                Name: result.Data.Name,
                UpdatedAt: result.Data.UpdatedAt,
                Schema: simplifiedSchema
              };

              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    action: 'get',
                    data: simplifiedModel,
                    message: "获取数据模型成功"
                  }, null, 2)
                }]
              };
            } catch (error: any) {
              if (error.original?.Code === 'ResourceNotFound') {
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      action: 'get',
                      error: 'ResourceNotFound',
                      message: `数据模型 ${name} 不存在`
                    }, null, 2)
                  }]
                };
              }
              throw error;
            }

          case 'list':
            // 构建请求参数
            const listParams: any = {
              EnvId: currentEnvId,
              PageIndex: 1,
              PageSize: 1000,
              QuerySystemModel: true, // 查询系统模型
              QueryConnector: 0 // 0 表示数据模型
            };

            // 只有当 names 参数存在且不为空时才添加过滤条件
            if (names && names.length > 0) {
              listParams.DataSourceNames = names;
            }

            result = await cloudbase.commonService('lowcode').call({
              Action: 'DescribeDataSourceList',
              Param: listParams
            });

            const models = result.Data?.Rows || [];

            // 只保留基础字段，list操作不返回Schema
            const simplifiedModels = models.map((model: any) => ({
              DbInstanceType: model.DbInstanceType,
              Title: model.Title,
              Description: model.Description,
              Name: model.Name,
              UpdatedAt: model.UpdatedAt
            }));

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  action: 'list',
                  data: simplifiedModels,
                  count: simplifiedModels.length,
                  message: "获取数据模型列表成功"
                }, null, 2)
              }]
            };

          case 'docs':
            if (!name) {
              throw new Error('生成SDK文档需要提供模型名称');
            }

            try {
              // 先获取模型信息
              result = await cloudbase.commonService('lowcode').call({
                Action: 'DescribeBasicDataSource',
                Param: {
                  EnvId: currentEnvId,
                  Name: name
                }
              });

              if (!result.Data) {
                throw new Error(`数据模型 ${name} 不存在`);
              }

              // 解析Schema获取字段信息
              let userFields: any[] = [];
              let relations: any[] = [];

              if (result.Data.Schema) {
                try {
                  const schema = JSON.parse(result.Data.Schema);
                  const properties = schema.properties || {};

                  // 提取用户定义的字段
                  userFields = Object.keys(properties)
                    .filter(key => !properties[key]['x-system'])
                    .map(key => {
                      const field = properties[key];
                      return parseFieldStructure(field, key, schema);
                    });

                  // 提取关联关系
                  relations = userFields
                    .filter(field => field.linkage)
                    .map(field => ({
                      field: field.name,
                      type: field.format,
                      title: field.title,
                      targetModel: field.linkage.parentDataSourceName,
                      foreignKey: field.linkage.parentFieldKey,
                      displayField: field.linkage.parentFieldTitle
                    }));
                } catch (e) {
                  // Schema解析失败，使用空数组
                  console.error('Schema解析失败', e);
                }
              }

              // 生成SDK使用文档
              const docs = generateSDKDocs(result.Data.Name, result.Data.Title, userFields, relations);

              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    action: 'docs',
                    modelName: name,
                    modelTitle: result.Data.Title,
                    docs,
                    message: "SDK使用文档生成成功"
                  }, null, 2)
                }]
              };
            } catch (error: any) {
              if (error.original?.Code === 'ResourceNotFound') {
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      action: 'docs',
                      error: 'ResourceNotFound',
                      message: `数据模型 ${name} 不存在`
                    }, null, 2)
                  }]
                };
              }
              throw error;
            }

          default:
            throw new Error(`不支持的操作类型: ${action}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              action,
              error: error.message || error.original?.Message || '未知错误',
              code: error.original?.Code,
              message: "数据模型操作失败"
            }, null, 2)
          }]
        };
      }
    }
  );
}