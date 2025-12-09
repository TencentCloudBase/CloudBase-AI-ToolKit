<div align="center"><a name="readme-top"></a>

![](scripts/assets/toolkit-better.gif)

<h1>CloudBase MCP</h1>

**🪐 AI 编程，一键上线**<br/>
连接 AI IDE 与腾讯云 CloudBase 的部署桥梁，让你的 AI 应用即刻上线

[English](./README-EN.md) · **简体中文** · [文档][docs] · [更新日志][changelog] · [反馈问题][github-issues-link]

<!-- SHIELD GROUP -->

[![][npm-version-shield]][npm-link]
[![][npm-downloads-shield]][npm-link]
[![][github-stars-shield]][github-stars-link]
[![][github-forks-shield]][github-forks-link]
[![][github-issues-shield]][github-issues-link]
![][github-license-shield]
![][github-contributors-shield]
[![][cnb-shield]][cnb-link]
[![][deepwiki-shield]][deepwiki-link]

**发现了一个让 AI 编程一键上线的神器，推荐给正在用 AI 编程的朋友**

[![][share-x-shield]][share-x-link]
[![][share-telegram-shield]][share-telegram-link]
[![][share-weibo-shield]][share-weibo-link]

<sup>从 AI 提示词到应用上线的最短路径</sup>

[![][github-trending-shield]](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

[<img width="791" height="592" alt="Clipboard_Screenshot_1763724670" src="https://github.com/user-attachments/assets/f769beb7-5710-4397-8854-af2b7e452f70" />](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/tutorials)

</div>

## 为什么你需要 CloudBase MCP？

AI 编程工具（如 Cursor、CodeBuddy）解决了**代码生成**的难题。

但是，从"生成代码"到"应用上线"（部署、配置数据库、CDN、域名），依然存在一条鸿沟。

**CloudBase MCP**（原 CloudBase AI ToolKit）填补了这条鸿沟。

你不再需要：
- ❌ 繁琐的 DevOps 配置和 YAML 文件
- ❌ 手动设置云函数和数据库
- ❌ 在 IDE 和云控制台之间反复横跳

你只需要在 AI IDE 中，用自然语言完成从"想法"到"上线"的全过程。

<details>
<summary><kbd>目录</kbd></summary>

- [🚀 快速开始](#-快速开始)
- [✨ 核心特性](#-核心特性)
- [📦 安装配置](#-安装配置)
- [🎯 使用案例](#-使用案例)
- [🧩 MCP 工具](#-mcp-工具)
- [📚 更多资源](#-更多资源)

</details>

## 🚀 快速开始

### 一行配置，立即使用

在支持 MCP 的 AI IDE 中（Cursor、WindSurf、CodeBuddy 等），只需添加一行配置：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

> [!TIP]
> **推荐使用 CloudBase AI CLI**
> 
> 一键安装，自动配置，支持多种 AI 编程工具：
> 
> ```bash
> npm install @cloudbase/cli@latest -g
> ```
> 
> 安装后运行 `tcb ai` 即可开始使用
> 
> [查看完整文档](https://docs.cloudbase.net/cli-v1/ai/introduce) | [详细案例教程](https://docs.cloudbase.net/practices/ai-cli-mini-program)

### 首次使用

1. **登录云开发**
   ```
   登录云开发
   ```
   AI 会自动打开登录界面并引导环境选择

2. **开始开发**
   ```
   做一个双人在线对战五子棋网站，支持联机对战，最后进行部署
   ```
   AI 会自动生成代码、部署到云端并返回访问链接



### 支持的 AI IDE


| 工具 | 支持平台 | 查看指引 |
|------|----------|----------|
| [CloudBase AI CLI](https://docs.cloudbase.net/cli-v1/ai/introduce) | 命令行工具 | [查看指引](https://docs.cloudbase.net/cli-v1/ai/introduce) |
| [Cursor](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/cursor) | 独立 IDE| [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/cursor) |
| [WindSurf](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/windsurf) | 独立 IDE, VSCode、JetBrains 插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/windsurf) |
| [CodeBuddy](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/codebuddy) | 独立 IDE（已内置 CloudBase），VS Code、JetBrains、微信开发者工具| [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/codebuddy) |
| [CLINE](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/cline) | VS Code 插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/cline) |
| [GitHub Copilot](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/github-copilot) | VS Code 插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/github-copilot) |
| [Trae](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/trae) | 独立 IDE | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/trae) |
| [通义灵码](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/tongyi-lingma) | 独立 IDE，VS Code、 JetBrains插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/tongyi-lingma) |
| [RooCode](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/roocode) | VS Code插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/roocode) |
| [文心快码](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/baidu-comate) | VS Code、JetBrains插件| [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/baidu-comate) |
| [Augment Code](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/augment-code) | VS Code、JetBrains 插件 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/augment-code) |
| [Claude Code](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/claude-code) | 命令行工具 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/claude-code) |
| [Gemini CLI](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/gemini-cli) | 命令行工具 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/gemini-cli) |
| [OpenAI Codex CLI](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/openai-codex-cli) | 命令行工具 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/openai-codex-cli) |
| [OpenCode](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/opencode) | 命令行工具 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/opencode) |
| [Qwen Code](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/qwen-code) | 命令行工具 | [查看指引](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/qwen-code) |



## ✨ 如何实现 AI 编程"一键上线"？

### 1. AI 原生（AI-Native）

我们不是简单的"胶水代码"。内置的规则库专为 AI 编程设计，能让 AI 直接生成"可部署"的 CloudBase 最佳实践代码。

```markdown
提示词：生成一个用户登录功能
- AI 自动生成符合云开发规范的代码
- 自动配置数据库、云函数、安全规则
- 一键部署到云端
```

<img width="1200" alt="AI Native" src="scripts/assets/cloudbase-mcp-card-01.png" />

### 2. 一键部署（One-Click Deploy）

AI 自动化的 MCP 部署流，AI 帮你搞定从云函数、数据库到静态网站的**所有**云上资源配置。

```markdown
提示词：部署当前项目到云开发
- 自动检测项目类型（Web/小程序/后端）
- 智能配置部署参数
- 实时显示部署进度
- 自动返回访问链接
```

<img width="1200" alt="One-Click Deploy" src="scripts/assets/cloudbase-mcp-card-02.png" />

### 3. 智能调试（Smart Debugging）

部署出错？不用怕。AI 会自动读取日志，帮你分析并修复问题，真正实现**开发-部署-调试**的闭环。

```markdown
提示词：报错了，错误是 xxxx
- AI 自动查看云函数日志
- 分析错误原因
- 生成修复代码
- 自动重新部署
```

<img width="1200" alt="Smart Debugging" src="scripts/assets/cloudbase-mcp-card-03.png" />

### 4. 全栈支持（Full-Stack Ready）

无论是 Web 应用、小程序还是后端服务，AI 都能为你处理，你只需专注业务逻辑。

| 应用类型 | 技术栈 | 部署方式 |
|---------|--------|---------|
| **Web 应用** | React/Vue/Next.js | 静态托管 + CDN |
| **微信小程序** | 原生/UniApp | 小程序发布 |
| **后端服务** | Node.js/Python | 云函数/云托管 |

<img width="1200" alt="Full-Stack Ready" src="scripts/assets/cloudbase-mcp-card-04.png" />

### 5. 知识检索（Knowledge Search）

内置云开发、微信小程序等专业知识库的智能向量检索，让 AI 更懂云开发。

```markdown
提示词：如何使用云数据库实现实时数据同步？
- 智能检索云开发知识库
- 返回相关文档和最佳实践
- 提供代码示例
```

<img width="1200" alt="Knowledge Search" src="scripts/assets/cloudbase-mcp-card-05.png" />

### 6. 灵活工作流（Flexible Workflow）

支持 /spec 和 /no_spec 命令，根据任务复杂度智能选择。

```markdown
/spec - 完整工作流（需求→设计→任务→实现）
/no_spec - 快速迭代（直接实现）
```

<img width="1200" alt="Flexible Workflow" src="scripts/assets/cloudbase-mcp-card-06.png" />


## 📦 安装配置

### 前置条件

- ✅ Node.js v18.15.0 及以上版本
- ✅ 已开通 [腾讯云开发环境](https://tcb.cloud.tencent.com/dev)
- ✅ 安装支持 MCP 的 AI IDE（[查看支持的 IDE](#支持的-ai-ide)）

### 配置方式

#### 方式一：CloudBase AI CLI（推荐）

```bash
# 安装
npm install @cloudbase/cli@latest -g

# 使用
tcb ai
```

#### 方式二：手动配置 MCP

根据你使用的 AI IDE，添加 MCP 配置：

<details>
<summary><b>Cursor</b></summary>

在 `.cursor/mcp.json` 中添加：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

</details>

<details>
<summary><b>WindSurf</b></summary>

在 `.windsurf/settings.json` 中添加：

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

</details>

<details>
<summary><b>CodeBuddy</b></summary>

CodeBuddy 已内置 CloudBase MCP，无需配置即可使用。

</details>

<details>
<summary><b>其他 IDE</b></summary>

查看 [完整配置指南](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/) 了解其他 IDE 的配置方式。

</details>


## 🎯 使用案例

### 案例 1：双人在线对战五子棋

**开发过程：**
1. 输入需求："做个双人在线对战五子棋网站，支持联机对战"
2. AI 生成：Web 应用 + 云数据库 + 实时数据推送
3. 自动部署并获得访问链接

**体验地址：** [五子棋游戏](https://cloud1-5g39elugeec5ba0f-1300855855.tcloudbaseapp.com/gobang/#/)

<details>
<summary>查看开发截图</summary>

| 开发过程 | 最终效果 |
|---------|---------|
| ![][image-case1-dev] | ![][image-case1-result] |

</details>

### 案例 2：AI 宠物养成小程序

**开发过程：**
1. 输入："开发一个宠物小精灵养成小程序，使用 AI 增强互动"
2. AI 生成：小程序 + 云数据库 + AI 云函数
3. 导入微信开发者工具即可发布

<details>
<summary>查看开发截图与小程序预览</summary>

![][image-case2]

</details>

### 案例 3：智能问题诊断

当应用出现问题时，AI 自动查看日志、分析错误并生成修复代码。

<details>
<summary>查看智能诊断过程</summary>

![][image-case3]

</details>

## 🧩 MCP 工具

覆盖环境管理、数据库、云函数、静态托管等核心功能。

| 分类 | 工具 | 核心功能 |
|------|------|----------|
| **环境** | 4 个 | 登录认证、环境查询、域名管理 |
| **数据库** | 11 个 | 集合管理、文档 CRUD、索引、数据模型 |
| **云函数** | 9 个 | 创建、更新、调用、日志、触发器 |
| **静态托管** | 5 个 | 文件上传、域名配置、网站部署 |
| **工具支持** | 4 个 | 模板、知识库搜索、联网搜索、交互对话 |

[查看完整工具文档](doc/mcp-tools.md) | [工具规格 JSON](scripts/tools.json)

## 📚 更多资源

### 文档

- [快速开始](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/getting-started)
- [IDE 配置指南](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ide-setup/cursor)
- [项目模板](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/templates)
- [开发指南](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/development)
- [插件系统](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/plugins)
- [常见问题](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq)

### 教程

- [查看所有教程和视频...](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/tutorials)

### 项目案例

- [查看所有项目案例...](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/examples)

## 💬 社区

### 微信交流群

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/toolkit-qrcode.png" width="200" alt="微信群二维码">
<br>
<i>扫码加入微信技术交流群</i>
</div>

### 其他交流方式

| 平台 | 链接 | 说明 |
|------|------|------|
| **官方文档** | [查看文档](https://docs.cloudbase.net/) | 完整的云开发文档 |
| **Issue 反馈** | [提交问题](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues) | Bug 反馈和功能请求 |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=TencentCloudBase/CloudBase-AI-ToolKit&type=Timeline)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

## Contributors

感谢所有为 CloudBase MCP 做出贡献的开发者！

[![Contributors](https://contrib.rocks/image?repo=TencentCloudBase/CloudBase-AI-ToolKit)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/graphs/contributors)

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 Star！**

[![][github-stars-shield]][github-stars-link]

[MIT](LICENSE) © TencentCloudBase

</div>

<!-- Image Placeholders - 这些图片需要实际生成或替换 -->
<!-- 
设计风格约束（所有图片统一遵循）：
- 现代扁平化设计，简洁而富有活力
- 背景色：纯黑色 #000000（统一黑色背景）
- 主题色渐变：#67E9E9 → #4896FF → #2BCCCC（保持）
- 活力点缀色：适度使用 #FFD93D（黄）、#6BCF7F（绿）作为点缀
- 简洁几何形状（圆形、矩形、线条），无文字
- 使用几何图形和图标表达概念，抽象化 UI 骨架
- 宣传视频风格，现代 UI 骨架
- 流畅线条、适度光效、平衡的色彩搭配

提示词模板（所有图片无文字，纯几何形状和图标）：
- image-overview: "抽象化 UI 骨架图，现代风格，纯黑色背景 #000000，主题色 #67E9E9 #4896FF #2BCCCC 渐变，适度活力点缀色，使用几何形状（圆形、矩形、流畅线条）和图标表达 AI IDE、代码生成、云端部署的流程，无文字，宣传视频风格，现代 UI 骨架"
- image-ai-native: "抽象化代码生成界面骨架，现代风格，纯黑色背景，主题色青色蓝色渐变，使用矩形代表代码块，圆形代表 AI 图标，流畅线条代表连接关系，无文字，宣传视频风格，简洁几何图形"
- image-deploy: "抽象化部署界面骨架，现代风格，纯黑色背景，主题色渐变，使用圆形进度指示器，矩形进度条，流畅线条表达部署流程，无文字，宣传视频风格，现代 UI 骨架"
- image-fullstack: "抽象化全栈架构骨架图，现代风格，纯黑色背景，主题色渐变，使用圆形节点代表不同服务（Web/小程序/后端/数据库），流畅线条连接表达集成关系，几何形状图标化表达，无文字，宣传视频风格"
- image-agent: "抽象化 AI 智能体界面骨架，现代风格，纯黑色背景，主题色渐变，使用圆形代表 Agent，矩形代表配置卡片，流畅线条表达数据流，几何形状图标化，无文字，宣传视频风格，现代 UI 骨架"
- image-debug: "抽象化问题诊断界面骨架，现代风格，纯黑色背景，主题色渐变，使用矩形代表日志卡片，圆形代表状态指示，流畅线条表达分析流程，几何形状图标化，无文字，宣传视频风格"
- image-knowledge: "抽象化知识检索界面骨架，现代风格，纯黑色背景，主题色渐变，使用矩形卡片代表搜索结果，圆形代表搜索图标，流畅线条表达关联关系，几何形状图标化，无文字，宣传视频风格，现代 UI 骨架"
- image-workflow: "抽象化工作流选择界面骨架，现代风格，纯黑色背景，主题色渐变，使用圆形按钮代表两种模式，矩形面板代表选项，流畅线条表达流程，几何形状图标化，无文字，宣传视频风格"
- image-case1-dev: "抽象化游戏开发界面骨架，现代风格，纯黑色背景，主题色渐变，使用几何形状代表代码编辑器、游戏界面元素，无文字，宣传视频风格，现代 UI 骨架"
- image-case1-result: "抽象化游戏界面骨架，现代风格，纯黑色背景，主题色渐变，使用圆形和矩形代表游戏元素，几何形状图标化表达，无文字，宣传视频风格"
- image-case2: "抽象化小程序开发界面骨架，现代风格，纯黑色背景，主题色渐变，使用矩形代表小程序界面，圆形代表功能模块，几何形状图标化，无文字，宣传视频风格，现代 UI 骨架"
- image-case3: "抽象化问题诊断界面骨架，现代风格，纯黑色背景，主题色渐变，使用矩形代表日志卡片，圆形代表状态，流畅线条表达诊断流程，几何形状图标化，无文字，宣传视频风格"
-->

[image-overview]: https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/video-banner.png
[image-ai-native]: https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=AI+Native+Development
[image-deploy]: https://via.placeholder.com/800x400/10B981/FFFFFF?text=One-Click+Deploy
[image-fullstack]: https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=Full-Stack+Application
[image-agent]: https://via.placeholder.com/800x400/EC4899/FFFFFF?text=AI+Agent+Development
[image-debug]: https://via.placeholder.com/800x400/F59E0B/FFFFFF?text=Smart+Debugging
[image-knowledge]: https://via.placeholder.com/800x400/06B6D4/FFFFFF?text=Knowledge+Search
[image-workflow]: https://via.placeholder.com/800x400/6366F1/FFFFFF?text=Flexible+Workflow
[image-case1-dev]: https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-001.png
[image-case1-result]: https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-004.png
[image-case2]: https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-005.png
[image-case3]: https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-009.png

<!-- Links -->
[docs]: https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/
[changelog]: https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/releases
[github-issues-link]: https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues
[github-stars-link]: https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/stargazers
[github-forks-link]: https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/network/members
[github-trending-url]: https://github.com/trending
[npm-link]: https://www.npmjs.com/package/@cloudbase/cloudbase-mcp
[cnb-link]: https://cnb.cool/tencent/cloud/cloudbase/CloudBase-AI-ToolKit
[deepwiki-link]: https://deepwiki.com/TencentCloudBase/CloudBase-AI-ToolKit

<!-- Shields -->
[npm-version-shield]: https://img.shields.io/npm/v/@cloudbase/cloudbase-mcp?color=3B82F6&label=npm&logo=npm&style=flat-square
[npm-downloads-shield]: https://img.shields.io/npm/dw/@cloudbase/cloudbase-mcp?color=10B981&label=downloads&logo=npm&style=flat-square
[github-stars-shield]: https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?color=F59E0B&label=stars&logo=github&style=flat-square
[github-forks-shield]: https://img.shields.io/github/forks/TencentCloudBase/CloudBase-AI-ToolKit?color=8B5CF6&label=forks&logo=github&style=flat-square
[github-issues-shield]: https://img.shields.io/github/issues/TencentCloudBase/CloudBase-AI-ToolKit?color=EC4899&label=issues&logo=github&style=flat-square
[github-license-shield]: https://img.shields.io/badge/license-MIT-6366F1?logo=github&style=flat-square
[github-contributors-shield]: https://img.shields.io/github/contributors/TencentCloudBase/CloudBase-AI-ToolKit?color=06B6D4&label=contributors&logo=github&style=flat-square
[github-contributors-link]: https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/graphs/contributors
[cnb-shield]: https://img.shields.io/badge/CNB-CloudBase--AI--ToolKit-3B82F6?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHJ4PSIyIiBmaWxsPSIjM0I4MkY2Ii8+PHBhdGggZD0iTTUgM0g3VjVINSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cGF0aCBkPSJNNSA3SDdWOUg1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==&style=flat-square
[deepwiki-shield]: https://deepwiki.com/badge.svg
[github-trending-shield]: https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social

<!-- Share Links -->
[share-x-link]: https://x.com/intent/tweet?hashtags=cloudbase,ai,devtools&text=AI%20编程%2C%20一键上线！告别繁琐的%20DevOps%20配置%2C%20从提示词到应用上线的最短路径%20🚀&url=https://github.com/TencentCloudBase/CloudBase-AI-ToolKit
[share-x-shield]: https://img.shields.io/badge/-share%20on%20x-black?labelColor=black&logo=x&logoColor=white&style=flat-square
[share-telegram-shield]: https://img.shields.io/badge/-share%20on%20telegram-black?labelColor=black&logo=telegram&logoColor=white&style=flat-square
[share-telegram-link]: https://t.me/share/url?url=https://github.com/TencentCloudBase/CloudBase-AI-ToolKit&text=AI%20编程%2C%20一键上线！告别繁琐的%20DevOps%20配置%2C%20从提示词到应用上线的最短路径%20🚀
[share-weibo-link]: http://service.weibo.com/share/share.php?sharesource=weibo&title=AI%20编程%2C%20一键上线！告别繁琐的%20DevOps%20配置%2C%20从提示词到应用上线的最短路径%20🚀&url=https://github.com/TencentCloudBase/CloudBase-AI-ToolKit
[share-weibo-shield]: https://img.shields.io/badge/-share%20on%20weibo-black?labelColor=black&logo=sinaweibo&logoColor=white&style=flat-square
