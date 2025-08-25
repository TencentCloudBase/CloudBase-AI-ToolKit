import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// CloudRun service types
export const CLOUDRUN_SERVICE_TYPES = ['function', 'container'] as const;
export type CloudRunServiceType = typeof CLOUDRUN_SERVICE_TYPES[number];

// CloudRun access types
export const CLOUDRUN_ACCESS_TYPES = ['WEB', 'VPC', 'PRIVATE'] as const;
export type CloudRunAccessType = typeof CLOUDRUN_ACCESS_TYPES[number];

// Input schema for queryCloudRun tool
const queryCloudRunInputSchema = {
  action: z.enum(['list', 'detail', 'templates']).describe('查询类型：list=获取云托管服务列表，detail=查询云托管服务详情，templates=获取云托管服务模板列表'),
  
  // List operation parameters
  pageSize: z.number().min(1).max(100).optional().default(10).describe('每页数量，默认10，最大100'),
  pageNum: z.number().min(1).optional().default(1).describe('页码，默认1'),
  serverName: z.string().optional().describe('服务名称筛选，支持模糊匹配'),
  serverType: z.enum(CLOUDRUN_SERVICE_TYPES).optional().describe('服务类型筛选：function=函数型云托管（简化开发，支持WebSocket/SSE/文件上传等），container=容器型服务（传统容器部署）'),
  
  // Detail operation parameters
  detailServerName: z.string().optional().describe('要查询的服务名称（detail操作时必需）'),
};

// Input schema for manageCloudRun tool
const ManageCloudRunInputSchema = {
  action: z.enum(['init', 'download', 'run', 'deploy', 'delete']).describe('管理操作：init=初始化云托管代码项目（支持从模板开始，模板列表可通过 queryCloudRun 查询），download=下载云托管服务代码到本地，run=本地运行（仅支持函数型云托管服务），deploy=本地代码部署云托管服务，delete=删除指定的云托管服务'),
  serverName: z.string().describe('服务名称，将作为项目目录名或操作目标'),
  
  // Deploy operation parameters
  targetPath: z.string().optional().describe('本地代码路径（绝对路径，deploy/download/init操作时必需）'),
  serverConfig: z.object({
    OpenAccessTypes: z.array(z.enum(CLOUDRUN_ACCESS_TYPES)).optional().describe('公网访问类型数组：OA=办公网访问，PUBLIC=公网访问，MINIAPP=小程序访问，VPC=VPC访问'),
    Cpu: z.number().positive().optional().describe('CPU规格，如0.25、0.5、1、2等，注意：内存规格必须是CPU规格的2倍'),
    Mem: z.number().positive().optional().describe('内存规格，单位GB，如0.5、1、2、4等，注意：必须是CPU规格的2倍（如CPU=0.25时内存=0.5，CPU=1时内存=2）'),
    MinNum: z.number().min(0).optional().describe('最小实例数，最小值为0。设置后服务将始终保持至少指定数量的实例运行，即使没有请求也会保持运行状态，确保服务快速响应但会增加成本'),
    MaxNum: z.number().min(1).optional().describe('最大实例数，最小值为1。当请求量增加时，服务最多可以扩展到指定数量的实例，超过此数量后将拒绝新的请求'),
    Port: z.number().min(1).max(65535).optional().describe('服务端口，函数型服务固定为3000'),
    EnvParams: z.record(z.string()).optional().describe('环境变量，JSON格式字符串'),
    Dockerfile: z.string().optional().describe('Dockerfile文件名，如Dockerfile（仅容器型服务需要，函数型服务不需要）'),
    BuildDir: z.string().optional().describe('构建目录，指定代码构建的目录路径'),
    InternalAccess: z.boolean().optional().describe('内网访问开关，true=启用内网访问'),
    EntryPoint: z.string().optional().describe('Dockerfile EntryPoint参数，容器启动入口（仅容器型服务需要）'),
    Cmd: z.string().optional().describe('Dockerfile Cmd参数，容器启动命令（仅容器型服务需要）'),
  }).optional().describe('服务配置项，用于部署时的服务参数设置'),
  
  // Init operation parameters
  template: z.string().optional().default('helloworld').describe('模板标识符，默认为helloworld，用于初始化项目'),
  
  // Run operation parameters (function services only)
  runOptions: z.object({
    port: z.number().min(1).max(65535).optional().default(3000).describe('本地运行端口，仅函数型服务有效，默认3000'),
    envParams: z.record(z.string()).optional().describe('附加环境变量，仅本地运行时使用')
  }).optional().describe('本地运行参数（仅函数型云托管服务支持）'),
  
  // Common parameters
  force: z.boolean().optional().default(false).describe('强制操作，跳过确认提示（默认false，删除操作时建议设为true）'),
};

type queryCloudRunInput = {
  action: 'list' | 'detail' | 'templates';
  pageSize?: number;
  pageNum?: number;
  serverName?: string;
  serverType?: CloudRunServiceType;
  detailServerName?: string;
};

type ManageCloudRunInput = {
  action: 'init' | 'download' | 'run' | 'deploy' | 'delete';
  serverName: string;
  targetPath?: string;
  serverConfig?: any;
  template?: string;
  force?: boolean;
  runOptions?: {
    port?: number;
    envParams?: Record<string, string>;
  };
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
    "queryCloudRun",
    {
      title: "查询 CloudRun 服务信息",
      description: "查询云托管服务信息，支持获取服务列表、查询服务详情和获取可用模板列表。返回的服务信息包括服务名称、状态、访问类型、配置详情等。",
      inputSchema: queryCloudRunInputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: "cloudrun"
      }
    },
    async (args: queryCloudRunInput) => {
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

  // Track local running processes for CloudRun function services
  const runningProcesses = new Map<string, number>();

  // Tool 2: Manage CloudRun services (write operations)
  server.registerTool(
    "manageCloudRun",
    {
      title: "管理 CloudRun 服务",
      description: "管理云托管服务，按开发顺序支持：初始化项目（可从模板开始，模板列表可通过 queryCloudRun 查询）、下载服务代码、本地运行（仅函数型服务）、部署代码、删除服务。部署可配置CPU、内存、实例数、访问类型等参数。删除操作需要确认，建议设置force=true。",
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
          
          case 'run': {
            if (!targetPath) {
              throw new Error("targetPath is required for run operation");
            }

            // Do not support container services locally: basic heuristic - if Dockerfile exists, treat as container
            const dockerfilePath = path.join(targetPath, 'Dockerfile');
            if (fs.existsSync(dockerfilePath)) {
              throw new Error("Local run is only supported for function-type CloudRun services. Container services are not supported.");
            }

            // Prevent duplicate runs per serviceName
            if (runningProcesses.has(input.serverName)) {
              const existingPid = runningProcesses.get(input.serverName)!;
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: true,
                      data: {
                        serviceName: input.serverName,
                        status: 'running',
                        pid: existingPid,
                        cwd: targetPath
                      },
                      message: `Service '${input.serverName}' is already running locally (pid=${existingPid})`
                    }, null, 2)
                  }
                ]
              };
            }

            const pkgJsonPath = path.join(targetPath, 'package.json');
            let command: string;
            let args: string[] = [];
            if (fs.existsSync(pkgJsonPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                if (pkg.scripts && typeof pkg.scripts.dev === 'string') {
                  command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                  args = ['run', 'dev'];
                } else if (pkg.scripts && typeof pkg.scripts.start === 'string') {
                  command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                  args = ['run', 'start'];
                } else {
                  command = process.execPath; // node
                  const fallback = ['index.js', 'app.js', 'server.js']
                    .map(f => path.join(targetPath, f))
                    .find(p => fs.existsSync(p));
                  if (!fallback) {
                    throw new Error("Cannot determine how to run locally. Define 'dev' or 'start' script in package.json or provide an index.js/app.js/server.js entry.");
                  }
                  args = [fallback];
                }
              } catch (e: any) {
                throw new Error(`Invalid package.json: ${e.message}`);
              }
            } else {
              // No package.json, try Node entry files
              command = process.execPath; // node
              const fallback = ['index.js', 'app.js', 'server.js']
                .map(f => path.join(targetPath, f))
                .find(p => fs.existsSync(p));
              if (!fallback) {
                throw new Error("package.json not found and no runnable entry (index.js/app.js/server.js). Cannot run locally.");
              }
              args = [fallback];
            }

            const runPort = input.runOptions?.port ?? 3000;
            const extraEnv = input.runOptions?.envParams ?? {};
            const child = spawn(command, args, {
              cwd: targetPath,
              env: { ...process.env, PORT: String(runPort), ...extraEnv },
              stdio: 'ignore',
              detached: true
            });

            child.unref();
            if (typeof child.pid !== 'number') {
              throw new Error('Failed to start local process: PID is undefined.');
            }
            runningProcesses.set(input.serverName, child.pid);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: true,
                    data: {
                      serviceName: input.serverName,
                      status: 'running',
                      pid: child.pid,
                      port: runPort,
                      command: [command, ...args].join(' '),
                      cwd: targetPath
                    },
                    message: `Started local run for service '${input.serverName}' on port ${runPort} (pid=${child.pid})`
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
