# RooCode 配置指南

<IDESelector defaultIDE="roocode" showInstallButton={false} />

## 安装

在项目根目录创建 `.roocode/mcp.json` 文件：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "RooCode"
      }
    }
  }
}
```

## 验证连接

配置完成后，在 AI 对话中输入：

```
检查 CloudBase 工具是否可用
```

## 常见问题

**Q: MCP 连接失败？**
A: 检查配置文件格式是否正确，重启 RooCode，确认网络连接正常。

**Q: 工具数量显示为 0？**
A: 请参考[常见问题](../faq#mcp-显示工具数量为-0-怎么办)。

更多问题请查看：[完整 FAQ](../faq)
