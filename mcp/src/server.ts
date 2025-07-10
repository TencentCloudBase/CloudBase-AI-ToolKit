import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEnvTools } from "./tools/env.js";
import { registerFunctionTools } from "./tools/functions.js";
import { registerDatabaseTools } from "./tools/database.js";
import { registerHostingTools } from "./tools/hosting.js";
import { registerDownloadTools } from "./tools/download.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerRagTools } from './tools/rag.js';
import { registerSetupTools } from "./tools/setup.js";
import { registerInteractiveTools } from "./tools/interactive.js";
import { registerMiniprogramTools } from "./tools/miniprogram.js";
import { wrapServerWithTelemetry } from "./utils/tool-wrapper.js";
import { registerGatewayTools } from "./tools/gateway.js";
import { CloudBaseOptions } from "./types.js";

// 插件定义
interface PluginDefinition {
  name: string;
  register: (server: ExtendedMcpServer) => void;
}

// 默认插件列表
const DEFAULT_PLUGINS = ['env', 'database', 'functions', 'hosting', 'storage', 'setup', 'interactive', 'rag', 'gateway', 'download', 'miniprogram'];

// 可用插件映射
const AVAILABLE_PLUGINS: Record<string, PluginDefinition> = {
  env: { name: 'env', register: registerEnvTools },
  database: { name: 'database', register: registerDatabaseTools },
  functions: { name: 'functions', register: registerFunctionTools },
  hosting: { name: 'hosting', register: registerHostingTools },
  storage: { name: 'storage', register: registerStorageTools },
  setup: { name: 'setup', register: registerSetupTools },
  interactive: { name: 'interactive', register: registerInteractiveTools },
  rag: { name: 'rag', register: registerRagTools },
  download: { name: 'download', register: registerDownloadTools },
  gateway: { name: 'gateway', register: registerGatewayTools },
  miniprogram: { name: 'miniprogram', register: registerMiniprogramTools },
};

/**
 * 解析启用的插件列表
 */
function parseEnabledPlugins(): string[] {
  const enabledEnv = process.env.CLOUDBASE_MCP_PLUGINS_ENABLED;
  const disabledEnv = process.env.CLOUDBASE_MCP_PLUGINS_DISABLED;
  
  let enabledPlugins: string[];
  
  if (enabledEnv) {
    // 如果指定了启用的插件，使用指定的插件
    enabledPlugins = enabledEnv.split(',').map(p => p.trim());
  } else {
    // 否则使用默认插件
    enabledPlugins = [...DEFAULT_PLUGINS];
  }
  
  if (disabledEnv) {
    // 从启用列表中移除禁用的插件
    const disabledPlugins = disabledEnv.split(',').map(p => p.trim());
    enabledPlugins = enabledPlugins.filter(p => !disabledPlugins.includes(p));
  }
  
  return enabledPlugins;
}

// 扩展 McpServer 类型以包含 cloudBaseOptions 和新的registerTool方法
export interface ExtendedMcpServer extends McpServer {
  cloudBaseOptions?: CloudBaseOptions;
}

/**
 * Create and configure a CloudBase MCP Server instance
 * @param options Server configuration options
 * @returns Configured McpServer instance
 */
export function createCloudBaseMcpServer(options?: {
  name?: string;
  version?: string;
  enableTelemetry?: boolean;
  cloudBaseOptions?: CloudBaseOptions;
}): ExtendedMcpServer {
  const {
    name = "cloudbase-mcp",
    version = "1.0.0",
    enableTelemetry = true,
    cloudBaseOptions
  } = options ?? {};

  // Create server instance
  const server = new McpServer({
    name,
    version,
    capabilities: {
      tools: {},
    },
  }) as ExtendedMcpServer;

  // Store cloudBaseOptions in server instance for tools to access
  if (cloudBaseOptions) {
    server.cloudBaseOptions = cloudBaseOptions;
  }

  // Enable telemetry if requested
  if (enableTelemetry) {
    wrapServerWithTelemetry(server);
  }

  // 根据配置注册插件
  const enabledPlugins = parseEnabledPlugins();
  
  for (const pluginName of enabledPlugins) {
    const plugin = AVAILABLE_PLUGINS[pluginName];
    if (plugin) {
      plugin.register(server);
    }
  }

  return server;
}

/**
 * Get the default configured CloudBase MCP Server
 */
export function getDefaultServer(): ExtendedMcpServer {
  return createCloudBaseMcpServer();
}

// Re-export types and utilities that might be useful
export type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export { telemetryReporter, reportToolkitLifecycle } from "./utils/telemetry.js";
export { info, error, warn } from "./utils/logger.js"; 