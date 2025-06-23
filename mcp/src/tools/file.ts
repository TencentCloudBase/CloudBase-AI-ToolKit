import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

// 常量定义
const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

// 生成随机文件名
function generateRandomFileName(extension = '') {
  const randomBytes = crypto.randomBytes(16);
  const fileName = randomBytes.toString('hex');
  return `${fileName}${extension}`;
}

// 获取安全的临时文件路径
function getSafeTempFilePath(fileName: string) {
  return path.join(os.tmpdir(), fileName);
}

// 检查 base64 字符串大小
function checkBase64Size(base64String: string): boolean {
  // 计算 base64 解码后的实际大小
  // base64 字符串长度 * 0.75 约等于实际二进制数据大小
  const actualSize = Math.ceil(base64String.length * 0.75);
  return actualSize <= MAX_FILE_SIZE;
}

// 检查文件路径是否在临时目录中
function isInTempDir(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const normalizedTempDir = path.normalize(os.tmpdir());
  return normalizedPath.startsWith(normalizedTempDir);
}

export function registerFileTools(server: ExtendedMcpServer) {
  // 创建文件
  server.tool(
    "createTempFile",
    "在云开发 MCP 服务的临时目录创建文件，支持文本内容或 base64 编码的二进制内容（最大 100KB）",
    {
      content: z.string().describe("文件内容，可以是普通文本或 base64 编码的二进制内容"),
      isBase64: z.boolean().default(false).describe("是否为 base64 编码的内容"),
      extension: z.string().optional().describe("文件扩展名，例如 .txt, .png 等")
    },
    async ({ content, isBase64 = false, extension = '' }) => {
      try {
        // 如果是 base64 内容，先检查大小
        if (isBase64) {
          if (!checkBase64Size(content)) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: "文件大小超过限制",
                    message: `文件大小超过 ${MAX_FILE_SIZE / 1024}KB 限制`
                  }, null, 2)
                }
              ]
            };
          }
        }

        const fileName = generateRandomFileName(extension);
        const filePath = getSafeTempFilePath(fileName);
        
        if (isBase64) {
          // 解码 base64 并写入二进制文件
          const buffer = Buffer.from(content, 'base64');
          await fs.writeFile(filePath, buffer);
        } else {
          // 写入文本文件
          await fs.writeFile(filePath, content, 'utf-8');
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                filePath,
                message: "文件创建成功",
                fileSize: isBase64 ? Math.ceil(content.length * 0.75) : Buffer.from(content).length
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文件创建失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );

  // 读取文件
  server.tool(
    "readTempFile",
    "读取临时目录中的文件，支持文本和二进制文件（二进制文件将以 base64 格式返回）",
    {
      filePath: z.string().describe("要读取的文件路径"),
      asBase64: z.boolean().default(false).describe("是否以 base64 格式返回内容（用于二进制文件）")
    },
    async ({ filePath, asBase64 = false }) => {
      try {
        // 安全检查：确保文件路径在临时目录中
        if (!isInTempDir(filePath)) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "安全限制",
                  message: "只能读取临时目录中的文件"
                }, null, 2)
              }
            ]
          };
        }

        // 检查文件是否存在
        try {
          await fs.access(filePath);
        } catch {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "文件不存在",
                  message: "指定的文件不存在"
                }, null, 2)
              }
            ]
          };
        }

        // 检查文件大小
        const stats = await fs.stat(filePath);
        if (stats.size > MAX_FILE_SIZE) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: "文件大小超过限制",
                  message: `文件大小 ${stats.size} 字节超过 ${MAX_FILE_SIZE} 字节限制`
                }, null, 2)
              }
            ]
          };
        }

        // 读取文件
        const buffer = await fs.readFile(filePath);
        
        let content: string;
        if (asBase64) {
          content = buffer.toString('base64');
        } else {
          content = buffer.toString('utf-8');
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                content,
                fileSize: buffer.length,
                encoding: asBase64 ? 'base64' : 'utf-8',
                message: "文件读取成功"
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: "文件读取失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );
} 