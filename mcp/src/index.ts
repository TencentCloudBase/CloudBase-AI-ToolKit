// CloudBase MCP Server Library
// This is the main entry point for using CloudBase MCP as a library

export {
  createCloudBaseMcpServer,
  getDefaultServer,
  type McpServer,
  type ExtendedMcpServer,
  StdioServerTransport,
  telemetryReporter,
  reportToolkitLifecycle,
  info,
  error,
  warn
} from "./server.js";

// Re-export important types
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

// Re-export auth utilities
export { getLoginState, logout } from "./auth.js";

// Re-export CloudBase manager
export {
  getCloudBaseManager,
  getEnvId,
  resetCloudBaseManagerCache,
  createCloudBaseManagerWithOptions
} from "./cloudbase-manager.js";