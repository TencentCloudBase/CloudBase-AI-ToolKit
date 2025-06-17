#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerEnvTools } from "./tools/env.js";
// import { registerFileTools } from "./tools/file.js";
import { registerFunctionTools } from "./tools/functions.js";
import { registerDatabaseTools } from "./tools/database.js";
import { registerHostingTools } from "./tools/hosting.js";
import { registerDownloadTools } from "./tools/download.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerRagTools } from './tools/rag.js';
import { registerSetupTools } from "./tools/setup.js";
import { registerInteractiveTools } from "./tools/interactive.js";
import { wrapServerWithTelemetry } from "./utils/tool-wrapper.js";
import { telemetryReporter } from "./utils/telemetry.js";

// Create server instance
const server = new McpServer({
  name: "cloudbase-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// 启用数据上报功能（包装工具调用）
wrapServerWithTelemetry(server);

// Register environment management tools
registerEnvTools(server);

// Register RAG  tools
registerRagTools(server)

// // Register file management tools
// registerFileTools(server);

// Register database management tools
registerDatabaseTools(server);

// Register hosting management tools
registerHostingTools(server);

// Register function management tools
registerFunctionTools(server);

// Register download tools
registerDownloadTools(server);

// Register storage tools
registerStorageTools(server);

// Register setup tools
registerSetupTools(server);

// Register interactive tools
registerInteractiveTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("TencentCloudBase MCP Server running on stdio");

  // 上报启动信息
  if (telemetryReporter.isEnabled()) {
    telemetryReporter.report('mcp_server_start', {
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform
    });
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 