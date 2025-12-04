# CodeBuddy 配置指南

<IDESelector defaultIDE="codebuddy" showInstallButton={false} />

## CodeBuddy IDE 版

**CodeBuddy IDE** 用户请直接在设置页/集成点击"Tencent CloudBase"管理按钮并授权，无需手动配置 MCP。

## CodeBuddy 插件版

### 安装

在项目根目录创建 `.codebuddy/mcp.json` 文件：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "CodeBuddy"
      }
    }
  }
}
```

### 通过 MCP 市场安装（推荐）

1. 点击 CodeBuddy 右上角的 MCP 按钮
2. 在 MCP 市场中搜索 CloudBase
3. 点击安装即可

## 验证连接

配置完成后，在 AI 对话中输入：

```
检查 CloudBase 工具是否可用
```

## 常见问题

**Q: MCP 连接失败？**
A: 检查配置文件格式是否正确，重启 CodeBuddy，确认网络连接正常。

**Q: 工具数量显示为 0？**
A: 请参考[常见问题](../faq#mcp-显示工具数量为-0-怎么办)。

更多问题请查看：[完整 FAQ](../faq)
