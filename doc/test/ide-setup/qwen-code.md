# CloudBase AI Toolkit + Qwen Code

<div align="center">

**🚀 Qwen Code + 云开发 = 几分钟内从想法到上线的全栈应用**

[![GitHub Stars](https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
[![开源协议](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/LICENSE)

</div>

> 💡 **为什么选择 Qwen Code + CloudBase AI Toolkit？**  
> Qwen Code 是基于 Gemini CLI 开源修改的命令行 AI 编程工具，专为 Qwen3-Coder 模型优化，支持超大上下文、丰富的本地 AI 工作流和 MCP 协议。适合命令行爱好者、自动化脚本开发和快速原型构建。

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

### 步骤 3：启用 AI 规则

项目根目录下可放置 `.qwen/QWEN.md`，内容结构与 CLAUDE.md/GEMINI.md 保持一致。

如果是现有项目，对 AI 说：
```
在当前项目中下载云开发 AI 规则
```

如果你只想下载Qwen Code相关的配置文件，避免项目文件混乱，可以指定IDE类型：
```
在当前项目中下载云开发 AI 规则，只包含Qwen Code配置
```

## 🔧 详细配置指南

### 步骤 1：安装 Qwen Code

需 Node.js 20+，推荐全局安装：
```bash
npm install -g @qwen-code/qwen-code
```
或直接运行：
```bash
npx @qwen-code/qwen-code
```

### 步骤 2：配置 CloudBase MCP

在项目根目录或主目录下创建 `.qwen/settings.json`：
```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": [
        "npm-global-exec@latest",
        "@cloudbase/cloudbase-mcp@latest"
      ],
      "env": {
        "INTEGRATION_IDE": "Qwen"
      }
    }
  }
}
```

### 步骤 4：开始开发

在 Qwen Code 命令行下与 AI 对话：
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

## 🛠️ 故障排除

### 常见问题

**Q: MCP 连接失败？**
A: 
1. 检查 `.qwen/settings.json` 配置文件格式是否正确
2. 重启 Qwen Code
3. 确认网络连接正常

**Q: AI 生成的代码不符合预期？**
A:
1. 明确描述技术栈和框架要求
2. 使用项目模板确保规范一致性
3. 提供更详细的需求描述

更多问题请查看：[完整 FAQ](../faq)

## 📚 相关资源

- [Qwen Code GitHub](https://github.com/QwenLM/qwen-code)
- [Qwen Code 官方文档](https://github.com/QwenLM/qwen-code/tree/main/docs)
- [📖 开发指南](../development)
- [🎯 使用案例](../examples)
- [🔧 MCP 工具](../mcp-tools)
- [❓ 常见问题](../faq)

## 💬 技术交流

### 微信技术交流群

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/toolkit-qrcode.png" width="200" alt="微信群二维码"/>
<br/>
<i>扫码加入微信技术交流群</i>
</div>

---

<div align="center">

**🚀 立即开始使用 Qwen Code + CloudBase AI Toolkit**

[开始使用](../getting-started) | [查看模板](../templates) | [GitHub 仓库](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

</div> 