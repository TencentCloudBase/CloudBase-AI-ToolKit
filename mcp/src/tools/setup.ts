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
async function copyFile(src: string, dest: string, overwrite: boolean = false): Promise<{ copied: boolean; reason?: string; action?: string }> {
  try {
    const destExists = fs.existsSync(dest);
    
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

export function registerSetupTools(server: ExtendedMcpServer) {
  server.registerTool?.(
    "downloadTemplate",
    {
      title: "下载项目模板",
      description: `自动下载并部署CloudBase项目模板。

支持的模板:
- react: React + CloudBase 全栈应用模板
- vue: Vue + CloudBase 全栈应用模板
- miniprogram: 微信小程序 + 云开发模板  
- uniapp: UniApp + CloudBase 跨端应用模板
- rules: 只包含AI编辑器配置文件（包含Cursor、WindSurf、CodeBuddy等所有主流编辑器配置），适合在已有项目中补充AI编辑器配置

工具会自动下载模板到临时目录，解压后如果检测到WORKSPACE_FOLDER_PATHS环境变量，则复制到项目目录。`,
      inputSchema: {
        template: z.enum(["react", "vue", "miniprogram", "uniapp", "rules"]).describe("要下载的模板类型"),
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
    async ({ template, overwrite = false }: { template: "react" | "vue" | "miniprogram" | "uniapp" | "rules"; overwrite?: boolean }) => {
      try {
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

        // 检查是否需要复制到项目目录
        const workspaceFolder = process.env.WORKSPACE_FOLDER_PATHS;
        let finalFiles: string[] = [];
        let createdCount = 0;
        let overwrittenCount = 0;
        let skippedCount = 0;
        const results: string[] = [];

        if (workspaceFolder) {
          for (const relativePath of extractedFiles) {
            const srcPath = path.join(extractDir, relativePath);
            const destPath = path.join(workspaceFolder, relativePath);
            
            const copyResult = await copyFile(srcPath, destPath, overwrite);
            
            if (copyResult.copied) {
              if (copyResult.action === 'overwritten') {
                overwrittenCount++;
              } else {
                createdCount++;
              }
              finalFiles.push(destPath);
            } else {
              skippedCount++;
              finalFiles.push(srcPath);
            }
          }

          results.push(`✅ ${templateConfig.description} 同步完成`);
          results.push(`📁 临时目录: ${extractDir}`);
          
          const stats: string[] = [];
          if (createdCount > 0) stats.push(`新建 ${createdCount} 个文件`);
          if (overwrittenCount > 0) stats.push(`覆盖 ${overwrittenCount} 个文件`);
          if (skippedCount > 0) stats.push(`跳过 ${skippedCount} 个已存在文件`);
          
          if (stats.length > 0) {
            results.push(`📊 ${stats.join('，')}`);
          }
          
          if (overwrite || overwrittenCount > 0 || skippedCount > 0) {
            results.push(`🔄 覆盖模式: ${overwrite ? '启用' : '禁用'}`);
          }
        } else {
          finalFiles = extractedFiles.map(relativePath => path.join(extractDir, relativePath));
          results.push(`✅ ${templateConfig.description} 下载完成`);
          results.push(`📁 保存在临时目录: ${extractDir}`);
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