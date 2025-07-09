# MCP 工具

CloudBase AI ToolKit 提供了完整的 MCP 工具集，支持云开发的各种操作。目前共有 **36 个工具**，涵盖环境管理、数据库操作、云函数管理、静态托管等核心功能。

📋 **完整工具规格**: [查看 tools.json](https://cnb.cool/tencent/cloud/cloudbase/CloudBase-AI-ToolKit/-/git/raw/main/scripts/tools.json)

## 🔧 工具分类概览

| 分类 | 工具数量 | 主要功能 |
|------|----------|----------|
| 🌍 [环境管理](#环境管理) | 4 个 | 登录、环境信息查询、域名管理 |
| 🗄️ [数据库操作](#数据库操作) | 11 个 | 集合管理、文档 CRUD、索引操作 |
| ⚡ [云函数管理](#云函数管理) | 9 个 | 函数创建、更新、调用、日志 |
| 🌐 [静态托管](#静态托管) | 6 个 | 文件上传、管理、域名配置 |
| 📁 [文件操作](#文件操作) | 2 个 | 文件下载、云存储上传 |
| 🛠️ [工具支持](#工具支持) | 4 个 | 模板下载、知识库搜索、联网搜索、交互对话 |

---

## 🌍 环境管理

### 🔐 身份认证

#### `login`
**功能**: 登录云开发环境并选择要使用的环境
**参数**: 
- `forceUpdate` (boolean): 强制重新选择环境

#### `logout`
**功能**: 退出云开发环境
**参数**: 
- `confirm` (boolean): 确认操作

### 📊 环境信息

#### `envQuery`
**功能**: 合并工具 - 查询环境列表、当前环境信息和安全域名
**参数**: 
- `action` (string): list/info/domains

#### `updateEnvInfo`
**功能**: 更新云开发环境信息
**参数**: 
- `alias` (string): 环境别名

### 🌐 域名管理

#### `envDomainManagement`
**功能**: 合并工具 - 管理环境安全域名（添加/删除）
**参数**: 
- `action` (string): create/delete
- `domains` (array): 域名列表

---

## 🗄️ 数据库操作

### 📦 集合管理

#### `createCollection`
**功能**: 创建一个新的云开发数据库集合
**参数**: 
- `collectionName` (string): 集合名称

#### `collectionQuery`
**功能**: 合并工具 - 检查集合存在性、查看详情、获取列表
**参数**: 
- `action` (string): check/describe/list

#### `updateCollection`
**功能**: 更新集合配置（创建或删除索引）
**参数**: 
- `collectionName` (string): 集合名称
- `options` (object): 索引配置

#### `checkIndexExists`
**功能**: 检查索引是否存在
**参数**: 
- `collectionName` (string): 集合名称
- `indexName` (string): 索引名称

#### `distribution`
**功能**: 查询数据库中集合的数据分布情况
**参数**: 无参数

### 📄 文档操作

#### `insertDocuments`
**功能**: 向集合中插入一个或多个文档
**参数**: 
- `collectionName` (string): 集合名称
- `documents` (array): JSON字符串数组

#### `queryDocuments`
**功能**: 查询集合中的文档
**参数**: 
- `collectionName` (string): 集合名称
- `query` (object): 查询条件
- `limit` (number): 限制数量
- `offset` (number): 偏移量

#### `updateDocuments`
**功能**: 更新集合中的文档
**参数**: 
- `collectionName` (string): 集合名称
- `query` (object): 查询条件
- `update` (object): 更新内容
- `isMulti` (boolean): 是否批量更新

#### `deleteDocuments`
**功能**: 删除集合中的文档
**参数**: 
- `collectionName` (string): 集合名称
- `query` (object): 查询条件
- `isMulti` (boolean): 是否批量删除

### 🎯 数据模型

#### `manageDataModel`
**功能**: 数据模型查询工具，支持查询和列表数据模型
**参数**: 
- `action` (string): get/list/docs
- `name` (string): 模型名

---

## ⚡ 云函数管理

### 📋 函数信息

#### `getFunctionList`
**功能**: 获取云函数列表
**参数**: 
- `limit` (number): 分页限制
- `offset` (number): 分页偏移

#### `getFunctionDetail`
**功能**: 获取云函数详情
**参数**: 
- `name` (string): 函数名称

### 🔧 函数部署

#### `createFunction`
**功能**: 创建云函数
**参数**: 
- `func` (object): 函数配置
- `functionRootPath` (string): 函数根目录

#### `updateFunctionCode`
**功能**: 更新函数代码
**参数**: 
- `name` (string): 函数名称
- `functionRootPath` (string): 函数根目录
- `runtime` (string): 运行时环境

#### `updateFunctionConfig`
**功能**: 更新云函数配置
**参数**: 
- `funcParam` (object): 函数配置参数

### 🎮 函数运行

#### `invokeFunction`
**功能**: 调用云函数
**参数**: 
- `name` (string): 函数名
- `params` (object): 调用参数

#### `getFunctionLogs`
**功能**: 获取云函数日志
**参数**: 
- `options` (object): 包含函数名、时间范围等

### 🔗 函数触发器

#### `createFunctionTriggers`
**功能**: 创建云函数触发器
**参数**: 
- `name` (string): 函数名
- `triggers` (array): 触发器配置数组

#### `deleteFunctionTrigger`
**功能**: 删除云函数触发器
**参数**: 
- `name` (string): 函数名
- `triggerName` (string): 触发器名

### 🌐 HTTP 访问

#### `createFunctionHTTPAccess`
**功能**: 创建云函数的 HTTP 访问
**参数**: 
- `name` (string): 函数名
- `path` (string): 访问路径

---

## 🌐 静态托管

### 📤 文件管理

#### `uploadFiles`
**功能**: 上传文件到静态网站托管
**参数**: 
- `localPath` (string): 本地路径
- `cloudPath` (string): 云端路径
- `files` (array): 多文件配置

#### `deleteFiles`
**功能**: 删除静态网站托管的文件或文件夹
**参数**: 
- `cloudPath` (string): 云端路径
- `isDir` (boolean): 是否为目录

#### `findFiles`
**功能**: 搜索静态网站托管的文件
**参数**: 
- `prefix` (string): 匹配前缀
- `maxKeys` (number): 返回数量

### ⚙️ 网站配置

#### `getWebsiteConfig`
**功能**: 获取静态网站托管配置
**参数**: 无参数

#### `domainManagement`
**功能**: 统一的域名管理工具，支持绑定、解绑、查询和修改域名配置
**参数**: 
- `action` (string): create/delete/check/modify

---

## 📁 文件操作

### 🔄 文件传输

#### `downloadRemoteFile`
**功能**: 下载远程文件到本地临时文件
**参数**: 
- `url` (string): 远程文件 URL

#### `uploadFile`
**功能**: 上传文件到云存储（适合存储业务数据文件）
**参数**: 
- `localPath` (string): 本地路径
- `cloudPath` (string): 云端路径

---

## 🛠️ 工具支持

### 📚 辅助工具

#### `downloadTemplate`
**功能**: 下载CloudBase项目模板（React、小程序、AI编辑器配置等）
**参数**: 
- `template` (string): react/vue/miniprogram/uniapp/rules

#### `searchKnowledgeBase`
**功能**: 智能检索云开发知识库，通过向量搜索获取专业文档与答案
**参数**: 
- `id` (string): cloudbase/scf/miniprogram
- `content` (string): 检索内容

#### `searchWeb`
**功能**: 联网搜索工具，支持查询最新信息和访问网页内容
**参数**: 
- `query` (string): 搜索关键词、问题或网址

#### `interactiveDialog`
**功能**: 统一的交互式对话工具，支持需求澄清和任务确认
**参数**: 
- `type` (string): clarify/confirm
- `message` (string): 对话内容

---

## 🚀 使用方式

这些工具会在你与 AI 对话时自动调用，无需手动执行。例如：

- 💬 **"登录云开发"** → AI 调用 `login` 工具
- 🔍 **"查询环境信息"** → AI 调用 `envQuery` 工具  
- 🚀 **"部署应用"** → AI 调用相关的部署工具
- 📊 **"查询数据库"** → AI 调用 `queryDocuments` 工具

## ⚙️ 配置说明

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

## 云端 MCP 配置说明

如果在云端环境中使用 MCP 时，需要配置腾讯云密钥等环境变量

环境变量
- 需要将 TENCENTCLOUD_SECRETID 和 TENCENTCLOUD_SECRETKEY 配置在腾讯云控制台获取的 SecretId 和 SecretKey [获取腾讯云密钥](https://console.cloud.tencent.com/cam/capi)
- 需要将 CLOUDBASE_ENV_ID 配置为您在云开发控制台获取的环境 ID [获取云开发环境 ID](https://tcb.cloud.tencent.com/dev#/overview)

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["-y", "@cloudbase/cloudbase-mcp"],
      "env": {
        "TENCENTCLOUD_SECRETID": "腾讯云 SecretId",
        "TENCENTCLOUD_SECRETKEY": "腾讯云 SecretKey",
        "CLOUDBASE_ENV_ID": "云开发环境 ID"
      }
    }
  }
}
```



## 🔄 工具优化

为了提供更好的使用体验，我们将原来 40 个工具优化为 36 个：

- ✅ **envQuery**: 合并了 `listEnvs` + `getEnvInfo` + `getEnvAuthDomains`
- ✅ **envDomainManagement**: 合并了 `createEnvDomain` + `deleteEnvDomain`  
- ✅ **collectionQuery**: 合并了 `checkCollectionExists` + `describeCollection` + `listCollections`

通过合并相关功能，减少了工具数量的同时保持了完整的功能覆盖。 