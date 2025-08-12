// CloudBase MCP Server Library
export {
  createCloudBaseMcpServer,
  getDefaultServer,
  type McpServer,
  type ExtendedMcpServer,
  StdioServerTransport,
  telemetryReporter,
  reportToolkitLifecycle,
  reportToolCall,
  info,
  error,
  warn
} from "./server.js";

export type {
  UploadFileParams,
  ListFilesParams,
  DeleteFileParams,
  GetFileInfoParams,
  ToolResponse,
  DataModelField,
  DataModelSchema,
  DataModel,
  CloudBaseOptions
} from "./types.js";

export { getLoginState, logout } from "./auth.js";

export { isCloudMode, enableCloudMode, getCloudModeStatus, shouldRegisterTool, conditionalRegisterTool } from "./utils/cloud-mode.js";

export {
  getCloudBaseManager,
  getEnvId,
  resetCloudBaseManagerCache,
  createCloudBaseManagerWithOptions
} from "./cloudbase-manager.js";

export type { InteractiveResult } from "./interactive-server.js";

/**
 * Get interactive server instance (CommonJS compatible)
 */
export async function getInteractiveServerAsync() {
  if (typeof require !== 'undefined' && typeof import.meta === 'undefined') {
    throw new Error('Interactive server requires ESM environment or dynamic import. Please use: const { getInteractiveServer } = await import("@cloudbase/cloudbase-mcp")');
  }
  
  const { getInteractiveServer } = await import("./interactive-server.js");
  return getInteractiveServer(undefined);
}