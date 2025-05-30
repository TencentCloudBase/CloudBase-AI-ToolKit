import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'

export function registerFunctionTools(server: McpServer) {
  // getFunctionList - 获取云函数列表(推荐)
  server.tool(
    "getFunctionList",
    "获取云函数列表",
    {
      limit: z.number().optional().describe("范围"),
      offset: z.number().optional().describe("偏移")
    },
    async ({ limit, offset }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.getFunctionList(limit, offset);
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

  // createFunction - 创建云函数
  server.tool(
    "createFunction",
    "创建云函数",
    {
      func: z.object({
        name: z.string().describe("函数名称"),
        timeout: z.number().optional().describe("函数超时时间"),
        envVariables: z.record(z.string()).optional().describe("环境变量"),
        vpc: z.object({
          vpcId: z.string(),
          subnetId: z.string()
        }).optional().describe("私有网络配置"),
        runtime: z.string().optional().describe("运行时环境"),
        installDependency: z.boolean().optional().describe("是否安装依赖，建议传 true"),
        triggers: z.array(z.object({
          name: z.string(),
          type: z.string(),
          config: z.string()
        })).optional().describe("触发器配置"),
        handler: z.string().optional().describe("函数入口"),
        ignore: z.union([z.string(), z.array(z.string())]).optional().describe("忽略文件"),
        isWaitInstall: z.boolean().optional().describe("是否等待依赖安装"),
        layers: z.array(z.object({
          name: z.string(),
          version: z.number()
        })).optional().describe("Layer配置")
      }).describe("函数配置"),
      functionRootPath: z.string().optional().describe("函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径，指定之后可以自动上传这部分的文件作为代码"),
      force: z.boolean().describe("是否覆盖")
    },
    async ({ func, functionRootPath, force }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.createFunction({
        func,
        functionRootPath,
        force
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

  // updateFunctionCode - 更新函数代码
  server.tool(
    "updateFunctionCode",
    "更新云函数代码",
    {
      func: z.object({
        name: z.string().describe("函数名称")
      }).describe("函数配置"),
      functionRootPath: z.string().optional().describe("函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径，指定之后可以自动上传这部分的文件作为代码")
    },
    async ({ func, functionRootPath }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.updateFunctionCode({
        func: {
          ...func,
          installDependency: true // 默认安装依赖
        },
        functionRootPath,
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

  // updateFunctionConfig - 更新函数配置
  server.tool(
    "updateFunctionConfig",
    "更新云函数配置",
    {
      funcParam: z.object({
        name: z.string().describe("函数名称"),
        timeout: z.number().optional().describe("超时时间"),
        envVariables: z.record(z.string()).optional().describe("环境变量"),
        vpc: z.object({
          vpcId: z.string(),
          subnetId: z.string()
        }).optional().describe("VPC配置"),
        runtime: z.string().optional().describe("运行时")
      }).describe("函数配置")
    },
    async ({ funcParam }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.updateFunctionConfig(funcParam);
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

  // getFunctionDetail - 获取函数详情
  server.tool(
    "getFunctionDetail",
    "获取云函数详情",
    {
      name: z.string().describe("函数名称"),
      codeSecret: z.string().optional().describe("代码保护密钥")
    },
    async ({ name, codeSecret }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.getFunctionDetail(name, codeSecret);
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

  // invokeFunction - 调用函数
  server.tool(
    "invokeFunction",
    "调用云函数",
    {
      name: z.string().describe("函数名称"),
      params: z.record(z.any()).optional().describe("调用参数")
    },
    async ({ name, params }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.invokeFunction(name, params);
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

  // getFunctionLogs - 获取函数日志
  server.tool(
    "getFunctionLogs",
    "获取云函数日志",
    {
      options: z.object({
        name: z.string().describe("函数名称"),
        offset: z.number().optional().describe("偏移量"),
        limit: z.number().optional().describe("返回数量"),
        order: z.string().optional().describe("排序方式"),
        orderBy: z.string().optional().describe("排序字段"),
        startTime: z.string().optional().describe("开始时间"),
        endTime: z.string().optional().describe("结束时间"),
        requestId: z.string().optional().describe("请求ID")
      }).describe("日志查询选项")
    },
    async ({ options }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.getFunctionLogs(options);
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

  // createFunctionTriggers - 创建函数触发器
  server.tool(
    "createFunctionTriggers",
    "创建云函数触发器",
    {
      name: z.string().describe("函数名"),
      triggers: z.array(z.object({
        name: z.string().describe("触发器名称"),
        type: z.string().describe("触发器类型"),
        config: z.string().describe("触发器配置")
      })).describe("触发器配置数组")
    },
    async ({ name, triggers }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.createFunctionTriggers(name, triggers);
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

  // deleteFunctionTrigger - 删除函数触发器
  server.tool(
    "deleteFunctionTrigger",
    "删除云函数触发器",
    {
      name: z.string().describe("函数名"),
      triggerName: z.string().describe("触发器名称")
    },
    async ({ name, triggerName }) => {
      const cloudbase = await getCloudBaseManager()
      const result = await cloudbase.functions.deleteFunctionTrigger(name, triggerName);
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

  // // Layer相关功能
  // // createLayer - 创建Layer
  // server.tool(
  //   "createLayer",
  //   "创建Layer",
  //   {
  //     options: z.object({
  //       contentPath: z.string().optional().describe("Layer内容路径"),
  //       base64Content: z.string().optional().describe("base64编码的内容"),
  //       name: z.string().describe("Layer名称"),
  //       runtimes: z.array(z.string()).describe("运行时列表"),
  //       description: z.string().optional().describe("描述"),
  //       licenseInfo: z.string().optional().describe("许可证信息")
  //     }).describe("Layer配置")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.createLayer(options);
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

  // // listLayers - 获取Layer列表
  // server.tool(
  //   "listLayers",
  //   "获取Layer列表",
  //   {
  //     options: z.object({
  //       offset: z.number().optional().describe("偏移"),
  //       limit: z.number().optional().describe("数量限制"),
  //       runtime: z.string().optional().describe("运行时"),
  //       searchKey: z.string().optional().describe("搜索关键字")
  //     }).optional().describe("查询选项")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.listLayers(options || {});
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

  // // getLayerVersion - 获取Layer版本详情
  // server.tool(
  //   "getLayerVersion",
  //   "获取Layer版本详情",
  //   {
  //     options: z.object({
  //       name: z.string().describe("Layer名称"),
  //       version: z.number().describe("版本号")
  //     }).describe("查询选项")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.getLayerVersion(options);
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

  // // 版本管理相关功能
  // // publishVersion - 发布新版本
  // server.tool(
  //   "publishVersion",
  //   "发布函数新版本",
  //   {
  //     options: z.object({
  //       functionName: z.string().describe("函数名称"),
  //       description: z.string().optional().describe("版本描述")
  //     }).describe("发布选项")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.publishVersion(options);
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

  // // listVersionByFunction - 获取版本列表
  // server.tool(
  //   "listVersionByFunction",
  //   "获取函数版本列表",
  //   {
  //     options: z.object({
  //       functionName: z.string().describe("函数名称"),
  //       offset: z.number().optional().describe("偏移"),
  //       limit: z.number().optional().describe("数量限制"),
  //       order: z.string().optional().describe("排序方式"),
  //       orderBy: z.string().optional().describe("排序字段")
  //     }).describe("查询选项")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.listVersionByFunction(options);
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

  // // 别名配置相关功能
  // // updateFunctionAliasConfig - 更新别名配置
  // server.tool(
  //   "updateFunctionAliasConfig",
  //   "更新函数别名配置",
  //   {
  //     options: z.object({
  //       functionName: z.string().describe("函数名称"),
  //       name: z.string().describe("别名名称"),
  //       functionVersion: z.string().describe("函数版本"),
  //       description: z.string().optional().describe("描述"),
  //       routingConfig: z.object({
  //         AddtionVersionMatchs: z.array(z.object({
  //           Version: z.string(),
  //           Key: z.string(),
  //           Method: z.string(),
  //           Expression: z.string()
  //         }))
  //       }).optional().describe("路由配置")
  //     }).describe("别名配置")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.updateFunctionAliasConfig(options);
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

  // // getFunctionAlias - 获取别名配置
  // server.tool(
  //   "getFunctionAlias",
  //   "获取函数别名配置",
  //   {
  //     options: z.object({
  //       functionName: z.string().describe("函数名称"),
  //       name: z.string().describe("别名名称")
  //     }).describe("查询选项")
  //   },
  //   async ({ options }) => {
  //     const cloudbase = await getCloudBaseManager()
  //     const result = await cloudbase.functions.getFunctionAlias(options);
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