# CloudBase AI Toolkit + CodeBuddy

<div align="center">

**🚀 CodeBuddy + 云开发 = 几分钟内从想法到上线的全栈应用**

[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
[![开源协议](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/LICENSE)

</div>

> 💡 **重要提示：CodeBuddy 独立 IDE 已内置集成 CloudBase AI Toolkit，无需手动配置 MCP。**
> 只需在 CodeBuddy 对话框点击“配置集成”按钮，选择 Tencent CloudBase 并授权，即可一键启用全部云开发能力。
> 
> 下文 MCP 配置和插件说明仅适用于 VSCode/JetBrains/微信开发者工具等非独立 IDE 场景。

> 💡 **为什么选择 CodeBuddy + CloudBase AI Toolkit？**
> CodeBuddy 是腾讯推出的 AI 编程助手，具有强大的 Craft 智能体功能，能够与微信开发者工具深度集成。结合 CloudBase AI Toolkit，让你通过自然语言描述需求，AI 自动生成并部署全栈应用到腾讯云开发平台。特别适合腾讯生态的全栈开发，包括小程序、Web 应用和企业级项目。

## ✨ 核心优势

| 🎯 **开发效率** | ⚡ **部署速度** | 🛡️ **稳定可靠** |
|---|---|---|
| AI 自动生成代码和架构<br/>内置云开发最佳实践规则<br/>智能错误修复和优化 | 一键部署到腾讯云开发<br/>国内 CDN 加速访问<br/>Serverless 架构免运维 | 330万开发者验证的平台<br/>企业级安全和稳定性<br/>完善的监控和日志系统 |

## 🚀 5分钟快速开始

### 方式一：使用项目模板（推荐）

选择预配置的项目模板，开箱即用：

<div align="center">

**[📦 查看所有项目模板](../templates)**

</div>

### 方式二：现有项目集成

如果你已有项目，只需 3 步集成：

```bash
# 1. 配置 MCP（具体配置见下方详细步骤）
# 2. 下载 AI 规则
# 3. 开始使用
```

配置完成后，对 AI 说：**"登录云开发"** 即可开始！

## 🔧 详细配置指南

> 💡 **CodeBuddy 独立 IDE 用户请直接在对话框点击“配置集成”按钮并授权，无需手动配置 MCP。**

### 步骤 1：安装 CodeBuddy

根据你的开发环境选择安装方式：

- **VS Code**: 在扩展商店搜索 "CodeBuddy" 安装
- **JetBrains**: 在插件市场搜索 "CodeBuddy" 安装
- **微信开发者工具**: 从腾讯云官网下载插件

### 步骤 2：配置 CloudBase MCP

> [!TIP] 
> 如果安装以后工具数量一直为 0，请参考[常见问题](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq#mcp-%E6%98%BE%E7%A4%BA%E5%B7%A5%E5%85%B7%E6%95%B0%E9%87%8F%E4%B8%BA-0-%E6%80%8E%E4%B9%88%E5%8A%9E)

1. 可以在 点开 CodeBuddy 右上角的 MCP 按钮，在 MCP 市场中搜索 CloudBase，然后点击安装即可。
2. 也可以选择手动安装，点开 CodeBuddy 右上角的 MCP 按钮，点击右侧的添加，在 MCP 配置中添加：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["--cache", ".","@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

### 步骤 3：启用 AI 规则

模板项目已包含 `.rules/` 目录。如果是现有项目，对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

### 步骤 4：开始开发

在 Craft 模式下与 AI 对话（建议关闭确认计划功能）：

```
登录云开发
```

## 🎯 开始使用

配置完成后，对 AI 说：

```
登录云开发
```

然后就可以开始开发了，例如：

```
创建一个在线投票系统，支持创建投票、参与投票、结果统计，使用云数据库存储，最后部署
```

CodeBuddy 特别适合小程序开发，支持微信开发者工具集成。

## 🛠️ 故障排除

### 常见问题

**Q: 独立 IDE 无法集成 CloudBase？**
A:
1. 请确保已在对话框点击“配置集成”并完成 Tencent CloudBase 授权
2. 如遇网络或授权问题，重启 IDE 并重试

**Q: MCP 连接失败？（仅插件模式）**
A:
1. 检查 MCP 配置格式是否正确
2. 重启 CodeBuddy
3. 确认网络连接正常

**Q: AI 生成的代码不符合预期？**
A:
1. 明确描述技术栈和框架要求
2. 使用项目模板确保规范一致性
3. 提供更详细的需求描述

更多问题请查看：[完整 FAQ](../faq)

## 📚 相关资源

- [📖 开发指南](../development) - 深入了解开发最佳实践
- [🎯 使用案例](../examples) - 查看实际应用案例
- [🔧 MCP 工具](../mcp-tools) - 了解所有可用工具
- [❓ 常见问题](../faq) - 查看常见问题解答

## 💬 技术交流

### 微信技术交流群

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/toolkit-qrcode.png" width="200" alt="微信群二维码"/>
<br/>
<i>扫码加入微信技术交流群</i>
</div>

---

<div align="center">

**🚀 立即开始使用 CodeBuddy + CloudBase AI Toolkit**

[开始使用](../getting-started) | [查看模板](../templates) | [GitHub 仓库](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

</div>