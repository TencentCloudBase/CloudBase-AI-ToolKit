# CloudBase AI Toolkit + 通义灵码

<div align="center">

**🚀 通义灵码 + 云开发 = 几分钟内从想法到上线的全栈应用**

[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
[![开源协议](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/LICENSE)

</div>

> 💡 **为什么选择 通义灵码 + CloudBase AI Toolkit？**
> 通义灵码是阿里巴巴推出的 AI 编程助手，支持智能代码生成和智能体功能。结合 CloudBase AI Toolkit，让你通过自然语言描述需求，AI 自动生成并部署全栈应用到腾讯云开发平台。特别适合中文开发者和需要本土化 AI 编程体验的团队。

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

### 步骤 1：安装通义灵码

从 [通义灵码官网](https://tongyi.aliyun.com/lingma) 下载并安装对应平台的插件。

### 步骤 2：配置 CloudBase MCP


> [!TIP] 
> 如果安装以后工具数量一直为 0，请参考[常见问题](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq#mcp-%E6%98%BE%E7%A4%BA%E5%B7%A5%E5%85%B7%E6%95%B0%E9%87%8F%E4%B8%BA-0-%E6%80%8E%E4%B9%88%E5%8A%9E)

在通义灵码的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
          "INTEGRATION_IDE": "LingMa"
      }
    }
  }
}
```

### 步骤 3：启用 AI 规则

创建 `.lingma/cloudbase.md` 文件，或直接对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

如果你只想下载通义灵码相关的配置文件，避免项目文件混乱，可以指定IDE类型：
```
在当前项目中下载云开发 AI 规则，只包含通义灵码配置
```

### 步骤 4：开始开发

在智能体模式下与 AI 对话：

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

通义灵码支持中文优化，对中文开发者更加友好。

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
1. 检查通义灵码 MCP 配置格式是否正确
2. 确认 npx 命令可用：`npx --version`
3. 重启通义灵码
4. 检查网络连接状态

**Q: AI 生成的代码不符合预期？**
A:
1. 使用中文详细描述需求
2. 使用项目模板确保规范一致性
3. 提供更详细的技术要求

更多问题请查看：[完整 FAQ](../faq)

## 📚 相关资源

- [📖 开发指南](../development) - 深入了解开发最佳实践
- [🎯 使用案例](../examples) - 查看实际应用案例
- [🔧 MCP 工具](../mcp-tools) - 了解所有可用工具
- [❓ 常见问题](../faq) - 查看常见问题解答
- [通义灵码官网](https://tongyi.aliyun.com/lingma) - 通义灵码官网

## 💬 技术交流

### 微信技术交流群

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/toolkit-qrcode.png" width="200" alt="微信群二维码"/>
<br/>
<i>扫码加入微信技术交流群</i>
</div>

---

<div align="center">

**🚀 立即开始使用 通义灵码 + CloudBase AI Toolkit**

[开始使用](../getting-started) | [查看模板](../templates) | [GitHub 仓库](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

</div>