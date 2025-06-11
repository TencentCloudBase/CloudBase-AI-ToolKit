# 云开发 + GitHub Copilot 配置指南

> 💡 **为什么选择这个配置？**  
> GitHub Copilot 是 GitHub 官方的 AI 编程助手，支持强大的代码生成和智能建议。通过配置 CloudBase AI ToolKit，可以将 Copilot 的 AI 能力与云开发平台无缝集成，特别适合已有 GitHub Copilot 订阅且习惯 VS Code 环境的开发者。

## 🚀 快速配置

### 步骤 1：安装 GitHub Copilot

1. 确保拥有 GitHub Copilot 订阅
2. 在 VS Code 中安装 "GitHub Copilot" 和 "GitHub Copilot Chat" 扩展
3. 使用 GitHub 账号登录授权

### 步骤 2：获取项目模板

> 📖 **查看完整模板列表**：[项目模板](../templates)

如果你已经有项目，可以跳过此步骤。

### 步骤 3：配置 MCP

创建 `.vscode/mcp.json` 文件：

```json
{
    "servers": {
        "cloudbase": {
            "command": "npx",
            "args": [
                "@cloudbase/cloudbase-mcp@latest"
            ]
        }
    }
}
```

### 步骤 4：配置 AI 规则

创建 `.github/copilot-instructions.md` 文件，或直接对 AI 说：

```
在当前项目中下载云开发 AI 规则
```

## 🎯 开始使用

### 1. 启用 Agent 模式

在 VS Code 中：
1. 打开 Copilot Chat 面板
2. 在对话窗口左下角切换到 **Agent** 模式
3. 确认 MCP 工具已连接

### 2. 登录云开发

```
登录云开发
```

### 3. 开始开发

```
创建一个在线相册应用，支持图片上传、分类管理、分享功能，使用云存储和云数据库，最后部署
```

## 💡 使用技巧

### Copilot Chat 功能

- **代码建议**：在编写代码时获得智能补全
- **对话式开发**：通过自然语言描述需求
- **代码解释**：解释复杂代码逻辑
- **错误修复**：智能识别和修复问题

### 常用指令

```bash
# 项目初始化
@workspace 使用云开发创建一个待办应用，包含用户认证和数据持久化

# 功能开发
为当前项目添加用户头像上传功能，使用云存储服务

# 代码优化
#selection 优化这段代码的性能和可读性

# 问题解决
我的云函数部署失败了，错误信息是：[错误内容]，请帮我排查问题
```

### 最佳实践

1. **使用 @workspace**：让 Copilot 理解整个项目上下文
2. **选择代码片段**：使用 #selection 针对特定代码操作
3. **明确技术栈**：在对话中明确使用云开发技术栈
4. **分步骤开发**：复杂功能分解为多个步骤

## 🔧 高级配置

### 工作区设置

在 `.vscode/settings.json` 中添加：

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false
  },
  "github.copilot.advanced": {
    "debug.overrideEngine": "copilot-chat",
    "inlineSuggestCount": 3
  }
}
```

### 自定义 Copilot 指令

创建 `.github/copilot-instructions.md`：

```markdown
# 云开发项目指令

## 开发规范
- 优先使用云开发 SDK 2.x 版本
- 所有数据库操作通过云函数处理
- 遵循 TypeScript 最佳实践
- 使用现代化的 React/Vue 组件写法

## 架构规范
- 前端：使用 Vite + React/Vue 
- 后端：云函数 + 云数据库
- 存储：云存储 + 静态托管
- 部署：自动化 CI/CD 流程
```

## 🛠️ 故障排除

### Copilot 无法连接

**问题：** GitHub Copilot 无法正常工作

**解决方案：**
1. 检查 GitHub Copilot 订阅状态
2. 在 VS Code 中重新登录 GitHub 账号
3. 重启 VS Code 应用
4. 检查网络连接状态

### MCP 工具不可用

**问题：** Agent 模式下无法调用云开发工具

**解决方案：**
1. 确认 `.vscode/mcp.json` 配置正确
2. 检查 npx 命令是否可用
3. 重新启用 GitHub Copilot Chat 扩展
4. 查看 VS Code 输出日志

### 代码建议不准确

**问题：** Copilot 生成的代码不符合云开发规范

**解决方案：**
1. 添加详细的项目说明文档
2. 在 `.github/copilot-instructions.md` 中明确规范
3. 使用 @workspace 让 AI 理解项目上下文
4. 提供示例代码作为参考

## 📚 Copilot 开发模式

### 智能补全

在编写代码时，Copilot 会自动提供建议：

```javascript
// 输入注释，Copilot 会生成对应代码
// 创建云函数处理用户注册
```

### 对话式开发

```bash
@workspace 在当前项目中添加以下功能：
1. 用户注册登录页面
2. 云函数处理用户认证
3. 数据库存储用户信息
4. 前端状态管理
```

### 代码重构

```bash
#selection 重构这个组件，要求：
- 使用 TypeScript
- 添加错误处理
- 优化性能
- 遵循 React 最佳实践
```

## 💡 开发技巧

### 使用工作区上下文

```
@workspace 基于当前项目的技术栈，为我设计一个用户权限管理系统
```

### 文件级别操作

```
为 #file:components/UserProfile.tsx 添加编辑功能
```

### 终端集成

```
@terminal 帮我构建并部署当前项目到云开发平台
```

## 🎯 实际开发场景

### 快速原型

```
@workspace 快速创建一个笔记应用原型，包含：
- Markdown 编辑器
- 笔记分类管理
- 云端同步存储
- 搜索功能
```

### 企业应用

```
开发一个企业级 CRM 系统，要求：
1. 客户信息管理
2. 销售漏斗跟踪
3. 任务和日程管理
4. 数据分析报表
5. 移动端支持
6. 部署到云开发平台
```

### API 开发

```
为电商平台设计并实现以下 API：
- 商品管理（增删改查）
- 订单处理流程
- 支付集成接口
- 库存管理系统
使用云函数实现，包含完整的错误处理和数据验证
```

## 📚 相关资源

- [GitHub Copilot 官方文档](https://docs.github.com/copilot)
- [VS Code Copilot 扩展](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [CloudBase AI ToolKit 首页](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/)
- [快速开始指南](../getting-started)
- [开发指南](../development)

## 💬 技术支持

遇到问题？获取帮助：

- 📖 查看 [常见问题 FAQ](../faq)
- 🐛 提交 [GitHub Issue](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues)
- 💬 加入微信技术交流群
- 🎯 访问 [GitHub Copilot 社区](https://github.com/community) 