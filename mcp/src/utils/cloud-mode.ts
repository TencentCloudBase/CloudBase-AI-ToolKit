import { debug } from './logger.js';

/**
 * Check if MCP is running in cloud mode
 * Cloud mode is enabled by:
 * 1. Command line argument --cloud-mode
 * 2. Environment variable CLOUDBASE_MCP_CLOUD_MODE=true
 * 3. Environment variable MCP_CLOUD_MODE=true
 */
export function isCloudMode(): boolean {
  const cloudModeEnabled = process.env.CLOUDBASE_MCP_CLOUD_MODE === 'true' || 
                          process.env.MCP_CLOUD_MODE === 'true';
  
  if (cloudModeEnabled) {
    debug('Cloud mode is enabled');
  }
  
  return cloudModeEnabled;
}

/**
 * Enable cloud mode by setting environment variable
 */
export function enableCloudMode(): void {
  process.env.CLOUDBASE_MCP_CLOUD_MODE = 'true';
  debug('Cloud mode enabled via API call');
}

/**
 * Get cloud mode status for logging/debugging
 */
export function getCloudModeStatus(): { 
  enabled: boolean; 
  source: string | null;
} {
  if (process.env.CLOUDBASE_MCP_CLOUD_MODE === 'true') {
    return { enabled: true, source: 'CLOUDBASE_MCP_CLOUD_MODE' };
  }
  if (process.env.MCP_CLOUD_MODE === 'true') {
    return { enabled: true, source: 'MCP_CLOUD_MODE' };
  }
  return { enabled: false, source: null };
}

/**
 * Check if a tool should be registered in cloud mode
 * @param toolName - The name of the tool
 * @returns true if the tool should be registered in current mode
 */
export function shouldRegisterTool(toolName: string): boolean {
  // If not in cloud mode, register all tools
  if (!isCloudMode()) {
    return true;
  }

  // Cloud-incompatible tools that involve local file operations
  const cloudIncompatibleTools = [
    // Storage tools - local file uploads
    'uploadFile',
    
    // Hosting tools - local file uploads  
    'uploadFiles',
    
    // Function tools - local code uploads
    'updateFunctionCode',
    'createFunction', // also involves local files
    
    // Miniprogram tools - local code uploads
    'uploadMiniprogramCode',
    
    // Download tools - local file downloads
    'downloadTemplate',
    
    // Setup tools - local config file operations
    'setupEnvironmentId',
    'clearUserEnvId',
    
    // Interactive tools - local server and file operations
    'interactiveDialog'
  ];

  const shouldRegister = !cloudIncompatibleTools.includes(toolName);
  
  if (!shouldRegister) {
    debug(`Cloud mode: skipping registration of incompatible tool: ${toolName}`);
  }
  
  return shouldRegister;
}

/**
 * Conditional tool registration wrapper
 * Only registers the tool if it's compatible with current mode
 */
export function conditionalRegisterTool(
  server: any,
  toolName: string,
  toolConfig: any,
  handler: any
): void {
  if (shouldRegisterTool(toolName)) {
    server.registerTool?.(toolName, toolConfig, handler);
  } else {
    debug(`Skipped registering tool '${toolName}' in cloud mode`);
  }
}
