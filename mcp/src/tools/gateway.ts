import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCloudBaseManager } from '../cloudbase-manager.js'

export function registerGatewayTools(server: McpServer) {
  server.tool(
    "createFunctionHTTPAccess",
    "创建云函数的 HTTP 访问",
    {
      name: z.string().describe("函数名"),
      path: z.string().describe("HTTP 访问路径"),
    },
    async ({ name, path }) => {
      const cloudbase = await getCloudBaseManager()

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