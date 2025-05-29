<div align="center">


![](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/cloudbase-ai-toolkit.png)


# 🌟 CloudBase AI ToolKit

**通过AI提示词和MCP协议+云开发，让开发更智能、更高效**


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40cloudbase%2Fcloudbase-mcp.svg)](https://badge.fury.io/js/%40cloudbase%2Fcloudbase-mcp)
![NPM Downloads](https://img.shields.io/npm/dw/%40cloudbase%2Fcloudbase-mcp)
[![GitHub stars](https://img.shields.io/github/stars/TencentCloudBase/CloudBase-AI-ToolKit?style=social&v=1)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/TencentCloudBase/CloudBase-AI-ToolKit?style=social&v=1)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/network/members)

[![GitHub issues](https://img.shields.io/github/issues/TencentCloudBase/CloudBase-AI-ToolKit)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/TencentCloudBase/CloudBase-AI-ToolKit)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/pulls)
[![GitHub last commit](https://img.shields.io/github/last-commit/TencentCloudBase/CloudBase-AI-ToolKit)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/commits)
[![GitHub contributors](https://img.shields.io/github/contributors/TencentCloudBase/CloudBase-AI-ToolKit)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/graphs/contributors)

当你在**Cursor/ VSCode GitHub Copilot/WinSurf/CodeBuddy**等AI编程工具里写代码时，它能自动帮你生成可直接部署的前后端应用+小程序，并一键发布到腾讯云开发 CloudBase。




### 🚀 三大核心能力

**🤖 AI智能开发**: AI自动生成代码和架构设计 <br>**☁️ 云开发集成**: 一键接入数据库、云函数、静态托管 <br>**⚡ 快速部署**: 几分钟内完成全栈应用上线
### 🛠️ 支持平台

**Web应用**: 现代化前端 + 静态托管<br>**微信小程序**: 云开发小程序解决方案<br>**后端服务**: 云数据库 + 无服务器函数+云托管



**完整视频演示**

https://github.com/user-attachments/assets/2b402fa6-c5c4-495a-b85b-f5d4a25daa4a
</div> 

## ✨ 核心特性

| 特性 | 说明 | 优势 |
|------|------|------|
| **🤖 AI 原生** | 专为 AI 编程工具设计的规则库 | 生成代码符合云开发最佳实践 |
| **🚀 一键部署** | MCP 自动化部署到腾讯云开发 CloudBase 平台 | Serverless 架构，无需购买服务器 |
| **📱 全栈应用支持** | Web + 小程序 + 数据库 + 后端一体化 | 支持小程序/web 等多种应用形式,提供后端托管和数据库 |
| **🔧 智能修复** | AI 自动查看日志并修复问题 | 降低运维成本 |
| **⚡ 极速体验** | 国内 CDN 加速 | 比海外平台访问速度更快 |


## 🚀 快速开始


### 0.前置条件

#### 1. 安装 AI 开发工具
例如：
- [Cursor](https://www.cursor.com/) 
- [WindSurf](https://windsurf.com/editor)  
- [CodeBuddy](https://copilot.tencent.com/)

#### 2. 开通云开发环境
1. 访问 [腾讯云开发控制台](https://tcb.cloud.tencent.com/dev)开通环境，新用户可以免费开通体验
2. 在控制台「概览」页面右侧获取 **环境ID**  
   （后续部署需要此 ID）

### 1. 使用模板创建项目

以下模板已经内置了云开发面向 AI IDE 的规则配置

建议选择适合你的项目模板快速开始：

- React Web应用+云开发模板：[下载代码包](https://static.cloudbase.net/cloudbase-examples/web-cloudbase-react-template.zip) ｜ [开源代码地址](https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/cloudbase-react-template)
- 小程序+云开发模板：[下载代码包](https://static.cloudbase.net/cloudbase-examples/miniprogram-cloudbase-miniprogram-template.zip) ｜ [开源代码地址](https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/miniprogram/cloudbase-miniprogram-template)

### 2. 配置你的 AI IDE

<details>
<summary><strong>🔧 Cursor 配置</strong></summary>

#### 步骤1：配置 MCP

1. 请修改项目中的 `.cursor/mcp.json` ，填写你的云开发环境 ID

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"
      }
    }
  }
}
```

2. 启用云开发 MCP Server

点击 Cursor 客户端右上角的 ⚙️ 图标，点击进入之后，选择"MCP"，在 MCP Server 页面，找到 cloudbase 右边的开关按钮，点击启用

#### 步骤2：添加 AI 规则

模板中已包含 `.cursor/rules/` 目录，AI 会自动识别云开发最佳实践。

</details>

<details>
<summary><strong>🌊 Codeium/WindSurf 配置</strong></summary>

#### 步骤1：配置 MCP

点击 windsurf 的 Plugins icon，点击"View raw config"，在其中加入 clodubase-mcp，同时设置环境 id

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"
      }
    }
  }
}
```

#### 步骤2：AI 规则配置

模板中的 `.windsurf/` 目录包含专为 WindSurf 优化的配置。

</details>

<details>

<summary><strong>👥 CodeBuddy 配置</strong></summary>


#### 步骤1：自动应用 AI 规则

模板中已包含 `.rules/` 目录，CodeBuddy 会自动识别云开发最佳实践

#### 步骤 2：配置 MCP 

**配置云开发 MCP Server**

点击 CodeBuddy 右上角的 MCP 图标

点击进入之后，点击右侧的 + 号，在打开的文件中修改 MCP 配置

其中 CLOUDBASE_ENV_ID 填写你的云开发环境 ID

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"
      }
    }
  }
}
```

#### 步骤 3：切换到 Craft 智能体

在对话窗口中切换到 Craft 模式，这样可以智能生成项目

注意，在 CodeBuddy 的 Craft 中使用时，需要在右侧的设置按钮中，关闭确认计划功能，这样可以更好的执行工具。

</details>


<details>
<summary><strong>🤖 CLINE 配置</strong></summary>

#### MCP 配置
```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx", 
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "TENCENTCLOUD_SECRETID": "你的腾讯云SecretId",
        "TENCENTCLOUD_SECRETKEY": "你的腾讯云SecretKey",
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"
      }
    }
  }
}
```

使用模板中的 `.clinerules/` 目录配置。

</details>


<details>
<summary><strong>🐙 GitHub Copilot 配置</strong></summary>

#### GitHub Copilot Chat 配置

模板中的 `.github/` 目录包含 Copilot 优化配置。

</details>

<details>
<summary><strong>🎯 Trae 配置</strong></summary>

#### 配置步骤
```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"], 
      "env": {
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"  
      }
    }
  }
}
```

使用模板中的 `.trae/rules/` 配置。

</details>

<details>
<summary><strong>🧩 通义灵码 配置</strong></summary>


#### 步骤1：自动应用 AI 规则

模板中已包含 `.lingma/` 通义灵码会自动识别云开发最佳实践

#### 步骤 2：配置 MCP 

**配置云开发 MCP Server**

点击通义灵码右上角的昵称，然后选择个人设置，点击进入 MCP 设置



点击进入之后，点击右侧的打开配置文件按钮，在打开的文件中修改 MCP 配置

其中 CLOUDBASE_ENV_ID 填写你的云开发环境 ID

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "CLOUDBASE_ENV_ID": "你的云开发环境ID"
      }
    }
  }
}
```

#### 步骤 3：切换到智能体模式

在对话窗口左下角中切换到智能体模式，这样可以智能生成项目


</details>

### 3. 开始开发

确认 AI 已经连接到云开发

```
查询当前云开发环境信息
```

向 AI 描述你的需求,进行开发：

```
做一个双人在线对战五子棋网站，支持联机对战，最后进行部署
```

AI 会自动：
- 📝 生成前后端代码  
- 🚀 部署到云开发
- 🔗 返回在线访问链接

开发过程中如果遇到报错，可以把错误信息发给 AI 来进行排障

```
报错了，错误是xxxx
```


也可以让 AI 结合云函数日志进行调试和修改代码

```
云函数代码运行不符合需求，需求是 xxx，请查看日志和数据进行调试，并进行修复
```



## 🎯 使用案例

### 案例1：双人在线对战五子棋

**开发过程：**
1. 输入需求："做个双人在线对战五子棋网站，支持联机对战"
2. AI 生成：Web 应用 + 云数据库 + 实时数据推送
3. 自动部署并获得访问链接

👉 **体验地址：** [五子棋游戏](https://cloud1-5g39elugeec5ba0f-1300855855.tcloudbaseapp.com/gobang/#/)

<details>
<summary>📸 查看开发截图</summary>

| 开发过程 | 最终效果 |
|---------|---------|
| <img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-001.png" width="400" alt="开发过程截图1"> | <img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-004.png" width="400" alt="五子棋游戏效果"> |
| <img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-002.png" width="400" alt="开发过程截图2"> | 支持双人在线对战<br>实时棋局同步 |

</details>

### 案例2：AI 宠物养成小程序

**开发过程：**
1. 输入："开发一个宠物小精灵养成小程序，使用 AI 增强互动"
2. AI 生成：小程序 + 云数据库 + AI 云函数
3. 导入微信开发者工具即可发布

<details>
<summary>📸 查看开发截图与小程序预览</summary>

<table>
<tr>
<td width="50%">
<b>🖥️ 开发截图</b><br>
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-005.png" width="100%" alt="AI宠物小程序开发截图">
<br>
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-003.png" width="100%" alt="小程序开发过程">
</td>
<td width="50%">
<b>📱 小程序预览</b><br>
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-006.png" width="200" alt="小程序界面1">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-007.png" width="200" alt="小程序界面2">
<br><br>
<b>📲 体验二维码</b><br>
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-008.png" width="150" alt="小程序体验二维码">
</td>
</tr>
</table>

</details>

### 案例3：智能问题诊断

当应用出现问题时：
1. AI 自动查看云函数日志
2. 分析错误原因并生成修复代码  
3. 自动重新部署

<details>
<summary>📸 查看智能诊断过程</summary>

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/turbo-deploy/turbo-deploy-009.png" width="600" alt="智能问题诊断过程">
<br>
<i>AI 自动分析日志并生成修复方案</i>
</div>

</details>

---

## 🛠️ 云开发 MCP 工具一览

| 工具名称 | 功能简介 |
|----------|----------|
| logout | 登出当前云开发账户 |
| listEnvs | 获取所有云开发环境信息 |
| getEnvAuthDomains | 获取云开发环境的合法域名列表 |
| createEnvDomain | 为云开发环境添加安全域名 |
| deleteEnvDomain | 删除云开发环境的指定安全域名 |
| getEnvInfo | 获取当前云开发环境信息 |
| updateEnvInfo | 修改云开发环境别名 |
| createCollection | 创建一个新的云开发数据库集合 |
| checkCollectionExists | 检查云开发数据库集合是否存在 |
| updateCollection | 更新云开发数据库集合配置（创建或删除索引） |
| describeCollection | 获取云开发数据库集合的详细信息 |
| listCollections | 获取云开发数据库集合列表 |
| checkIndexExists | 检查索引是否存在 |
| distribution | 查询数据库中集合的数据分布情况 |
| insertDocuments | 向集合中插入文档 |
| queryDocuments | 查询集合中的文档 |
| updateDocuments | 更新集合中的文档 |
| deleteDocuments | 删除集合中的文档 |
| uploadFiles | 上传文件到静态网站托管 |
| listFiles | 获取静态网站托管的文件列表 |
| deleteFiles | 删除静态网站托管的文件或文件夹 |
| findFiles | 搜索静态网站托管的文件 |
| createHostingDomain | 绑定自定义域名 |
| deleteHostingDomain | 解绑自定义域名 |
| getWebsiteConfig | 获取静态网站配置 |
| tcbCheckResource | 获取域名配置 |
| tcbModifyAttribute | 修改域名配置 |
| getFunctionList | 获取云函数列表 |
| createFunction | 创建云函数 |
| updateFunctionCode | 更新云函数代码 |
| updateFunctionConfig | 更新云函数配置 |
| getFunctionDetail | 获取云函数详情 |
| invokeFunction | 调用云函数 |
| getFunctionLogs | 获取云函数日志 |
| createFunctionTriggers | 创建云函数触发器 |
| deleteFunctionTrigger | 删除云函数触发器 |
| downloadRemoteFile | 下载远程文件到本地临时文件 |
| uploadFile | 上传文件到云存储（适合存储业务数据文件） |

## 🏗️ 架构原理

```mermaid
graph TD
    A[开发者] --> B[AI IDE]
    B -->|使用| C[CloudBase AI 规则]
    C --> D[生成代码]
    B -->|调用| E[CloudBase MCP]
    E --> F{检测部署}
    F -->|成功| G[云开发平台]
    F -->|失败| H[返回日志]
    H --> I[AI 修复]
    I --> E
    G --> J[线上应用]
    J --> K[Web/小程序/API]
```

## 🌟 为什么选择 CloudBase？

- **⚡ 极速部署**：国内节点,访问速度比海外更快
- **🛡️ 稳定可靠**：330 万开发者选择的 Serverless 平台
- **🔧 开发友好**：专为AI时代设计的全栈平台
- **💰 成本优化**：Serverless 架构更具弹性，新用户开发期间可以免费体验

## 💬 技术交流群

遇到问题或想要交流经验？加入我们的技术社区！

### 🔥 微信交流群

<div align="center">
<img src="https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/toolkit-qrcode.png" width="200" alt="微信群二维码">
<br>
<i>扫码加入微信技术交流群</i>
</div>

**群内你可以：**
- 💡 分享你的 AI + 云开发项目
- 🤝 技术交流和开发问题沟通
- 📢 获取最新功能更新和最佳实践
- 🎯 参与产品功能讨论和建议

### 📱 其他交流方式

| 平台 | 链接 | 说明 |
|------|------|------|
| **官方文档** | [📖 查看文档](https://docs.cloudbase.net/) | 完整的云开发文档 |
| **Issue 反馈** | [🐛 提交问题](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues) | Bug 反馈和功能请求 |

### 🎉 社区活动

- **每周技术分享**：群内定期分享 AI + 云开发最佳实践
- **项目展示**：展示你用 AI 开发的精彩项目
- **问题答疑**：腾讯云开发团队成员在线答疑
- **新功能预览**：第一时间体验最新功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！请查看我们的[贡献指南](CONTRIBUTING.md)了解如何参与项目开发。

## 📄 开源协议

[MIT](LICENSE) © TencentCloudBase

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！ 

## 📋 [常见问题 FAQ](./FAQ.md)

如有迁移、集成等常见疑问，请查阅 [FAQ 常见问题](./FAQ.md)。 
