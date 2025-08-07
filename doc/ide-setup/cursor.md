# CloudBase AI Toolkit + Cursor

<div align="center">


**🚀 Cursor + 云开发 = 几分钟内从想法到上线的全栈应用**

[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
[![开源协议](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/LICENSE)

</div>

> 💡 **为什么选择 Cursor + CloudBase AI Toolkit？**
> Cursor 是专为 AI 编程设计的现代化 IDE，拥有强大的 Agent 模式和代码生成能力。结合 CloudBase AI Toolkit，让你通过自然语言描述需求，AI 自动生成并部署全栈应用到腾讯云开发平台。特别适合快速原型开发、全栈项目构建和云端部署场景。

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

### 步骤 1：安装 Cursor

从 [Cursor 官网](https://cursor.com/) 下载并安装 Cursor IDE。

### 步骤 2：配置 CloudBase MCP


> [!TIP] 
> 如果安装以后工具数量一直为 0，请参考[常见问题](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq#mcp-%E6%98%BE%E7%A4%BA%E5%B7%A5%E5%85%B7%E6%95%B0%E9%87%8F%E4%B8%BA-0-%E6%80%8E%E4%B9%88%E5%8A%9E)

**一键安装（推荐）：**

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=cloudbase&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMG5wbS1nbG9iYWwtZXhlYyU0MGxhdGVzdCUyMCU0MGNsb3VkYmFzZSUyRmNsb3VkYmFzZS1tY3AlNDBsYXRlc3QlMjIlMkMlMjJlbnYlMjIlM0ElN0IlMjJJTlRFR1JBVElPTl9JREUlMjIlM0ElMjJDdXJzb3IlMjIlN0QlN0Q%3D)

**手动配置：**

在项目根目录创建 `.cursor/mcp.json` 文件：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
       "env": {
        "INTEGRATION_IDE": "Cursor"
      }
    }
  }
}
```

然后点击 Cursor 客户端右上角的 ⚙️ 图标，进入"MCP"设置，找到 cloudbase 并启用。

### 步骤 3：启用 AI 规则

模板项目已包含 `.cursor/rules/` 目录。如果是现有项目，对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

如果你只想下载Cursor相关的配置文件，避免项目文件混乱，可以指定IDE类型：
```
在当前项目中下载云开发 AI 规则，只包含Cursor配置
```

### 步骤 4：开始开发

在 Agent 模式下与 AI 对话：

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

## 🌟 CloudBase AI Toolkit 开源项目

<div align="center">

### 🔥 加入开源社区

[![GitHub](https://img.shields.io/badge/GitHub-TencentCloudBase/CloudBase--AI--ToolKit-black?style=for-the-badge&logo=github)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
[![CNB社区](https://img.shields.io/badge/CNB-CloudBase--AI--ToolKit-orange?style=for-the-badge)](https://cnb.cool/tencent/cloud/cloudbase/CloudBase-AI-ToolKit)

**⭐ Star 项目 | 🤝 贡献代码 | 💬 技术交流**

</div>

## 🛠️ 故障排除

### 常见问题

**Q: MCP 连接失败？**
A:
1. 检查配置文件格式是否正确
2. 重启 Cursor
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

**🚀 立即开始使用 Cursor + CloudBase AI Toolkit**

[开始使用](../getting-started) | [查看模板](../templates) | [GitHub 仓库](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

</div>