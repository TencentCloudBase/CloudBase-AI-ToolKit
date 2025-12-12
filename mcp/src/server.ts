import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDatabaseTools } from "./tools/databaseNoSQL.js";
import { registerSQLDatabaseTools } from "./tools/databaseSQL.js";
import { registerDownloadTools } from "./tools/download.js";
import { registerEnvTools } from "./tools/env.js";
import { registerFunctionTools } from "./tools/functions.js";
import { registerHostingTools } from "./tools/hosting.js";
import { registerInteractiveTools } from "./tools/interactive.js";
import { registerRagTools } from "./tools/rag.js";
import { registerSetupTools } from "./tools/setup.js";
import { registerStorageTools } from "./tools/storage.js";
// import { registerMiniprogramTools } from "./tools/miniprogram.js";
import { SetLevelRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerCapiTools } from "./tools/capi.js";
import { registerCloudRunTools } from "./tools/cloudrun.js";
import { registerDataModelTools } from "./tools/dataModel.js";
import { registerGatewayTools } from "./tools/gateway.js";
import { registerInviteCodeTools } from "./tools/invite-code.js";
import { registerSecurityRuleTools } from "./tools/security-rule.js";
import { CloudBaseOptions, Logger } from "./types.js";
import { enableCloudMode } from "./utils/cloud-mode.js";
import { info } from './utils/logger.js';
import { wrapServerWithTelemetry } from "./utils/tool-wrapper.js";

// 插件定义
interface PluginDefinition {
  name: string;
  register: (server: ExtendedMcpServer) => void | Promise<void>;
}

// 默认插件列表
const DEFAULT_PLUGINS = [
  "env",
  "database",
  "functions",
  "hosting",
  "storage",
  "setup",
  "interactive",
  "rag",
  "cloudrun",
  "gateway",
  "download",
  "security-rule",
  "invite-code",
  "capi",
];

function registerDatabase(server: ExtendedMcpServer) {
  registerDatabaseTools(server);
  registerSQLDatabaseTools(server);
  registerDataModelTools(server);
}

// 可用插件映射
const AVAILABLE_PLUGINS: Record<string, PluginDefinition> = {
  env: { name: "env", register: registerEnvTools },
  database: { name: "database", register: registerDatabase },
  functions: { name: "functions", register: registerFunctionTools },
  hosting: { name: "hosting", register: registerHostingTools },
  storage: { name: "storage", register: registerStorageTools },
  setup: { name: "setup", register: registerSetupTools },
  interactive: { name: "interactive", register: registerInteractiveTools },
  rag: { name: "rag", register: registerRagTools },
  download: { name: "download", register: registerDownloadTools },
  gateway: { name: "gateway", register: registerGatewayTools },
  // miniprogram: { name: 'miniprogram', register: registerMiniprogramTools },
  "security-rule": {
    name: "security-rule",
    register: registerSecurityRuleTools,
  },
  "invite-code": { name: "invite-code", register: registerInviteCodeTools },
  cloudrun: { name: "cloudrun", register: registerCloudRunTools },
  capi: { name: "capi", register: registerCapiTools },
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
    enabledPlugins = enabledEnv.split(",").map((p) => p.trim());
  } else {
    // 否则使用默认插件
    enabledPlugins = [...DEFAULT_PLUGINS];
  }

  if (disabledEnv) {
    // 从启用列表中移除禁用的插件
    const disabledPlugins = disabledEnv.split(",").map((p) => p.trim());
    enabledPlugins = enabledPlugins.filter((p) => !disabledPlugins.includes(p));
  }

  return enabledPlugins;
}

// 扩展 McpServer 类型以包含 cloudBaseOptions 和新的registerTool方法
export interface ExtendedMcpServer extends McpServer {
  cloudBaseOptions?: CloudBaseOptions;
  ide?: string;
  logger?: Logger;

  setLogger(logger: Logger): void;
}

/**
 * Create and configure a CloudBase MCP Server instance
 * @param options Server configuration options
 * @returns Configured McpServer instance
 *
 * @example
 * import { createCloudBaseMcpServer } from "@cloudbase/mcp-server";
 * import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
 *
 * const server = createCloudBaseMcpServer({ cloudBaseOptions: {
 *  envId,    // 环境ID
 *  secretId,  // 腾讯云密钥ID
 *  secretKey, // 腾讯云密钥
 *  region, // 地域，默认是 ap-shanghai
 *  token // 临时密钥，有有效期限制，生成密钥时可控制
 * } });
 *
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 */
export async function createCloudBaseMcpServer(options?: {
  name?: string;
  version?: string;
  enableTelemetry?: boolean;
  cloudBaseOptions?: CloudBaseOptions;
  cloudMode?: boolean;
  ide?: string;
  logger?: Logger;
}): Promise<ExtendedMcpServer> {
  const {
    name = "cloudbase-mcp",
    version = "1.0.0",
    enableTelemetry = true,
    cloudBaseOptions,
    cloudMode = false,
    ide,
    logger,
  } = options ?? {};

  // Enable cloud mode if specified
  if (cloudMode) {
    enableCloudMode();
  }

  // Create server instance
  const server = new McpServer(
    {
      name,
      version,
    },
    {
      capabilities: {
        tools: {},
        ...(ide === "CodeBuddy" ? { logging: {} } : {}),
      },
    },
  ) as ExtendedMcpServer;

  // Only set logging handler if logging capability is declared
  if (ide === "CodeBuddy") {
    server.server.setRequestHandler(SetLevelRequestSchema, (request, extra) => {
      info(`--- Logging level: ${request.params.level}`);
      return {};
    });
  }

  // Store cloudBaseOptions in server instance for tools to access
  if (cloudBaseOptions) {
    server.cloudBaseOptions = cloudBaseOptions;
  }

  // Store ide in server instance for telemetry
  if (ide) {
    server.ide = ide;
  }

  // Store logger in server instance for tools to access
  if (logger) {
    server.logger = logger;
  }

  server.setLogger = (logger: Logger) => {
    server.logger = logger;
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
      await plugin.register(server);
    }
  }

  return server;
}

/**
 * Get the default configured CloudBase MCP Server
 */
export function getDefaultServer(): Promise<ExtendedMcpServer> {
  return createCloudBaseMcpServer();
}

// Re-export types and utilities that might be useful
export type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export { error, info, warn } from "./utils/logger.js";
export {
  reportToolCall,
  reportToolkitLifecycle,
  telemetryReporter
} from "./utils/telemetry.js";

