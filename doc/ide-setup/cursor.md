# 云开发 + Cursor

> 💡 **为什么选择这个配置？**  
> Cursor 是专为 AI 编程设计的现代化 IDE，通过 MCP 协议与云开发深度集成，能够让你通过自然语言描述需求，AI 自动生成并部署全栈应用。非常适合快速原型开发、全栈项目构建和云端部署场景。

## 📦 获取项目模板

推荐使用预配置的项目模板快速开始：

> 📖 **查看完整模板列表**：[项目模板](../templates)

**已有项目增强**：
如果你已经有项目，配置好 MCP 后，对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

## 🔧 Cursor 配置

### 步骤1：使用 AI 规则

模板中已包含 `.cursor/rules/` 目录，AI 会自动识别云开发最佳实践。如果不是从模板开始，可以让 AI 帮你下载云开发规则。

### 步骤2：配置 MCP

如果使用模板项目，MCP 配置已经预置完成。如果不是从模板开始，可以点击下方按钮安装到 Cursor 中：

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=CloudBase&config=eyJjb21tYW5kIjoibnB4IEBjbG91ZGJhc2UvY2xvdWRiYXNlLW1jcEBsYXRlc3QiLCJkaXNhYmxlZCI6ZmFsc2V9)

或手动添加配置到 `.cursor/mcp.json`：

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

然后点击 Cursor 客户端右上角的 ⚙️ 图标，进入"MCP"设置，找到 cloudbase 并启用。

### 步骤3：切换到 Agent 模式

在对话窗口中使用 Agent 进行代码生成和自动化操作。

## 开始使用

配置完成后，对 AI 说：

```
登录云开发
```

开始你的开发之旅！

## 故障排除

**MCP 不生效？**
1. 检查配置文件格式
2. 重启 Cursor
3. 确认 MCP 已启用 