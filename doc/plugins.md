# 🔌 插件系统

CloudBase MCP 采用插件化架构，支持按需启用工具模块，解决 MCP 客户端工具数量限制问题。

## 📋 插件列表

### 默认插件 (开箱即用)

| 插件名称 | 功能描述 |
|----------|----------|
| `env` | 环境管理 (登录、退出、环境查询) |
| `database` | 数据库操作 (集合、文档、索引管理) |
| `functions` | 云函数管理 (创建、更新、调用、日志) |
| `hosting` | 静态托管 (文件上传、域名配置) |
| `storage` | 云存储管理 (文件存储、CDN) |
| `setup` | 项目初始化 (模板下载、配置) |
| `interactive` | 交互对话 (用户确认、选择) |
| `security-rule` | 安全规则管理（数据库、云函数、存储安全规则读写） |

### 可选插件 (按需启用)

| 插件名称 | 功能描述 |
|----------|----------|
| `rag` | 知识库搜索 (AI 增强问答) |
| `download` | 远程文件下载 |
| `gateway` | API 网关管理 |
| `miniprogram` | 小程序发布 (上传、预览、构建) |

## ⚙️ 插件配置

### 指定启用插件

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_MCP_PLUGINS_ENABLED": "env,database,functions,hosting"
      }
    }
  }
}
```

### 禁用特定插件

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_MCP_PLUGINS_DISABLED": "rag,download,gateway"
      }
    }
  }
}
```

## 🎯 常用配置

| 场景 | 推荐插件 |
|------|----------|
| **基础开发** | `env,database,functions,hosting` |
| **完整功能** | `env,database,functions,hosting,storage,setup,interactive,rag,download,gateway,miniprogram` |
| **纯后端** | `env,database,functions` |
| **小程序** | `env,database,functions,storage,setup,miniprogram` |
| **AI 应用** | `env,database,functions,hosting,rag,interactive` |

## 📚 相关文档

- [MCP 工具详细说明](mcp-tools.md) - 查看所有可用工具
- [快速开始](getting-started.md) - 开始使用指南
- [常见问题](faq.md) - 插件配置问题 