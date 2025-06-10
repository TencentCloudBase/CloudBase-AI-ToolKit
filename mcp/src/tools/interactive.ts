import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getInteractiveServer } from "../interactive-server.js";
import { getCloudBaseManager } from '../cloudbase-manager.js';
import { getLoginState } from '../auth.js';
import { debug, info, warn, error } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export function registerInteractiveTools(server: McpServer) {
  // 统一的交互式对话工具
  server.tool(
    "interactiveDialog",
    "统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm",
    {
      type: z.enum(['clarify', 'confirm']).describe("交互类型: clarify=需求澄清, confirm=任务确认"),  
      message: z.string().optional().describe("对话消息内容"),
      options: z.array(z.string()).optional().describe("可选的预设选项"),
      forceUpdate: z.boolean().optional().describe("是否强制更新环境ID配置"),
      risks: z.array(z.string()).optional().describe("操作风险提示")
    },
    async ({ type, message, options, forceUpdate = false, risks }) => {
      try {
        switch (type) {
          case 'clarify': {
            if (!message) {
              throw new Error("需求澄清必须提供message参数");
            }

            const interactiveServer = getInteractiveServer();
            const result = await interactiveServer.clarifyRequest(message, options);

            if (result.cancelled) {
              return { content: [{ type: "text", text: "用户取消了需求澄清" }] };
            }

            return {
              content: [{
                type: "text",
                text: `📝 用户澄清反馈:\n${result.data.response}`
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
            
            const interactiveServer = getInteractiveServer();
            const result = await interactiveServer.clarifyRequest(dialogMessage, dialogOptions);

            if (result.cancelled || result.data.response.includes('取消')) {
              return { content: [{ type: "text", text: "❌ 用户取消了任务执行" }] };
            }

            return {
              content: [{
                type: "text",
                text: `✅ 用户确认: ${result.data.response}`
              }]
            };
          }
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
export async function _promptAndSetEnvironmentId(autoSelectSingle: boolean): Promise<{ selectedEnvId: string | null; cancelled: boolean; error?: string; noEnvs?: boolean }> {
  // 1. 确保用户已登录

  const loginState = await getLoginState();
  debug('loginState',loginState)
  if (!loginState) {
    debug('请先登录云开发账户')
    return { selectedEnvId: null, cancelled: false, error: "请先登录云开发账户" };
  }

  // 2. 获取可用环境列表
  const cloudbase = await getCloudBaseManager({requireEnvId: false});
  const envResult = await cloudbase.env.listEnvs();
  debug('envResult', envResult);
  if (!envResult || !envResult.EnvList || envResult.EnvList.length === 0) {
    return { selectedEnvId: null, cancelled: false, noEnvs: true };
  }

  const { EnvList } = envResult;
  let selectedEnvId: string | null = null;

  // 3. 根据情况选择或提示用户选择
  if (autoSelectSingle && EnvList.length === 1 && EnvList[0].EnvId) {
    selectedEnvId = EnvList[0].EnvId;
  } else {
    const interactiveServer = getInteractiveServer();
    const result = await interactiveServer.collectEnvId(EnvList);

    if (result.cancelled) {
      return { selectedEnvId: null, cancelled: true };
    }
    selectedEnvId = result.data.envId;
  }

  // 4. 保存并设置环境ID
  if (selectedEnvId) {
    await saveEnvIdToUserConfig(selectedEnvId);
    process.env.CLOUDBASE_ENV_ID = selectedEnvId;
  }

  return { selectedEnvId, cancelled: false };
}

// 获取用户配置文件路径
function getUserConfigPath(): string {
  return path.join(os.homedir(), '.cloudbase-env-id');
}

// 保存环境ID到用户配置文件
async function saveEnvIdToUserConfig(envId: string): Promise<void> {
  const configPath = getUserConfigPath();
  
  try {
    const config = {
      envId,
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    // 环境ID已保存 - 静默操作避免干扰MCP返回值
    
  } catch (error) {
    console.error('保存环境ID配置失败:', error);
    throw error;
  }
}

// 从用户配置文件读取环境ID
async function loadEnvIdFromUserConfig(): Promise<string | null> {
  const configPath = getUserConfigPath();
  
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);
    const envId = config.envId || null;
    if (!envId) {
        warn(`Config file ${configPath} found, but 'envId' property is missing or empty.`);
    }
    return envId;
  } catch (err: any) {
    // 文件不存在是正常情况，不应告警。只在文件存在但有问题时告警。
    if (err.code !== 'ENOENT') {
        warn(`Failed to load envId from config file at ${configPath}. Error: ${err.message}`);
    } else {
        debug(`Env config file not found at ${configPath}, which is expected if not set.`);
    }
    return null;
  }
}

// 检查并设置环境ID
export async function ensureEnvId(): Promise<string | null> {
  // 优先使用进程环境变量
  if (process.env.CLOUDBASE_ENV_ID) {
    return process.env.CLOUDBASE_ENV_ID;
  }
  
  // 从用户配置文件读取
  const envId = await loadEnvIdFromUserConfig();
  if (envId) {
    // 设置到进程环境变量中
    process.env.CLOUDBASE_ENV_ID = envId;
    return envId;
  }
  
  return null;
}

// 清理用户环境ID配置
export async function clearUserEnvId(): Promise<void> {
  const configPath = getUserConfigPath();
  
  try {
    await fs.unlink(configPath);
    // 清理进程环境变量
    delete process.env.CLOUDBASE_ENV_ID;
    delete process.env.TENCENTCLOUD_SECRETID;
    delete process.env.TENCENTCLOUD_SECRETKEY;
    delete process.env.TENCENTCLOUD_SESSIONTOKEN;
    // 环境ID配置已清理 - 静默操作
  } catch (error) {
    // 文件不存在或删除失败，忽略错误
    // 环境ID配置文件不存在或已清理 - 静默操作
  }
}

// 自动设置环境ID（无需MCP工具调用）
export async function autoSetupEnvironmentId(): Promise<string | null> {
  try {
    const { selectedEnvId, cancelled, error, noEnvs } = await _promptAndSetEnvironmentId(true);

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