# 云开发 + WindSurf

> 💡 **为什么选择这个配置？**  
> WindSurf 是 Codeium 推出的 AI 原生编辑器，拥有强大的 Write 模式和 Cascade 多文件编辑功能。结合云开发能够实现智能化的代码生成和项目管理，特别适合需要多文件协同编辑的复杂项目开发。

## 📦 获取项目模板

推荐使用预配置的项目模板快速开始：

> 📖 **查看完整模板列表**：[项目模板](../templates)

**已有项目增强**：
如果你已经有项目，配置好 MCP 后，对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

## 🌊 Codeium/WindSurf 配置

### 步骤1：使用 AI 规则

模板中的 `.windsurf/` 目录包含专为 WindSurf 优化的配置。如果不是从模板开始，可以让 AI 帮你下载云开发规则。

### 步骤2：配置 MCP

如果使用模板项目，MCP 配置已经预置完成。如果不是从模板开始，需要在 WindSurf 的 Plugins 配置中添加：

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

### 步骤3：切换到 Write 模式

在对话中切换到 Write 模式进行智能生成。

## 开始使用

配置完成后，对 AI 说：

```
登录云开发
```

开始你的开发之旅！

## 特色功能

- **Cascade 编辑**：支持多文件同时编辑
- **Write 模式**：专为代码生成优化
- **Plugins 支持**：灵活的插件配置

## 故障排除

**MCP 不生效？**
1. 检查 Plugins 配置
2. 重启 WindSurf  
3. 确认 MCP 服务已启用 