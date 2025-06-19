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
import { telemetryReporter, reportToolkitLifecycle } from "./utils/telemetry.js";
import { info } from "./utils/logger.js";

// 记录启动时间
const startTime = Date.now();

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
  info("TencentCloudBase MCP Server running on stdio");

  // 上报启动信息
  if (telemetryReporter.isEnabled()) {
    await reportToolkitLifecycle({
      event: 'start'
    });
  }
}

// 设置进程退出处理
function setupExitHandlers() {
  const handleExit = async (exitCode: number, signal?: string) => {
    if (telemetryReporter.isEnabled()) {
      const duration = Date.now() - startTime;
      await reportToolkitLifecycle({
        event: 'exit',
        duration,
        exitCode,
        error: signal ? `Process terminated by signal: ${signal}` : undefined
      });
    }
  };

  // 正常退出
  process.on('exit', (code) => {
    // 注意：exit 事件中不能使用异步操作，所以这里只能同步处理
    // 异步上报在其他信号处理中完成
  });

  // 异常退出处理
  process.on('SIGINT', async () => {
    await handleExit(0, 'SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await handleExit(0, 'SIGTERM');
    process.exit(0);
  });

  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await handleExit(1, `uncaughtException: ${error.message}`);
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled Rejection:', reason);
    await handleExit(1, `unhandledRejection: ${String(reason)}`);
    process.exit(1);
  });
}

// 设置退出处理器
setupExitHandlers();

main().catch(async (error) => {
  console.error("Fatal error in main():", error);

  // 上报启动失败
  if (telemetryReporter.isEnabled()) {
    const duration = Date.now() - startTime;
    await reportToolkitLifecycle({
      event: 'exit',
      duration,
      exitCode: 1,
      error: `Startup failed: ${error.message}`
    });
  }

  process.exit(1);
});