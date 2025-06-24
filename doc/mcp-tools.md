# MCP 工具

CloudBase AI ToolKit 提供了完整的 MCP 工具集，支持云开发的各种操作。目前共有 **35 个工具**，涵盖环境管理、数据库操作、云函数管理、静态托管等核心功能。

📋 **完整工具规格**: [查看 tools.json](../scripts/tools.json)

## 🔧 工具分类概览

| 分类 | 工具数量 | 主要功能 |
|------|----------|----------|
| 🌍 [环境管理](#环境管理) | 4 个 | 登录、环境信息查询、域名管理 |
| 🗄️ [数据库操作](#数据库操作) | 11 个 | 集合管理、文档 CRUD、索引操作 |
| ⚡ [云函数管理](#云函数管理) | 9 个 | 函数创建、更新、调用、日志 |
| 🌐 [静态托管](#静态托管) | 6 个 | 文件上传、管理、域名配置 |
| 📁 [文件操作](#文件操作) | 2 个 | 文件下载、云存储上传 |
| 🛠️ [工具支持](#工具支持) | 3 个 | 模板下载、知识库搜索、交互对话 |

---

## 🌍 环境管理

### 🔐 身份认证
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `login` | 登录云开发环境并选择要使用的环境 | `forceUpdate`: 强制重新选择环境 |
| `logout` | 退出云开发环境 | `confirm`: 确认操作 |

### 📊 环境信息
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `envQuery` | **合并工具** - 查询环境列表、当前环境信息和安全域名 | `action`: list/info/domains |
| `updateEnvInfo` | 更新云开发环境信息 | `alias`: 环境别名 |

### 🌐 域名管理  
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `envDomainManagement` | **合并工具** - 管理环境安全域名（添加/删除） | `action`: create/delete, `domains`: 域名列表 |

---

## 🗄️ 数据库操作

### 📦 集合管理
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `createCollection` | 创建一个新的云开发数据库集合 | `collectionName`: 集合名称 |
| `collectionQuery` | **合并工具** - 检查集合存在性、查看详情、获取列表 | `action`: check/describe/list |
| `updateCollection` | 更新集合配置（创建或删除索引） | `collectionName`, `options`: 索引配置 |
| `checkIndexExists` | 检查索引是否存在 | `collectionName`, `indexName` |
| `distribution` | 查询数据库中集合的数据分布情况 | 无参数 |

### 📄 文档操作
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `insertDocuments` | 向集合中插入一个或多个文档 | `collectionName`, `documents`: JSON字符串数组 |
| `queryDocuments` | 查询集合中的文档 | `collectionName`, `query`, `limit`, `offset` |
| `updateDocuments` | 更新集合中的文档 | `collectionName`, `query`, `update`, `isMulti` |
| `deleteDocuments` | 删除集合中的文档 | `collectionName`, `query`, `isMulti` |

### 🎯 数据模型
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `manageDataModel` | 数据模型查询工具，支持查询和列表数据模型 | `action`: get/list/docs, `name`: 模型名 |

---

## ⚡ 云函数管理

### 📋 函数信息
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `getFunctionList` | 获取云函数列表 | `limit`, `offset`: 分页参数 |
| `getFunctionDetail` | 获取云函数详情 | `name`: 函数名称 |

### 🔧 函数部署
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `createFunction` | 创建云函数 | `func`: 函数配置, `functionRootPath`: 函数根目录 |
| `updateFunctionCode` | 更新函数代码 | `name`, `functionRootPath`, `runtime` |
| `updateFunctionConfig` | 更新云函数配置 | `funcParam`: 函数配置参数 |

### 🎮 函数运行
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `invokeFunction` | 调用云函数 | `name`: 函数名, `params`: 调用参数 |
| `getFunctionLogs` | 获取云函数日志 | `options`: 包含函数名、时间范围等 |

### 🔗 函数触发器
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `createFunctionTriggers` | 创建云函数触发器 | `name`, `triggers`: 触发器配置数组 |
| `deleteFunctionTrigger` | 删除云函数触发器 | `name`, `triggerName` |

### 🌐 HTTP 访问
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `createFunctionHTTPAccess` | 创建云函数的 HTTP 访问 | `name`: 函数名, `path`: 访问路径 |

---

## 🌐 静态托管

### 📤 文件管理
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `uploadFiles` | 上传文件到静态网站托管 | `localPath`, `cloudPath`, `files`: 多文件配置 |
| `deleteFiles` | 删除静态网站托管的文件或文件夹 | `cloudPath`, `isDir`: 是否为目录 |
| `findFiles` | 搜索静态网站托管的文件 | `prefix`: 匹配前缀, `maxKeys`: 返回数量 |

### ⚙️ 网站配置
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `getWebsiteConfig` | 获取静态网站托管配置 | 无参数 |
| `domainManagement` | 统一的域名管理工具，支持绑定、解绑、查询和修改域名配置 | `action`: create/delete/check/modify |

---

## 📁 文件操作

### 🔄 文件传输
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `downloadRemoteFile` | 下载远程文件到本地临时文件 | `url`: 远程文件 URL |
| `uploadFile` | 上传文件到云存储（适合存储业务数据文件） | `localPath`, `cloudPath` |

---

## 🛠️ 工具支持

### 📚 辅助工具
| 工具名称 | 功能描述 | 关键参数 |
|----------|----------|----------|
| `downloadTemplate` | 下载CloudBase项目模板（React、小程序、AI编辑器配置等） | `template`: react/vue/miniprogram/uniapp/rules |
| `searchKnowledgeBase` | 智能检索云开发知识库，通过向量搜索获取专业文档与答案 | `id`: cloudbase/scf/miniprogram, `content`: 检索内容 |
| `interactiveDialog` | 统一的交互式对话工具，支持需求澄清和任务确认 | `type`: clarify/confirm, `message`: 对话内容 |

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

## 🔄 工具优化

为了提供更好的使用体验，我们将原来 40 个工具优化为 35 个：

- ✅ **envQuery**: 合并了 `listEnvs` + `getEnvInfo` + `getEnvAuthDomains`
- ✅ **envDomainManagement**: 合并了 `createEnvDomain` + `deleteEnvDomain`  
- ✅ **collectionQuery**: 合并了 `checkCollectionExists` + `describeCollection` + `listCollections`

通过合并相关功能，减少了工具数量的同时保持了完整的功能覆盖。 