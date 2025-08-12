import { z } from "zod";
import { getCloudBaseManager } from '../cloudbase-manager.js'
import { ExtendedMcpServer } from '../server.js';
import { conditionalRegisterTool } from '../utils/cloud-mode.js';

export function registerStorageTools(server: ExtendedMcpServer) {
  // 获取 cloudBaseOptions，如果没有则为 undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // 创建闭包函数来获取 CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });
  
  // uploadFile - 上传文件到云存储 (cloud-incompatible)
  conditionalRegisterTool(
    server,
    "uploadFile",
    {
      title: "上传文件到云存储",
      description: "上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件）",
      inputSchema: {
        localPath: z.string().describe("本地文件路径，建议传入绝对路径，例如 /tmp/files/data.txt"),
        cloudPath: z.string().describe("云端文件路径，例如 files/data.txt")
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        category: "storage"
      }
    },
    async ({ localPath, cloudPath }: { localPath: string; cloudPath: string }) => {
      const cloudbase = await getManager()
      // 上传文件
      await cloudbase.storage.uploadFile({
        localPath,
        cloudPath,
        onProgress: (progressData: any) => {
          console.log("Upload progress:", progressData);
        }
      });

      // 获取文件临时下载地址
      const fileUrls = await cloudbase.storage.getTemporaryUrl([{
        cloudPath: cloudPath,
        maxAge: 3600 // 临时链接有效期1小时
      }]);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "文件上传成功",
              cloudPath: cloudPath,
              temporaryUrl: fileUrls[0]?.url || "",
              expireTime: "1小时"
            }, null, 2)
          }
        ]
      };
    }
  );
} 