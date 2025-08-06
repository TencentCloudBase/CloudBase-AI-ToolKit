
---
cloudbaseAIVersion：1.8.28
description: CloudBase AI 开发规则索引 - 防止不同开发场景的规则互相干扰
globs: *
alwaysApply: true
---

#  AI 开发人机协同规则索引

## 核心行为规则
0. 你擅长调用合适的工具来完成完成各项任务，例如关于腾讯云开发相关的操作，你会优先使用 cloubase 的 mcp 来进行调用
1. 你会在对话输出完毕后选择适当的时机向用户提出询问，例如是否需要添加后端能力，是否打开预览，是否需要部署等
2. 你首先会阅读当前项目的 README.md，遵照当前项目的说明进行开发，如果不存在则会在生成项目后生成一个 README.md 文件
3. 开发的时候，默认就在当前目录下产出所有项目代码，先检查当前目录的文件  
4. 开发预览的时候，如果本身项目有依赖后端数据库集合和云函数，可以优先部署后端然后再预览前端
5. 交互式反馈规则：在需求不明确时主动与用户对话澄清，优先使用自动化工具 interactiveDialog 完成配置。执行高风险操作前必须使用 interactiveDialog 获得用户确认。保持消息简洁并用emoji标记状态。
6. 如果涉及到实时通信相关的例如实时对战等，可以使用云开发的实时数据库 watch 能力
7. **认证规则**：当用户要求实现登录注册功能时，必须严格区分平台类型：
   - **Web 项目**：必须使用 CloudBase Web SDK 内置的认证功能（如 `auth.toDefaultLoginPage()`），严禁使用云函数实现登录认证逻辑
   - **小程序项目**：小程序云开发天然免登录，在云函数中通过 wx-server-sdk 获取 `wxContext.OPENID`，严禁生成登录页面或登录流程

## 版本检测和升级约束

### 自动版本检测
- 当用户使用 CloudBase 相关功能时，AI Agent 应自动检查当前项目的 cloudbaseAIVersion 字段
- 通过 npm registry API 查询 @cloudbase/cloudbase-mcp 的最新版本
- 比较版本差异，如果发现新版本可用，主动向用户提示升级建议
- 首次使用时显示友好的欢迎信息和当前版本

### 升级指导流程
- 检测到版本差异时，使用 interactiveDialog 工具与用户确认升级意愿
- 提供详细的升级指导，包括 MCP 升级和 AI 规则下载两个选项
- 集成官方文档链接：https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/faq#%E5%A6%82%E4%BD%95%E6%9B%B4%E6%96%B0-cloudbase-ai-toolkit
- 指导用户执行 downloadTemplate 操作，参数为 template:rules

### 版本信息展示格式
```
🚀 CloudBase AI Toolkit v{currentVersion}

✨ 当前版本：{currentVersion}
🆕 最新版本：{latestVersion}
📅 最后检查：{lastCheckTime}

{upgradeMessage}
```

### 升级提示格式
```
🔄 发现新版本可用！

当前版本：{currentVersion}
最新版本：{latestVersion}

选择升级方式：
1. 🔧 升级 MCP 工具
2. 📥 下载最新 AI 规则
3. 🚀 全部升级
4. ❌ 暂不升级

官方升级指南：{officialDocLink}
```

### 首次使用欢迎信息
```
🎉 欢迎使用 CloudBase AI Toolkit！

✨ 当前版本：{currentVersion}
🚀 功能特性：
   • 智能云开发助手
   • 多平台项目支持
   • 自动化部署流程
   • 丰富的项目模板

📚 快速开始：https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/
🔄 需要了解升级流程吗？
```

## 工作流

### Workflow 斜杠命令规范

#### 可用命令
- **/spec** - 强制使用完整 spec 流程（需求文档、技术方案、任务拆分）
- **/no_spec** - 跳过 spec 流程，直接执行任务
- **/help** 或 **/workflow** - 显示 workflow 命令帮助
- **默认** - AI 根据任务复杂度智能判断

#### 智能判断标准
**使用 spec 流程的场景：**
- 新功能开发
- 复杂架构设计
- 多模块集成
- 涉及数据库设计
- 涉及用户界面设计
- 涉及第三方服务集成

**跳过 spec 流程的场景：**
- 简单 bug 修复
- 文档更新
- 配置修改
- 代码重构
- 性能优化
- 测试用例编写

#### 命令响应格式
```
🎯 Workflow 模式：{mode}

📋 判断依据：{reason}
🔄 后续流程：{next_steps}

{confirmation_message}
```

#### 帮助信息格式
```
🛠️ Workflow 命令帮助

📝 可用命令：
• /spec - 强制使用完整 spec 流程
• /no_spec - 跳过 spec 流程，直接执行
• /help 或 /workflow - 显示此帮助信息

💡 使用建议：
• 新功能开发建议使用 /spec
• 简单修复可以直接使用 /no_spec
• 不确定时可以不指定命令，AI 会智能判断

⚠️ 注意事项：
• /no_spec 模式仍需要遵循项目规范
• 复杂任务建议使用 /spec 确保质量
• 任何模式下都需要用户确认重要操作
```

### 流程执行规范

#### Spec 流程（/spec 或智能判断使用）
1. 需求澄清和确认
2. 需求文档设计（requirements.md）
3. 技术方案设计（design.md）
4. 任务拆分（tasks.md）
5. 执行任务并更新状态
6. 用户确认每个阶段

#### No-Spec 流程（/no_spec 或智能判断跳过）
1. 直接分析任务需求
2. 快速制定执行计划
3. 直接执行任务
4. 保持代码质量和项目规范
5. 必要时使用 interactiveDialog 确认

#### 通用规范
- 所有模式下都必须遵循项目代码规范
- 所有模式下都必须使用英文注释和提交信息
- 所有模式下都必须使用 interactiveDialog 进行重要操作确认
- 所有模式下都必须保持代码质量和可维护性

<workflow>
0. 请注意！必须遵守以下的规则，每个环节完成后都需要由我进行确认后才可进行下一个环节；
1. 如果你判断我的输入提出的是一个新需求，可以按照下面的标准软件工程的方式独立开展工作，需要时才向我询问，可以采用 interactiveDialog 工具来收集
2. 每当我输入新的需求的时候，为了规范需求质量和验收标准，你首先会搞清楚问题和需求，然后再进入下一阶段
3. 需求文档和验收标准设计：首先完成需求的设计,按照 EARS 简易需求语法方法来描述,如果你判断需求涉及到前端页面，也可在需求中提前确定好设计风格和配色等，跟我进行确认需求细节，最终确认清楚后，需求定稿，然后再进入下一阶段，保存在 `specs/spec_name/requirements.md` 中，参考格式如下

```markdown
# 需求文档

## 介绍

需求描述

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. 采用 ERAS 描述的子句 While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>，例如 When 选择"静音"时，笔记本电脑应当抑制所有音频输出。
2. ...
...
```
4. 技术方案设计： 在完成需求的设计之后，你会根据当前的技术架构和前面确认好的需求，进行需求的技术方案设计，精简但是能够准确的描述技术的架构（例如架构、技术栈、技术选型、数据库/接口设计、测试策略、安全性），必要时可以用 mermaid 来绘图，跟我确认清楚后，保存在  `specs/spec_name/design.md`  中，然后再进入下一阶段
5. 任务拆分：在完成技术方案设计后，你会根据需求文档和技术方案，细化具体要做的事情，跟我确认清楚后，，保存在`specs/spec_name/tasks.md` 中, 然后再进入下一阶段，开始正式执行任务，同时需要及时更新任务的状态，执行的时候尽可能独立自主运行，保证效率和质量

任务参考格式如下

``` markdown
# 实施计划

- [ ] 1. 任务信息
  - 具体要做的事情
  - ...
  - _需求: 相关的需求点的编号

```
</workflow>

## 专业领域规则文件

**重要：根据具体的开发场景，AI 必须参考对应的规则文件，避免不同场景的规则互相干扰**

### rules/web-development.mdc
描述前端+云开发 CloudBase 项目开发的专业规则，包含：
- Web 项目结构和工程化配置
- 静态托管部署流程
- Web SDK 使用和认证方式
- 适用于纯 Web 项目开发时参考

### rules/miniprogram-development.mdc  
描述微信小程序开发的专业规则，包含：
- 小程序项目结构和配置
- 微信开发者工具 CLI 打开项目方法
- 微信云开发能力集成
- 小程序特有的 API 和权限处理
- 适用于微信小程序开发时参考

### rules/cloudbase-platform.mdc
描述 CloudBase 平台的核心知识，包含：
- 云开发环境和认证
- 云函数、数据库、存储等服务
- 数据模型和权限管理
- 控制台管理页面链接
- 适用于所有使用 CloudBase 平台的项目

### rules/workflows.mdc
描述开发工作流程，包含：
- 部署流程（云函数、静态托管）
- 素材下载和知识库查询
- 文档和配置文件生成规则
- MCP 接口调用规范
- 适用于项目开发的各个阶段

### rules/database.mdc
描述云开发 CloudBase 数据库操作的专业规则，包含：
- CloudBase 数据库操作注意事项
- 数据库权限管理
- 数据更新和错误处理
- 适用于涉及数据库操作的项目

### rules/ui-design.mdc
描述web/小程序等页面设计和 UI 规范，包含：
- 高保真原型设计流程
- UI 设计规范和工具选择
- 前端样式处理
- 适用于需要设计界面的项目

## 使用指导
- **Web 项目开发**：主要参考 `rules/web-development.mdc` + `rules/cloudbase-platform.mdc` + `rules/workflows.mdc`
- **微信小程序开发**：主要参考 `rules/miniprogram-development.mdc` + `rules/cloudbase-platform.mdc` + `rules/workflows.mdc`  
- **数据库相关**：额外参考 `rules/database.mdc`
- **UI 设计需求**：额外参考 `rules/ui-design.mdc`

**重要提醒：开发微信小程序时，严禁参考 Web SDK 的认证方式，必须使用小程序专用的 API 和云开发方式！**