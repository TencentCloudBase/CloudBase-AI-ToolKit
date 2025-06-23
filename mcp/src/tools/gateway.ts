import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

export function registerGatewayTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  server.tool(
    "createFunctionHTTPAccess",
    "创建云函数的 HTTP 访问",
    {
      name: z.string().describe("函数名"),
      path: z.string().describe("HTTP 访问路径"),
    },
    async ({ name, path }) => {
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