import { z } from "zod";
import * as fsPromises from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";
import { URL } from "url";
import * as net from "net";
import { conditionalRegisterTool } from '../utils/cloud-mode.js';
import * as dns from "dns";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';

// 常量定义
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_PROTOCOLS = ["http:", "https:"];
const ALLOWED_CONTENT_TYPES = [
  "text/",
  "image/",
  "application/json",
  "application/xml",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed"
];

// 检查是否为内网 IP
function isPrivateIP(ip: string): boolean {
  // 如果不是有效的 IP 地址，返回 true（保守处理）
  if (!net.isIP(ip)) {
    return true;
  }

  // 检查特殊地址
  if (ip === '127.0.0.1' || 
      ip === 'localhost' ||
      ip === '::1' || // IPv6 本地回环
      ip.startsWith('169.254.') || // 链路本地地址
      ip.startsWith('0.')) { // 特殊用途地址
    return true;
  }

  // 转换 IP 地址为长整数进行范围检查
  const ipv4Parts = ip.split('.').map(part => parseInt(part, 10));
  if (ipv4Parts.length === 4) {
    const ipNum = (ipv4Parts[0] << 24) + (ipv4Parts[1] << 16) + (ipv4Parts[2] << 8) + ipv4Parts[3];
    
    // 检查私有 IP 范围
    // 10.0.0.0 - 10.255.255.255
    if (ipNum >= 167772160 && ipNum <= 184549375) return true;
    
    // 172.16.0.0 - 172.31.255.255
    if (ipNum >= 2886729728 && ipNum <= 2887778303) return true;
    
    // 192.168.0.0 - 192.168.255.255
    if (ipNum >= 3232235520 && ipNum <= 3232301055) return true;
  }
  
  // 检查 IPv6 私有地址
  if (net.isIPv6(ip)) {
    const normalizedIP = ip.toLowerCase();
    if (normalizedIP.startsWith('fc00:') || // 唯一本地地址
        normalizedIP.startsWith('fe80:') || // 链路本地地址
        normalizedIP.startsWith('fec0:') || // 站点本地地址
        normalizedIP.startsWith('::1')) { // 本地回环
      return true;
    }
  }

  return false;
}

// 检查域名是否解析到内网 IP
async function doesDomainResolveToPrivateIP(hostname: string): Promise<boolean> {
  try {
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    return addresses.some(ip => isPrivateIP(ip));
  } catch (error) {
    // 如果解析失败，为安全起见返回 true
    return true;
  }
}

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

// 从 URL 或 Content-Disposition 获取文件扩展名
function getFileExtension(url: string, contentType: string, contentDisposition?: string): string {
  let extension = "";
  
  // 从 URL 获取扩展名
  const urlPath = new URL(url).pathname;
  const urlExt = path.extname(urlPath);
  if (urlExt) {
    extension = urlExt;
  }
  
  // 从 Content-Disposition 获取扩展名
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename=["']?([^"']+)["']?/);
    if (filenameMatch) {
      const dispositionExt = path.extname(filenameMatch[1]);
      if (dispositionExt) {
        extension = dispositionExt;
      }
    }
  }
  
  // 从 Content-Type 获取扩展名
  if (!extension && contentType) {
    const mimeToExt: { [key: string]: string } = {
      "text/plain": ".txt",
      "text/html": ".html",
      "text/css": ".css",
      "text/javascript": ".js",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/json": ".json",
      "application/xml": ".xml",
      "application/pdf": ".pdf",
      "application/zip": ".zip",
      "application/x-zip-compressed": ".zip"
    };
    extension = mimeToExt[contentType] || "";
  }
  
  return extension;
}

// 验证 URL 和内容类型是否安全
async function isUrlAndContentTypeSafe(url: string, contentType: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);
    
    // 检查协议
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }
    
    // 检查主机名是否为 IP 地址
    const hostname = parsedUrl.hostname;
    if (net.isIP(hostname) && isPrivateIP(hostname)) {
      return false;
    }
    
    // 如果是域名，检查它是否解析到内网 IP
    if (!net.isIP(hostname) && await doesDomainResolveToPrivateIP(hostname)) {
      return false;
    }
    
    // 检查内容类型
    return ALLOWED_CONTENT_TYPES.some(allowedType => contentType.startsWith(allowedType));
  } catch {
    return false;
  }
}

// 下载文件
function downloadFile(url: string): Promise<{
  filePath: string;
  contentType: string;
  fileSize: number;
}> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, async (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP Error: ${res.statusCode}`));
        return;
      }
      
      const contentType = res.headers['content-type'] || '';
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      const contentDisposition = res.headers['content-disposition'];
      
      // 安全检查
      if (!await isUrlAndContentTypeSafe(url, contentType)) {
        reject(new Error('不安全的 URL 或内容类型，或者目标为内网地址'));
        return;
      }
      
      // 文件大小检查
      if (contentLength > MAX_FILE_SIZE) {
        reject(new Error(`文件大小 ${contentLength} 字节超过 ${MAX_FILE_SIZE} 字节限制`));
        return;
      }
      
      // 生成临时文件路径
      const extension = getFileExtension(url, contentType, contentDisposition);
      const fileName = generateRandomFileName(extension);
      const filePath = getSafeTempFilePath(fileName);
      
      // 创建写入流
      const fileStream = fs.createWriteStream(filePath);
      let downloadedSize = 0;
      
      res.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (downloadedSize > MAX_FILE_SIZE) {
          fileStream.destroy();
          fsPromises.unlink(filePath).catch(() => {});
          reject(new Error(`文件大小超过 ${MAX_FILE_SIZE} 字节限制`));
        }
      });
      
      res.pipe(fileStream);
      
      fileStream.on('finish', () => {
        resolve({
          filePath,
          contentType,
          fileSize: downloadedSize
        });
      });
      
      fileStream.on('error', (error: NodeJS.ErrnoException) => {
        fsPromises.unlink(filePath).catch(() => {});
        reject(error);
      });
    }).on('error', (error: NodeJS.ErrnoException) => {
      reject(error);
    });
  });
}

export function registerDownloadTools(server: ExtendedMcpServer) {
  // downloadRemoteFile - 下载远程文件 (cloud-incompatible)
  conditionalRegisterTool(
    server,
    "downloadRemoteFile",
    {
      title: "下载远程文件",
      description: "下载远程文件到本地临时文件，返回一个系统的绝对路径",
      inputSchema: {
        url: z.string().describe("远程文件的 URL 地址")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "download"
      }
    },
    async ({ url }: { url: string }) => {
      try {
        const result = await downloadFile(url);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                filePath: result.filePath,
                contentType: result.contentType,
                fileSize: result.fileSize,
                message: "文件下载成功"
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
                message: "文件下载失败"
              }, null, 2)
            }
          ]
        };
      }
    }
  );
} 