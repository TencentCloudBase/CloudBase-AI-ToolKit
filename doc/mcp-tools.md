# MCP 工具

CloudBase AI ToolKit 提供了完整的 MCP 工具集，支持云开发的各种操作。

## 🛠️ 云开发 MCP 工具一览

| 工具名称 | 功能简介 |
|----------|----------|
| login | 登录并自动配置云开发环境 |
| logout | 登出当前云开发账户 |
| downloadTemplate | 下载CloudBase项目模板（React、小程序、AI编辑器配置等） |
| listEnvs | 获取所有云开发环境信息 |
| getEnvAuthDomains | 获取云开发环境的合法域名列表 |
| createEnvDomain | 为云开发环境添加安全域名 |
| deleteEnvDomain | 删除云开发环境的指定安全域名 |
| getEnvInfo | 获取当前云开发环境信息 |
| updateEnvInfo | 修改云开发环境别名 |
| createCollection | 创建一个新的云开发数据库集合 |
| checkCollectionExists | 检查云开发数据库集合是否存在 |
| updateCollection | 更新云开发数据库集合配置（创建或删除索引） |
| describeCollection | 获取云开发数据库集合的详细信息 |
| listCollections | 获取云开发数据库集合列表 |
| checkIndexExists | 检查索引是否存在 |
| distribution | 查询数据库中集合的数据分布情况 |
| insertDocuments | 向集合中插入文档 |
| queryDocuments | 查询集合中的文档 |
| updateDocuments | 更新集合中的文档 |
| deleteDocuments | 删除集合中的文档 |
| uploadFiles | 上传文件到静态网站托管 |
| listFiles | 获取静态网站托管的文件列表 |
| deleteFiles | 删除静态网站托管的文件或文件夹 |
| findFiles | 搜索静态网站托管的文件 |
| domainManagement | 统一的域名管理工具，支持绑定、解绑、查询和修改域名配置 |
| getWebsiteConfig | 获取静态网站配置 |
| getFunctionList | 获取云函数列表 |
| createFunction | 创建云函数 |
| updateFunctionCode | 更新云函数代码 |
| updateFunctionConfig | 更新云函数配置 |
| getFunctionDetail | 获取云函数详情 |
| invokeFunction | 调用云函数 |
| getFunctionLogs | 获取云函数日志 |
| createFunctionTriggers | 创建云函数触发器 |
| deleteFunctionTrigger | 删除云函数触发器 |
| downloadRemoteFile | 下载远程文件到本地临时文件 |
| uploadFile | 上传文件到云存储（适合存储业务数据文件） |
| searchKnowledgeBase | 智能检索云开发知识库（支持云开发与云函数），通过向量搜索快速获取专业文档与答案。|
| interactiveDialog | 统一的交互式对话工具，支持需求澄清和任务确认 |

## 使用方式

这些工具会在你与 AI 对话时自动调用，无需手动执行。例如：

- 当你说"登录云开发"时，AI 会调用 `login` 工具
- 当你说"查询环境信息"时，AI 会调用 `getEnvInfo` 工具
- 当你说"部署应用"时，AI 会调用相关的部署工具

## 配置说明

MCP 工具通过以下配置添加到你的 AI IDE 中：

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["-y", "@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
``` 