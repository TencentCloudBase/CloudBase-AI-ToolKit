# 快速开始

## 0. 前置条件

### 安装 AI 开发工具
例如 [Cursor](https://www.cursor.com/) | [WindSurf](https://windsurf.com/editor) | [CodeBuddy](https://copilot.tencent.com/) 等，点击查看 [支持的 AI 开发工具列表](../index.md#-支持的-ai-开发工具)

### 开通云开发环境
访问 [腾讯云开发控制台](https://tcb.cloud.tencent.com/dev)开通环境，新用户可以免费开通体验。

## 1. 快速初始化或增强你的项目

我们为你准备了内置云开发最佳实践和 AI IDE 规则的项目模板，推荐如下两种方式：

### 🚀 新项目推荐

选择适合你的模板，一键初始化：

- **React Web 应用 + 云开发模板**  
  [下载代码包](https://static.cloudbase.net/cloudbase-examples/web-cloudbase-react-template.zip?v=2025053001) ｜ [开源代码地址](https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/cloudbase-react-template)

- **微信小程序 + 云开发模板**  
  [下载代码包](https://static.cloudbase.net/cloudbase-examples/miniprogram-cloudbase-miniprogram-template.zip?v=2025053001) ｜ [开源代码地址](https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/miniprogram/cloudbase-miniprogram-template)

- **AI 规则通用云开发模板**：不限定语言和框架，内置 CloudBase AI 规则和MCP，适用于任意云开发项目

  [下载代码包](https://static.cloudbase.net/cloudbase-examples/web-cloudbase-project.zip) ｜ [开源代码地址](https://github.com/TencentCloudBase/awesome-cloudbase-examples/tree/master/web/cloudbase-project)

### 🛠️ 已有项目增强

如果你已经有自己的项目，只需在配置好 MCP 后，只需要对 AI 说 "在当前项目中下载云开发 AI 规则"，即可一键下载并补全 AI 编辑器规则配置到当前项目目录，无需手动操作。

## 2. 配置你的 AI IDE

CloudBase AI ToolKit 支持多种 AI 开发工具，查看 [支持的 AI 开发工具列表](/ai/cloudbase-ai-toolkit/#-支持的-ai-开发工具) 选择合适的工具。

> 📖 **详细配置说明**：查看 [IDE配置指南](../ide-setup/) 了解如何配置你的开发工具

## 3. 开始开发

在开始使用前，只需要对 AI 说

```
登录云开发
```

AI 就会自动完成弹出登录腾讯云界面以及云开发的环境选择

后续如需切换环境，可以说

```
退出云开发
```

AI 就会清理本地的配置，后续可以再要求 AI 登录云开发来重新登录。

在登录成功后，可以确认 AI 已经连接到云开发

```
查询当前云开发环境信息
```

向 AI 描述你的需求,进行开发：

```
做一个双人在线对战五子棋网站，支持联机对战，最后进行部署
```

AI 会自动：
- �� 生成前后端代码  
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

## 🎯 典型开发流程

1. **需求描述** → AI 理解并规划架构
2. **代码生成** → 自动生成前后端代码
3. **云资源创建** → 自动创建数据库、云函数等
4. **部署上线** → 自动部署并返回访问链接
5. **问题修复** → AI 查看日志自动修复问题

## 📝 开发提示

- 详细描述功能需求，AI 会生成更准确的代码
- 遇到问题时，把错误信息完整提供给 AI
- 可以要求 AI 查看日志进行问题诊断
- 支持增量开发，逐步完善功能

## 🎉 成功完成

完成配置后，你已经可以：

✅ 通过自然语言描述需求生成全栈应用  
✅ 自动创建和配置云开发资源  
✅ 一键部署到云端并获得访问链接  
✅ AI 智能排查和修复开发问题  

## 🔄 常见问题

### Q: 如何更新到最新版本？
A: 在 AI IDE 的 MCP 配置中重新启用 cloudbase-mcp 即可自动获取最新版本。

### Q: 支持哪些类型的应用？
A: 支持 Web 应用、微信小程序、API 服务等，涵盖前端、后端、数据库的完整技术栈。

### Q: 是否有免费额度？
A: 新用户可以免费开通云开发环境体验，包含静态托管、云数据库、云函数等服务的免费额度。

### Q: 如何获取技术支持？
A: 可以通过 GitHub Issues、微信技术群或官方文档获取帮助。详见 [技术支持](./faq#技术支持)。

## 📚 下一步

- 📖 [了解项目模板](./templates) - 深入了解各种项目模板
- 💻 [开发指南](./development) - 掌握高级开发技巧  
- 🎯 [使用案例](./examples) - 学习实际项目经验
- 🛠️ [MCP 工具参考](./mcp-tools) - 了解所有可用工具 