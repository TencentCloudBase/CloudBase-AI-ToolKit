import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';
import path from 'path';

// CloudRun service types
export const CLOUDRUN_SERVICE_TYPES = ['function', 'container'] as const;
export type CloudRunServiceType = typeof CLOUDRUN_SERVICE_TYPES[number];

// CloudRun access types
export const CLOUDRUN_ACCESS_TYPES = ['WEB', 'VPC', 'PRIVATE'] as const;
export type CloudRunAccessType = typeof CLOUDRUN_ACCESS_TYPES[number];

// Input schema for getCloudRunInfo tool
const GetCloudRunInfoInputSchema = {
  action: z.enum(['list', 'detail', 'templates']).describe('Query type: list services, get service detail, or list templates'),
  
  // List operation parameters
  pageSize: z.number().min(1).max(100).optional().default(10).describe('Number of items per page (default: 10)'),
  pageNum: z.number().min(1).optional().default(1).describe('Page number (default: 1)'),
  serverName: z.string().optional().describe('Filter by service name (for list) or get detail for specific service'),
  serverType: z.enum(CLOUDRUN_SERVICE_TYPES).optional().describe('Filter by service type'),
  
  // Detail operation parameters
  detailServerName: z.string().optional().describe('Service name to get details (required for detail action)'),
};

// Input schema for manageCloudRun tool
const ManageCloudRunInputSchema = {
  action: z.enum(['deploy', 'download', 'delete', 'init']).describe('Management action to perform'),
  serverName: z.string().describe('Service name'),
  
  // Deploy operation parameters
  targetPath: z.string().optional().describe('Local code path (absolute path, required for deploy/download/init)'),
  serverConfig: z.object({
    OpenAccessTypes: z.array(z.enum(CLOUDRUN_ACCESS_TYPES)).optional().describe('Access types: WEB, VPC, PRIVATE'),
    Cpu: z.number().positive().optional().describe('CPU specification (e.g., 0.25, 0.5, 1)'),
    Mem: z.number().positive().optional().describe('Memory specification in GB (e.g., 0.25, 0.5, 1)'),
    MinNum: z.number().min(0).optional().describe('Minimum instance count'),
    MaxNum: z.number().min(1).optional().describe('Maximum instance count'),
    Port: z.number().min(1).max(65535).optional().describe('Port for container services'),
    EnvParams: z.record(z.string()).optional().describe('Environment variables'),
    Dockerfile: z.string().optional().describe('Dockerfile path'),
    BuildDir: z.string().optional().describe('Build directory'),
    InternalAccess: z.boolean().optional().describe('Enable internal access'),
    EntryPoint: z.string().optional().describe('Entry point file'),
    Cmd: z.string().optional().describe('Startup command'),
  }).optional().describe('Service configuration for deployment'),
  
  // Init operation parameters
  template: z.string().optional().default('helloworld').describe('Template name for init (default: helloworld)'),
  
  // Common parameters
  force: z.boolean().optional().default(false).describe('Force operation, skip confirmation (default: false)'),
};

type GetCloudRunInfoInput = {
  action: 'list' | 'detail' | 'templates';
  pageSize?: number;
  pageNum?: number;
  serverName?: string;
  serverType?: CloudRunServiceType;
  detailServerName?: string;
};

type ManageCloudRunInput = {
  action: 'deploy' | 'download' | 'delete' | 'init';
  serverName: string;
  targetPath?: string;
  serverConfig?: any;
  template?: string;
  force?: boolean;
};

/**
 * Validate and normalize file path
 * @param inputPath User provided path
 * @returns Absolute path
 */
function validateAndNormalizePath(inputPath: string): string {
  let normalizedPath = path.resolve(inputPath);
  
  // Basic security check - ensure path is within current working directory or explicit absolute path
  const cwd = process.cwd();
  if (!normalizedPath.startsWith(cwd) && !path.isAbsolute(inputPath)) {
    throw new Error(`Path must be within current working directory: ${cwd}`);
  }
  
  return normalizedPath;
}

/**
 * Format CloudRun service info for display
 */
function formatServiceInfo(service: any) {
  return {
    serviceName: service.ServiceName || service.ServerName,
    serviceType: service.ServiceType || service.ServerType,
    status: service.Status,
    region: service.Region,
    createTime: service.CreateTime,
    updateTime: service.UpdateTime,
    cpu: service.Cpu,
    memory: service.Mem,
    instances: {
      min: service.MinNum,
      max: service.MaxNum,
      current: service.RunningVersions?.length || 0
    },
    accessTypes: service.OpenAccessTypes || [],
    ...(service.Port && { port: service.Port }),
    ...(service.EntryPoint && { entryPoint: service.EntryPoint }),
    ...(service.EnvParams && { envVariables: service.EnvParams }),
  };
}

/**
 * Register CloudRun tools with the MCP server
 */
export function registerCloudRunTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });
  
  // Tool 1: Get CloudRun service information (read operations)
  server.registerTool(
    "getCloudRunInfo",
    {
      title: "Query CloudRun Service Information",
      description: "Query CloudRun service information including service list, details, and available templates",
      inputSchema: GetCloudRunInfoInputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (args: GetCloudRunInfoInput) => {
      try {
        const input = args;
        const manager = await getManager();
        
        if (!manager) {
          throw new Error("Failed to initialize CloudBase manager. Please check your credentials and environment configuration.");
        }

        const cloudrunService = manager.cloudrun;
        
        switch (input.action) {
          case 'list': {
            const listParams: any = {
              pageSize: input.pageSize,
              pageNum: input.pageNum,
            };
            
            if (input.serverName) {
              listParams.serverName = input.serverName;
            }
            
            if (input.serverType) {
              listParams.serverType = input.serverType;
            }
            
            const result = await cloudrunService.list(listParams);
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      services: result.ServerList?.map(formatServiceInfo) || [],
                      pagination: {
                        total: result.Total || 0,
                        pageSize: input.pageSize,
                        pageNum: input.pageNum,
                        totalPages: Math.ceil((result.Total || 0) / (input.pageSize || 10))
                      }
                    },
                    message: `Found ${result.ServerList?.length || 0} CloudRun services`
                  }, null, 2)
                }
              ]
            };
          }
          
          case 'detail': {
            const serverName = input.detailServerName || input.serverName!;
            const result = await cloudrunService.detail({ serverName });
            
            if (!result) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      error: `Service '${serverName}' not found`,
                      message: "Please check the service name and try again."
                    }, null, 2)
                  }
                ]
              };
            }
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      service: formatServiceInfo(result),
                      versions: (result as any).Versions || [],
                      accessUrls: (result as any).AccessUrls || []
                    },
                    message: `Retrieved details for service '${serverName}'`
                  }, null, 2)
                }
              ]
            };
          }
          
          case 'templates': {
            const result = await cloudrunService.getTemplates();
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      templates: result || [],
                      categories: []
                    },
                    message: `Found ${result?.length || 0} available templates`
                  }, null, 2)
                }
              ]
            };
          }
          
          default:
            throw new Error(`Unsupported action: ${input.action}`);
        }
        
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message || 'Unknown error occurred',
                message: "Failed to query CloudRun information. Please check your permissions and try again."
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // Tool 2: Manage CloudRun services (write operations)
  server.registerTool(
    "manageCloudRun",
    {
      title: "Manage CloudRun Services",
      description: "Manage CloudRun services including deploy, download, delete, and initialize operations",
      inputSchema: ManageCloudRunInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (args: ManageCloudRunInput) => {
      try {
        const input = args;
        const manager = await getManager();
        
        if (!manager) {
          throw new Error("Failed to initialize CloudBase manager. Please check your credentials and environment configuration.");
        }

        const cloudrunService = manager.cloudrun;
        let targetPath: string | undefined;
        
        // Validate and normalize path for operations that require it
        if (input.targetPath) {
          targetPath = validateAndNormalizePath(input.targetPath);
        }
        
        switch (input.action) {
          case 'deploy': {
            if (!targetPath) {
              throw new Error("targetPath is required for deploy operation");
            }
            
            const deployParams: any = {
              serverName: input.serverName,
              targetPath: targetPath,
              force: input.force,
            };
            
            // Add server configuration if provided
            if (input.serverConfig) {
              Object.assign(deployParams, input.serverConfig);
            }
            
            const result = await cloudrunService.deploy(deployParams);
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      serviceName: input.serverName,
                      status: 'deployed',
                      deployPath: targetPath
                    },
                    message: `Successfully deployed service '${input.serverName}' from ${targetPath}`
                  }, null, 2)
                }
              ]
            };
          }
          
          case 'download': {
            if (!targetPath) {
              throw new Error("targetPath is required for download operation");
            }
            
            const result = await cloudrunService.download({
              serverName: input.serverName,
              targetPath: targetPath,
            });
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      serviceName: input.serverName,
                      downloadPath: targetPath,
                      filesCount: 0
                    },
                    message: `Successfully downloaded service '${input.serverName}' to ${targetPath}`
                  }, null, 2)
                }
              ]
            };
          }
          
          case 'delete': {
            if (!input.force) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      error: "Delete operation requires confirmation",
                      message: "Please set force: true to confirm deletion of the service. This action cannot be undone."
                    }, null, 2)
                  }
                ]
              };
            }
            
            const result = await cloudrunService.delete({
              serverName: input.serverName,
            });
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      serviceName: input.serverName,
                      status: 'deleted'
                    },
                    message: `Successfully deleted service '${input.serverName}'`
                  }, null, 2)
                }
              ]
            };
          }
          
          case 'init': {
            if (!targetPath) {
              throw new Error("targetPath is required for init operation");
            }
            
            const result = await cloudrunService.init({
              serverName: input.serverName,
              targetPath: targetPath,
              template: input.template,
            });
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      serviceName: input.serverName,
                      template: input.template,
                      initPath: targetPath,
                      projectDir: result.projectDir || targetPath
                    },
                    message: `Successfully initialized service '${input.serverName}' with template '${input.template}' at ${targetPath}`
                  }, null, 2)
                }
              ]
            };
          }
          
          default:
            throw new Error(`Unsupported action: ${input.action}`);
        }
        
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message || 'Unknown error occurred',
                message: `Failed to ${args.action} CloudRun service. Please check your permissions and parameters.`
              }, null, 2)
            }
          ]
        };
      }
    }
  );
}
