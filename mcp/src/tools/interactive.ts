import { z } from "zod";
import { getLoginState } from '../auth.js';
import { envManager, getCloudBaseManager } from '../cloudbase-manager.js';
import { getInteractiveServer } from "../interactive-server.js";
import { ExtendedMcpServer } from '../server.js';
import { debug } from '../utils/logger.js';


export function registerInteractiveTools(server: ExtendedMcpServer) {
  // 统一的交互式对话工具 (cloud-incompatible)
  server.registerTool(
    "interactiveDialog",
    {
      title: "交互式对话",
      description: "统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm",
      inputSchema: {
        type: z.enum(['clarify', 'confirm']).describe("交互类型: clarify=需求澄清, confirm=任务确认"),  
        message: z.string().optional().describe("对话消息内容"),
        options: z.array(z.string()).optional().describe("可选的预设选项"),
        forceUpdate: z.boolean().optional().describe("是否强制更新环境ID配置"),
        risks: z.array(z.string()).optional().describe("操作风险提示")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
        category: "interactive"
      }
    },
    async ({ type, message, options, forceUpdate = false, risks }: {
      type: 'clarify' | 'confirm';
      message?: string;
      options?: string[];
      forceUpdate?: boolean;
      risks?: string[];
    }) => {
      try {
        switch (type) {
          case 'clarify': {
            if (!message) {
              throw new Error("需求澄清必须提供message参数");
            }

            const interactiveServer = getInteractiveServer(server);
            const result = await interactiveServer.clarifyRequest(message, options);

            if (result.cancelled) {
              return { content: [{ type: "text", text: "用户取消了需求澄清" }] };
            }

            return {
              content: [{
                type: "text",
                text: `📝 用户澄清反馈:\n${result.data}`
              }]
            };
          }

          case 'confirm': {
            if (!message) {
              throw new Error("任务确认必须提供message参数");
            }

            let dialogMessage = `🎯 即将执行任务:\n${message}`;
            
            if (risks && risks.length > 0) {
              dialogMessage += `\n\n⚠️ 风险提示:\n${risks.map(risk => `• ${risk}`).join('\n')}`;
            }
            
            dialogMessage += `\n\n是否继续执行此任务？`;
            
            const dialogOptions = options || ["确认执行", "取消操作", "需要修改任务"];
            
            const interactiveServer = getInteractiveServer(server);
            const result = await interactiveServer.clarifyRequest(dialogMessage, dialogOptions);

            if (result.cancelled || (result.data && result.data.includes && result.data.includes('取消'))) {
              return { content: [{ type: "text", text: "❌ 用户取消了任务执行" }] };
            }

            return {
              content: [{
                type: "text",
                text: `✅ 用户确认: ${result.data}`
              }]
            };
          }

          default:
            throw new Error(`不支持的交互类型: ${type}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `交互对话出错: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}

// 封装了获取环境、提示选择、保存配置的核心逻辑
export async function _promptAndSetEnvironmentId(autoSelectSingle: boolean, server?: any): Promise<{ selectedEnvId: string | null; cancelled: boolean; error?: string; noEnvs?: boolean }> {
  // 1. 确保用户已登录
  const loginState = await getLoginState();
  debug('loginState',loginState)
  if (!loginState) {
    debug('请先登录云开发账户')
    return { selectedEnvId: null, cancelled: false, error: "请先登录云开发账户" };
  }

  // 2. 获取可用环境列表（使用过滤参数）
  // Fix: Pass cloudBaseOptions to ensure correct environment context
  const serverCloudBaseOptions = server?.cloudBaseOptions;
  const cloudbase = await getCloudBaseManager({ 
    requireEnvId: false, 
    cloudBaseOptions: serverCloudBaseOptions 
  });
  let envResult;
  try {
    // Use commonService to call DescribeEnvs with filter parameters
    // Filter parameters match the reference conditions provided by user
    envResult = await cloudbase.commonService('tcb').call({
      Action: 'DescribeEnvs',
      Param: {
        EnvTypes: ['weda', 'baas'],  // Include weda and baas (normal) environments
        IsVisible: false,             // Filter out invisible environments
        Channels: ['dcloud', 'iotenable', 'tem', 'scene_module']  // Filter special channels
      }
    });
    // Transform response format to match original listEnvs() format
    if (envResult && envResult.EnvList) {
      envResult = { EnvList: envResult.EnvList };
    } else if (envResult && envResult.Data && envResult.Data.EnvList) {
      envResult = { EnvList: envResult.Data.EnvList };
    } else {
      // Fallback to original method if format is unexpected
      debug('Unexpected response format, falling back to listEnvs()');
      envResult = await cloudbase.env.listEnvs();
    }
  } catch (error) {
    debug('获取环境ID时出错，尝试降级到 listEnvs():', error);
    // Fallback to original method on error
    try {
      envResult = await cloudbase.env.listEnvs();
    } catch (fallbackError) {
      debug('降级到 listEnvs() 也失败:', fallbackError);
    }
  }
  
  debug('envResult', envResult);

  const { EnvList } = envResult || {};
  let selectedEnvId: string | null = null;

  // 3. 根据情况选择或提示用户选择
  if (autoSelectSingle && EnvList && EnvList.length === 1 && EnvList[0].EnvId) {
    selectedEnvId = EnvList[0].EnvId;
  } else {
    const interactiveServer = getInteractiveServer(server);
    const result = await interactiveServer.collectEnvId(EnvList || []);

    if (result.cancelled) {
      return { selectedEnvId: null, cancelled: true };
    }
    selectedEnvId = result.data;
  }

  // 4. 更新环境ID缓存
  if (selectedEnvId) {
    // Update memory cache and process.env to prevent environment mismatch
    await envManager.setEnvId(selectedEnvId);
    debug('环境ID已更新缓存:', selectedEnvId);
  }

  return { selectedEnvId, cancelled: false };
  
}

// 自动设置环境ID（无需MCP工具调用）
export async function autoSetupEnvironmentId(): Promise<string | null> {
  try {
    const { selectedEnvId, cancelled, error, noEnvs } = await _promptAndSetEnvironmentId(true, undefined);

    if (error || noEnvs || cancelled) {
      debug('Auto setup environment ID interrupted or failed silently.', { error, noEnvs, cancelled });
      return null;
    }
    
    debug('Auto setup environment ID successful.', { selectedEnvId });
    return selectedEnvId;

  } catch (error) {
    console.error('自动配置环境ID时出错:', error);
    return null;
  }
} 