# 云开发 + 通义灵码配置指南

> 💡 **为什么选择这个配置？**  
> 通义灵码是阿里巴巴推出的 AI 编程助手，支持智能代码生成和智能体功能。通过配置 CloudBase AI ToolKit，可以实现高效的云端应用开发，特别适合中文开发者和需要本土化 AI 编程体验的团队。

## 🚀 快速配置

### 步骤 1：获取项目模板

> 📖 **查看完整模板列表**：[项目模板](../templates)

如果你已经有项目，可以跳过此步骤。

### 步骤 2：配置 MCP

在通义灵码的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

### 步骤 3：配置 AI 规则

创建 `.lingma/cloudbase.md` 文件，或直接对 AI 说：

```
在当前项目中下载云开发 AI 规则
```

## 🎯 开始使用

### 1. 切换到智能体模式

在对话窗口左下角切换到智能体模式。

### 2. 登录云开发

```
登录云开发
```

### 3. 开始开发

```
创建一个在线问答社区，支持问题发布、回答、投票功能，使用云数据库存储，最后部署
```

## 📚 相关资源

- [通义灵码官网](https://tongyi.aliyun.com/lingma)
- [CloudBase AI ToolKit 首页](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/)

## 💬 技术支持

- 📖 查看 [常见问题 FAQ](../faq)
- 💬 加入微信技术交流群 