import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

export function registerGatewayTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  server.registerTool?.(
    "createFunctionHTTPAccess",
    {
      title: "创建云函数HTTP访问",
      description: "创建云函数的 HTTP 访问",
      inputSchema: {
        name: z.string().describe("函数名"),
        path: z.string().describe("HTTP 访问路径")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "gateway"
      }
    },
    async ({ name, path }: { name: string; path: string }) => {
      const cloudbase = await getManager()

      const result = await cloudbase.access.createAccess({
        type: 1,
        name,
        path
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