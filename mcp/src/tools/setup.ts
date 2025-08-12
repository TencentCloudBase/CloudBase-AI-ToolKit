import { z } from "zod";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as https from "https";
import * as http from "http";
import { execSync } from "child_process";
import AdmZip from "adm-zip";
import { ExtendedMcpServer } from '../server.js';
import { conditionalRegisterTool } from '../utils/cloud-mode.js';

// 构建时注入的版本号
// @ts-ignore
declare const __MCP_VERSION__: string;

// CloudBase 模板配置
const TEMPLATES = {
  "react": {
    description: "React + CloudBase 全栈应用模板",
    url: "https://static.cloudbase.net/cloudbase-examples/web-cloudbase-react-template.zip"
  },
  "vue": {
    description: "Vue + CloudBase 全栈应用模板",
    url: "https://static.cloudbase.net/cloudbase-examples/web-cloudbase-vue-template.zip"
  },
  "miniprogram": {
    description: "微信小程序 + 云开发模板", 
    url: "https://static.cloudbase.net/cloudbase-examples/miniprogram-cloudbase-miniprogram-template.zip"
  },
  "uniapp": {
    description: "UniApp + CloudBase 跨端应用模板",
    url: "https://static.cloudbase.net/cloudbase-examples/universal-cloudbase-uniapp-template.zip"
  },
  "rules": {
    description: "AI编辑器配置模板（包含所有主流编辑器配置）",
    url: "https://static.cloudbase.net/cloudbase-examples/web-cloudbase-project.zip"
  }
};

// IDE类型枚举
const IDE_TYPES = [
  "all",           // 下载所有IDE配置（默认）
  "cursor",        // Cursor AI编辑器
  "windsurf",      // WindSurf AI编辑器
  "codebuddy",     // CodeBuddy AI编辑器
  "claude-code",   // Claude Code AI编辑器
  "cline",         // Cline AI编辑器
  "gemini-cli",    // Gemini CLI
  "opencode",      // OpenCode AI编辑器
  "qwen-code",     // 通义灵码
  "baidu-comate",  // 百度Comate
  "openai-codex-cli", // OpenAI Codex CLI
  "augment-code",  // Augment Code
  "github-copilot", // GitHub Copilot
  "roocode",       // RooCode AI编辑器
  "tongyi-lingma", // 通义灵码
  "trae",          // Trae AI编辑器
  "vscode"         // Visual Studio Code
] as const;

// IDE映射关系表
interface IDEMapping {
  ide: string;
  description: string;
  configFiles: string[];
  directories?: string[];
}

// IDE到文件的映射关系
const IDE_FILE_MAPPINGS: Record<string, string[]> = {
  "cursor": [
    ".cursor/rules/cloudbase-rules.mdc",
    ".cursor/mcp.json"
  ],
  "windsurf": [
    ".windsurf/rules/cloudbase-rules.md"
  ],
  "codebuddy": [
    ".rules/cloudbase-rules.md"
  ],
  "claude-code": [
    "CLAUDE.md",
    ".mcp.json"
  ],
  "cline": [
    ".clinerules/cloudbase-rules.mdc"
  ],
  "gemini-cli": [
    ".gemini/GEMINI.md",
    ".gemini/settings.json"
  ],
  "opencode": [
    ".opencode.json"
  ],
  "qwen-code": [
    ".qwen/QWEN.md",
    ".qwen/settings.json"
  ],
  "baidu-comate": [
    ".comate/rules/cloudbase-rules.mdr",
    ".comate/rules/cloudbaase-rules.mdr",
    ".comate/mcp.json"
  ],
  "openai-codex-cli": [
    ".codex/config.toml",
    "AGENTS.md",
  ],
  "augment-code": [
    ".augment-guidelines"
  ],
  "github-copilot": [
    ".github/copilot-instructions.md"
  ],
  "roocode": [
    ".roo/rules/cloudbaase-rules.md",
    ".roo/mcp.json"
  ],
  "tongyi-lingma": [
    ".lingma/rules/cloudbaase-rules.md"
  ],
  "trae": [
    ".trae/rules/cloudbase-rules.md"
  ],
  "vscode": [
    ".vscode/mcp.json",
    ".vscode/settings.json"
  ]
};

// 所有IDE配置文件的完整列表 - 通过IDE_FILE_MAPPINGS计算得出
const ALL_IDE_FILES = Array.from(new Set(
  Object.values(IDE_FILE_MAPPINGS).flat()
));

// 为"all"选项添加映射
IDE_FILE_MAPPINGS["all"] = ALL_IDE_FILES;

// IDE描述映射
const IDE_DESCRIPTIONS: Record<string, string> = {
  "all": "所有IDE配置",
  "cursor": "Cursor AI编辑器",
  "windsurf": "WindSurf AI编辑器",
  "codebuddy": "CodeBuddy AI编辑器",
  "claude-code": "Claude Code AI编辑器",
  "cline": "Cline AI编辑器",
  "gemini-cli": "Gemini CLI",
  "opencode": "OpenCode AI编辑器",
  "qwen-code": "通义灵码",
  "baidu-comate": "百度Comate",
  "openai-codex-cli": "OpenAI Codex CLI",
  "augment-code": "Augment Code",
  "github-copilot": "GitHub Copilot",
  "roocode": "RooCode AI编辑器",
  "tongyi-lingma": "通义灵码",
  "trae": "Trae AI编辑器",
  "vscode": "Visual Studio Code"
};

// 下载文件到临时目录
async function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
        file.on('error', reject);
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        // 处理重定向
        if (res.headers.location) {
          downloadFile(res.headers.location, filePath).then(resolve).catch(reject);
        } else {
          reject(new Error('重定向但没有location header'));
        }
      } else {
        reject(new Error(`下载失败，状态码: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// 解压ZIP文件
async function extractZip(zipPath: string, extractPath: string): Promise<void> {
  try {
    // 创建解压目录
    await fsPromises.mkdir(extractPath, { recursive: true });

    // 使用 adm-zip 库进行解压
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

  } catch (error) {
    throw new Error(`解压失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 获取目录下所有文件的相对路径列表
async function getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  
  return files;
}

// 复制文件，不覆盖已存在的文件
async function copyFileIfNotExists(src: string, dest: string): Promise<{ copied: boolean; reason?: string }> {
  try {
    // 检查目标文件是否存在
    if (fs.existsSync(dest)) {
      return { copied: false, reason: '文件已存在' };
    }
    
    // 创建目标目录
    await fsPromises.mkdir(path.dirname(dest), { recursive: true });
    
    // 复制文件
    await fsPromises.copyFile(src, dest);
    return { copied: true };
  } catch (error) {
    return { copied: false, reason: `复制失败: ${error instanceof Error ? error.message : '未知错误'}` };
  }
}

// 复制文件，支持覆盖模式
// 判断是否应该跳过 README.md 文件
function shouldSkipReadme(template: string, destPath: string, overwrite: boolean): boolean {
  const isReadme = path.basename(destPath).toLowerCase() === 'readme.md';
  const isRulesTemplate = template === 'rules';
  const exists = fs.existsSync(destPath);
  
  return isReadme && isRulesTemplate && exists && !overwrite;
}

async function copyFile(src: string, dest: string, overwrite: boolean = false, template?: string): Promise<{ copied: boolean; reason?: string; action?: string }> {
  try {
    const destExists = fs.existsSync(dest);
    
    // 检查是否需要跳过 README.md 文件（仅对 rules 模板）
    if (template && shouldSkipReadme(template, dest, overwrite)) {
      return { copied: false, reason: 'README.md 文件已存在，已保护', action: 'protected' };
    }
    
    // 如果目标文件存在且不允许覆盖
    if (destExists && !overwrite) {
      return { copied: false, reason: '文件已存在', action: 'skipped' };
    }
    
    // 创建目标目录
    await fsPromises.mkdir(path.dirname(dest), { recursive: true });
    
    // 复制文件
    await fsPromises.copyFile(src, dest);
    return { 
      copied: true, 
      action: destExists ? 'overwritten' : 'created'
    };
  } catch (error) {
    return { copied: false, reason: `复制失败: ${error instanceof Error ? error.message : '未知错误'}` };
  }
}

// IDE验证函数
function validateIDE(ide: string): { valid: boolean; error?: string; supportedIDEs?: string[] } {
  if (ide === "all") {
    return { valid: true };
  }
  
  const supportedIDEs = IDE_TYPES.filter(type => type !== "all");
  const isValid = supportedIDEs.includes(ide as any);
  
  if (!isValid) {
    return { 
      valid: false, 
      error: `不支持的IDE类型: ${ide}`,
      supportedIDEs: supportedIDEs as string[]
    };
  }
  
  return { valid: true };
}

// 文件过滤函数
function filterFilesByIDE(files: string[], ide: string): string[] {
  if (ide === "all") {
    return files; // 返回所有文件
  }
  
  const ideFiles = IDE_FILE_MAPPINGS[ide];
  if (!ideFiles) {
    return files; // 如果找不到映射，返回所有文件
  }
  
  // 计算需要排除的IDE文件（除了当前IDE需要的文件）
  const filesToExclude = ALL_IDE_FILES.filter(file => !ideFiles.includes(file));
  
  // 排除不需要的IDE配置文件，保留其他所有文件
  return files.filter(file => !filesToExclude.includes(file));
}

export function registerSetupTools(server: ExtendedMcpServer) {
  // downloadTemplate - 下载项目模板 (cloud-incompatible)
  conditionalRegisterTool(
    server,
    "downloadTemplate",
    {
      title: "下载项目模板",
      description: `自动下载并部署CloudBase项目模板。\n\n支持的模板:\n- react: React + CloudBase 全栈应用模板\n- vue: Vue + CloudBase 全栈应用模板\n- miniprogram: 微信小程序 + 云开发模板  \n- uniapp: UniApp + CloudBase 跨端应用模板\n- rules: 只包含AI编辑器配置文件（包含Cursor、WindSurf、CodeBuddy等所有主流编辑器配置），适合在已有项目中补充AI编辑器配置\n\n支持的IDE类型:\n- all: 下载所有IDE配置（默认）\n- cursor: Cursor AI编辑器\n- windsurf: WindSurf AI编辑器\n- codebuddy: CodeBuddy AI编辑器\n- claude-code: Claude Code AI编辑器\n- cline: Cline AI编辑器\n- gemini-cli: Gemini CLI\n- opencode: OpenCode AI编辑器\n- qwen-code: 通义灵码\n- baidu-comate: 百度Comate\n- openai-codex-cli: OpenAI Codex CLI\n- augment-code: Augment Code\n- github-copilot: GitHub Copilot\n- roocode: RooCode AI编辑器\n- tongyi-lingma: 通义灵码\n- trae: Trae AI编辑器\n- vscode: Visual Studio Code\n\n特别说明：\n- rules 模板会自动包含当前 mcp 版本号信息（版本号：${typeof __MCP_VERSION__ !== 'undefined' ? __MCP_VERSION__ : 'unknown'}），便于后续维护和版本追踪\n- 下载 rules 模板时，如果项目中已存在 README.md 文件，系统会自动保护该文件不被覆盖（除非设置 overwrite=true）`,
      inputSchema: {
        template: z.enum(["react", "vue", "miniprogram", "uniapp", "rules"]).describe("要下载的模板类型"),
        ide: z.enum(IDE_TYPES).optional().default("all").describe("指定要下载的IDE类型，默认为all（下载所有IDE配置）"),
        overwrite: z.boolean().optional().describe("是否覆盖已存在的文件，默认为false（不覆盖）")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "setup"
      }
    },
    async ({ template, ide = "all", overwrite = false }: { template: "react" | "vue" | "miniprogram" | "uniapp" | "rules"; ide?: string; overwrite?: boolean }) => {
      try {
        // 验证IDE类型
        const ideValidation = validateIDE(ide);
        if (!ideValidation.valid) {
          const supportedIDEs = ideValidation.supportedIDEs?.join(', ') || '';
          return {
            content: [
              {
                type: "text",
                text: `❌ ${ideValidation.error}\n\n支持的IDE类型: ${supportedIDEs}`
              }
            ]
          };
        }

        const templateConfig = TEMPLATES[template];
        if (!templateConfig) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 不支持的模板类型: ${template}`
              }
            ]
          };
        }

        // 创建临时目录
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloudbase-template-'));
        const zipPath = path.join(tempDir, 'template.zip');
        const extractDir = path.join(tempDir, 'extracted');

        // 下载和解压
        await downloadFile(templateConfig.url, zipPath);
        await extractZip(zipPath, extractDir);
        const extractedFiles = await getAllFiles(extractDir);

        // 根据IDE类型过滤文件
        const filteredFiles = filterFilesByIDE(extractedFiles, ide);

        // 检查是否需要复制到项目目录
        const workspaceFolder = process.env.WORKSPACE_FOLDER_PATHS;
        let finalFiles: string[] = [];
        let createdCount = 0;
        let overwrittenCount = 0;
        let skippedCount = 0;
        const results: string[] = [];

        if (workspaceFolder) {
          let protectedCount = 0;
          for (const relativePath of filteredFiles) {
            const srcPath = path.join(extractDir, relativePath);
            const destPath = path.join(workspaceFolder, relativePath);
            
            const copyResult = await copyFile(srcPath, destPath, overwrite, template);
            
            if (copyResult.copied) {
              if (copyResult.action === 'overwritten') {
                overwrittenCount++;
              } else {
                createdCount++;
              }
              finalFiles.push(destPath);
            } else {
              if (copyResult.action === 'protected') {
                protectedCount++;
              } else {
                skippedCount++;
              }
              finalFiles.push(srcPath);
            }
          }

          // 添加IDE过滤信息
          const ideInfo = IDE_DESCRIPTIONS[ide] || ide;
          results.push(`✅ ${templateConfig.description} (${ideInfo}) 同步完成`);
          results.push(`📁 临时目录: ${extractDir}`);
          results.push(`🔍 文件过滤: ${extractedFiles.length} → ${filteredFiles.length} 个文件`);
          
          const stats: string[] = [];
          if (createdCount > 0) stats.push(`新建 ${createdCount} 个文件`);
          if (overwrittenCount > 0) stats.push(`覆盖 ${overwrittenCount} 个文件`);
          if (protectedCount > 0) stats.push(`保护 ${protectedCount} 个文件（README.md）`);
          if (skippedCount > 0) stats.push(`跳过 ${skippedCount} 个已存在文件`);
          
          if (stats.length > 0) {
            results.push(`📊 ${stats.join('，')}`);
          }
          
          if (overwrite || overwrittenCount > 0 || skippedCount > 0) {
            results.push(`🔄 覆盖模式: ${overwrite ? '启用' : '禁用'}`);
          }
        } else {
          finalFiles = filteredFiles.map(relativePath => path.join(extractDir, relativePath));
          const ideInfo = IDE_DESCRIPTIONS[ide] || ide;
          results.push(`✅ ${templateConfig.description} (${ideInfo}) 下载完成`);
          results.push(`📁 保存在临时目录: ${extractDir}`);
          results.push(`🔍 文件过滤: ${extractedFiles.length} → ${filteredFiles.length} 个文件`);
          results.push('💡 如需将模板（包括隐藏文件）复制到项目目录，请确保复制时包含所有隐藏文件。');
        }

        // 文件路径列表
        results.push('');
        results.push('📋 文件列表:');
        finalFiles.forEach(filePath => {
          results.push(`${filePath}`);
        });

        return {
          content: [
            {
              type: "text",
              text: results.join('\n')
            }
          ]
        };

      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ 下载模板失败: ${error instanceof Error ? error.message : '未知错误'}`
            }
          ]
        };
      }
    }
  );
}