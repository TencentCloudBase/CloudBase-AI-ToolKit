import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { registerGatewayTools } from "./tools/gateway.js";

/**
 * Create and configure a CloudBase MCP Server instance
 * @param options Server configuration options
 * @returns Configured McpServer instance
 */
export function createCloudBaseMcpServer(options?: {
  name?: string;
  version?: string;
  enableTelemetry?: boolean;
}): McpServer {
  const {
    name = "cloudbase-mcp",
    version = "1.0.0",
    enableTelemetry = true
  } = options ?? {};

  // Create server instance
  const server = new McpServer({
    name,
    version,
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Enable telemetry if requested
  if (enableTelemetry) {
    wrapServerWithTelemetry(server);
  }

  // Register all tools
  registerEnvTools(server);
  registerRagTools(server);
  // registerFileTools(server);
  registerDatabaseTools(server);
  registerHostingTools(server);
  registerFunctionTools(server);
  registerDownloadTools(server);
  registerStorageTools(server);
  registerSetupTools(server);
  registerInteractiveTools(server);
  registerGatewayTools(server);

  return server;
}

/**
 * Get the default configured CloudBase MCP Server
 */
export function getDefaultServer(): McpServer {
  return createCloudBaseMcpServer();
}

// Re-export types and utilities that might be useful
export type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export { telemetryReporter, reportToolkitLifecycle } from "./utils/telemetry.js";
export { info, error, warn } from "./utils/logger.js"; 