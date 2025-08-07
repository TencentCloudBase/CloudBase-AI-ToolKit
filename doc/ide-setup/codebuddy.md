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

## 前提条件

1. **开通云开发**：请参考文档 [开通云开发环境](https://docs.cloudbase.net/quick-start/create-env)
2. **安装 CodeBuddy**：根据您的开发环境选择对应版本

## 🔧 配置指南

### 1. 配置 CloudBase ToolKit

#### CodeBuddy IDE版

**CodeBuddy IDE** 用户请直接在设置页/集成点击"Tencent CloudBase"管理按钮并授权，无需手动配置 MCP：

![CodeBuddy IDE 集成配置](https://qcloudimg.tencent-cloud.cn/raw/181adab137d74530cbc2b73b280aa2d6.png)

#### CodeBuddy 插件版

##### 步骤 1：安装 CodeBuddy

根据您的开发环境选择安装方式：

* **VS Code**: 在扩展商店搜索 "CodeBuddy" 安装
* **JetBrains**: 在插件市场搜索 "CodeBuddy" 安装
* **微信开发者工具**: 从腾讯云官网下载插件

##### 步骤 2：配置 CloudBase MCP

**方式一：通过 MCP 市场安装（推荐）**

1. 点击 CodeBuddy 右上角的 MCP 按钮
2. 在 MCP 市场中搜索 CloudBase
3. 点击安装即可

![MCP 市场安装](https://qcloudimg.tencent-cloud.cn/raw/e23e9eb8a71a63c85a6fcb3845e62536.png)

**方式二：手动配置**

1. 点击 CodeBuddy 右上角的 MCP 按钮
2. 点击右侧的添加按钮
3. 在 MCP 配置中添加以下内容：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "INTEGRATION_IDE": "CodeBuddyManual"
      }
    }
  }
}
```

![手动配置 MCP](https://qcloudimg.tencent-cloud.cn/raw/318db1a04f1f936924d2c4d1eaed1e5c.png)

> **故障排查**：如果安装后工具数量显示为 0，请参考[常见问题](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq#mcp-%E6%98%BE%E7%A4%BA%E5%B7%A5%E5%85%B7%E6%95%B0%E9%87%8F%E4%B8%BA-0-%E6%80%8E%E4%B9%88%E5%8A%9E)

### 2. 项目初始化

#### 方式一：使用项目模板（推荐）

选择预配置的项目模板，开箱即用：

<div align="center">

**[📦 查看所有项目模板](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/templates)**

</div>

模板项目已包含 `.rules/` 目录，无需手动配置 AI 规则，可以直接开始开发。

#### 方式二：现有项目集成

如果您已有项目，在 Craft 模式下对 CodeBuddy 说：

```
在当前项目中下载云开发 AI 规则
```

如果您只想下载 CodeBuddy 相关的配置文件，避免项目文件混乱，可以指定：

```
在当前项目中下载云开发 AI 规则，只包含 CodeBuddy 配置
```

## 实战案例：在线投票系统

### 1. 需求描述

在 **Craft** 模式下，选中 `Plan Mode` 模式对 CodeBuddy 说：

```
创建一个在线投票系统，支持创建投票、参与投票、结果统计，使用云数据库存储，最后部署
```

### 2. 需求分析

CodeBuddy 会自动分析需求并生成规范的需求文档：

![需求分析过程](https://qcloudimg.tencent-cloud.cn/raw/4857ac3e9b676b9196d83e8dbb26f4c1.png)

![需求文档生成](https://qcloudimg.tencent-cloud.cn/raw/e020d3e49c45b5c5dcc418b7c113bee1.png)

### 3. 确认需求

需求讨论完毕后，CodeBuddy 会总结并确认需求文档。确认无误后，点击 `继续` 开始生成代码：

![需求确认](https://qcloudimg.tencent-cloud.cn/raw/e279e5a1b5ac1665e43f695a2b1795a2.png)

### 4. 自动开发

编写代码过程中，CodeBuddy 会自动调用 **CloudBase ToolKit** 进行数据库创建：

![数据库创建](https://qcloudimg.tencent-cloud.cn/raw/28a37244afe96630c5db118d235eb774.png)

### 5. 一键部署

开发完成后，CodeBuddy 会调用 **CloudBase ToolKit** 直接部署前端资源到云开发：

![资源部署](https://qcloudimg.tencent-cloud.cn/raw/b8c08a2da14567128c1a1c5c6053d7b2.png)

至此，我们通过一句简单的需求描述，借助 **CodeBuddy** 和 **CloudBase AI Toolkit** 完成了需求分析、代码生成、数据库创建、前后端部署等一系列工作。

## 效果展示

### 投票列表

![投票列表页面](https://qcloudimg.tencent-cloud.cn/raw/e1ee4103c6271c342d189b24e0b96914.png)

### 新建投票

![新建投票页面](https://qcloudimg.tencent-cloud.cn/raw/4b7774a49bcad87431082a723e8aa5de.png)

### 投票详情

![投票详情页面](https://qcloudimg.tencent-cloud.cn/raw/ee6e21beb9fcfd75b24e55033ce31f39.png)

### 个人中心

![个人中心页面](https://qcloudimg.tencent-cloud.cn/raw/12c67750fff593a11b900f1fa96e9835.png)

**在线体验**：[https://lowcode-9g2yhkab1a980408-1308771514.tcloudbaseapp.com/vote_base/](https://lowcode-9g2yhkab1a980408-1308771514.tcloudbaseapp.com/vote_base/)

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