import { z } from "zod";
import { ExtendedMcpServer } from "../server.js";
import { error, info } from "../utils/logger.js";

// 动态导入 miniprogram-ci 以避免依赖问题
async function getMiniprogramCi() {
  try {
    const ci = await import("miniprogram-ci");
    return ci;
  } catch (err) {
    throw new Error(`Failed to load miniprogram-ci: ${err}. Please install it with: npm install miniprogram-ci@2.1.14`);
  }
}

// 获取私钥配置
function getPrivateKeyConfig() {
  const privateKey = process.env.MINIPROGRAM_PRIVATE_KEY;
  const privateKeyPath = process.env.MINIPROGRAM_PRIVATE_KEY_PATH;
  
  if (!privateKey && !privateKeyPath) {
    throw new Error("Please set MINIPROGRAM_PRIVATE_KEY or MINIPROGRAM_PRIVATE_KEY_PATH environment variable");
  }
  
  return {
    privateKey,
    privateKeyPath
  };
}

// 创建项目配置
async function createProject(projectPath: string, appId: string, type: "miniProgram" | "miniGame" = "miniProgram") {
  const ci = await getMiniprogramCi();
  const { privateKey, privateKeyPath } = getPrivateKeyConfig();
  
  return new ci.Project({
    appid: appId,
    type,
    projectPath,
    privateKey,
    privateKeyPath,
    ignores: ["node_modules/**/*"]
  });
}

export function registerMiniprogramTools(server: ExtendedMcpServer) {
  // 上传小程序代码
  server.setRequestHandler("tools/call", async (request) => {
    if (request.params.name === "uploadMiniprogramCode") {
      try {
        const args = z.object({
          appId: z.string().describe("小程序 appId"),
          projectPath: z.string().describe("项目路径"),
          version: z.string().describe("版本号"),
          desc: z.string().optional().describe("版本描述"),
          setting: z.object({
            es6: z.boolean().optional().describe("是否启用 ES6 转 ES5"),
            es7: z.boolean().optional().describe("是否启用 ES7 转 ES5"),
            minify: z.boolean().optional().describe("是否压缩代码"),
            minifyWXSS: z.boolean().optional().describe("是否压缩 WXSS"),
            minifyJS: z.boolean().optional().describe("是否压缩 JS"),
            autoPrefixWXSS: z.boolean().optional().describe("是否自动补全 WXSS"),
          }).optional().describe("编译设置"),
          robot: z.number().optional().describe("机器人编号，1-30"),
          type: z.enum(["miniProgram", "miniGame"]).optional().describe("项目类型")
        }).parse(request.params.arguments);

        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appId, args.type);
        
        const result = await ci.upload({
          project,
          version: args.version,
          desc: args.desc || `版本 ${args.version}`,
          setting: {
            es6: true,
            es7: true,
            minify: true,
            minifyWXSS: true,
            minifyJS: true,
            autoPrefixWXSS: true,
            ...args.setting
          },
          robot: args.robot || 1,
          onProgressUpdate: (progress) => {
            info(`上传进度: ${progress}%`);
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序代码上传成功",
                data: result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        error("上传小程序代码失败:", err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : String(err)
              }, null, 2)
            }
          ]
        };
      }
    }

    // 预览小程序代码
    if (request.params.name === "previewMiniprogramCode") {
      try {
        const args = z.object({
          appId: z.string().describe("小程序 appId"),
          projectPath: z.string().describe("项目路径"),
          desc: z.string().optional().describe("预览描述"),
          setting: z.object({
            es6: z.boolean().optional().describe("是否启用 ES6 转 ES5"),
            es7: z.boolean().optional().describe("是否启用 ES7 转 ES5"),
            minify: z.boolean().optional().describe("是否压缩代码"),
            minifyWXSS: z.boolean().optional().describe("是否压缩 WXSS"),
            minifyJS: z.boolean().optional().describe("是否压缩 JS"),
            autoPrefixWXSS: z.boolean().optional().describe("是否自动补全 WXSS"),
          }).optional().describe("编译设置"),
          robot: z.number().optional().describe("机器人编号，1-30"),
          type: z.enum(["miniProgram", "miniGame"]).optional().describe("项目类型"),
          qrcodeFormat: z.enum(["image", "base64", "terminal"]).optional().describe("二维码格式"),
          qrcodeOutputDest: z.string().optional().describe("二维码输出路径"),
          pagePath: z.string().optional().describe("预览页面路径"),
          searchQuery: z.string().optional().describe("预览页面参数")
        }).parse(request.params.arguments);

        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appId, args.type);
        
        const result = await ci.preview({
          project,
          desc: args.desc || "预览版本",
          setting: {
            es6: true,
            es7: true,
            minify: true,
            minifyWXSS: true,
            minifyJS: true,
            autoPrefixWXSS: true,
            ...args.setting
          },
          robot: args.robot || 1,
          qrcodeFormat: args.qrcodeFormat || "terminal",
          qrcodeOutputDest: args.qrcodeOutputDest,
          pagePath: args.pagePath,
          searchQuery: args.searchQuery,
          onProgressUpdate: (progress) => {
            info(`预览进度: ${progress}%`);
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序预览成功",
                data: result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        error("预览小程序代码失败:", err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : String(err)
              }, null, 2)
            }
          ]
        };
      }
    }

    // 构建小程序 npm
    if (request.params.name === "buildMiniprogramNpm") {
      try {
        const args = z.object({
          appId: z.string().describe("小程序 appId"),
          projectPath: z.string().describe("项目路径"),
          type: z.enum(["miniProgram", "miniGame"]).optional().describe("项目类型"),
          robot: z.number().optional().describe("机器人编号，1-30")
        }).parse(request.params.arguments);

        const ci = await getMiniprogramCi();
        const project = await createProject(args.projectPath, args.appId, args.type);
        
        const result = await ci.packNpm(project, {
          ignores: ["pack_npm_ignore_list"],
          reporter: (infos) => {
            info("构建 npm 包信息:", infos);
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "小程序 npm 构建成功",
                data: result
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        error("构建小程序 npm 失败:", err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : String(err)
              }, null, 2)
            }
          ]
        };
      }
    }

    // 获取小程序项目配置
    if (request.params.name === "getMiniprogramProjectConfig") {
      try {
        const args = z.object({
          appId: z.string().describe("小程序 appId"),
          projectPath: z.string().describe("项目路径"),
          type: z.enum(["miniProgram", "miniGame"]).optional().describe("项目类型")
        }).parse(request.params.arguments);

        const project = await createProject(args.projectPath, args.appId, args.type);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "获取项目配置成功",
                data: {
                  appId: args.appId,
                  projectPath: args.projectPath,
                  type: args.type || "miniProgram"
                }
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        error("获取小程序项目配置失败:", err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : String(err)
              }, null, 2)
            }
          ]
        };
      }
    }

    return { content: [] };
  });

  // 注册工具
  server.setRequestHandler("tools/list", async () => {
    return {
      tools: [
        {
          name: "uploadMiniprogramCode",
          description: "上传小程序代码到微信平台",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "小程序 appId"
              },
              projectPath: {
                type: "string",
                description: "项目路径"
              },
              version: {
                type: "string",
                description: "版本号"
              },
              desc: {
                type: "string",
                description: "版本描述"
              },
              setting: {
                type: "object",
                description: "编译设置",
                properties: {
                  es6: { type: "boolean", description: "是否启用 ES6 转 ES5" },
                  es7: { type: "boolean", description: "是否启用 ES7 转 ES5" },
                  minify: { type: "boolean", description: "是否压缩代码" },
                  minifyWXSS: { type: "boolean", description: "是否压缩 WXSS" },
                  minifyJS: { type: "boolean", description: "是否压缩 JS" },
                  autoPrefixWXSS: { type: "boolean", description: "是否自动补全 WXSS" }
                }
              },
              robot: {
                type: "number",
                description: "机器人编号，1-30"
              },
              type: {
                type: "string",
                enum: ["miniProgram", "miniGame"],
                description: "项目类型"
              }
            },
            required: ["appId", "projectPath", "version"]
          }
        },
        {
          name: "previewMiniprogramCode",
          description: "预览小程序代码并生成二维码",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "小程序 appId"
              },
              projectPath: {
                type: "string",
                description: "项目路径"
              },
              desc: {
                type: "string",
                description: "预览描述"
              },
              setting: {
                type: "object",
                description: "编译设置",
                properties: {
                  es6: { type: "boolean", description: "是否启用 ES6 转 ES5" },
                  es7: { type: "boolean", description: "是否启用 ES7 转 ES5" },
                  minify: { type: "boolean", description: "是否压缩代码" },
                  minifyWXSS: { type: "boolean", description: "是否压缩 WXSS" },
                  minifyJS: { type: "boolean", description: "是否压缩 JS" },
                  autoPrefixWXSS: { type: "boolean", description: "是否自动补全 WXSS" }
                }
              },
              robot: {
                type: "number",
                description: "机器人编号，1-30"
              },
              type: {
                type: "string",
                enum: ["miniProgram", "miniGame"],
                description: "项目类型"
              },
              qrcodeFormat: {
                type: "string",
                enum: ["image", "base64", "terminal"],
                description: "二维码格式"
              },
              qrcodeOutputDest: {
                type: "string",
                description: "二维码输出路径"
              },
              pagePath: {
                type: "string",
                description: "预览页面路径"
              },
              searchQuery: {
                type: "string",
                description: "预览页面参数"
              }
            },
            required: ["appId", "projectPath"]
          }
        },
        {
          name: "buildMiniprogramNpm",
          description: "构建小程序 npm 包",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "小程序 appId"
              },
              projectPath: {
                type: "string",
                description: "项目路径"
              },
              type: {
                type: "string",
                enum: ["miniProgram", "miniGame"],
                description: "项目类型"
              },
              robot: {
                type: "number",
                description: "机器人编号，1-30"
              }
            },
            required: ["appId", "projectPath"]
          }
        },
        {
          name: "getMiniprogramProjectConfig",
          description: "获取小程序项目配置",
          inputSchema: {
            type: "object",
            properties: {
              appId: {
                type: "string",
                description: "小程序 appId"
              },
              projectPath: {
                type: "string",
                description: "项目路径"
              },
              type: {
                type: "string",
                enum: ["miniProgram", "miniGame"],
                description: "项目类型"
              }
            },
            required: ["appId", "projectPath"]
          }
        }
      ]
    };
  });
}