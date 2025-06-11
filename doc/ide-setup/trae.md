# 云开发 + Trae 配置指南

> 💡 **为什么选择这个配置？**  
> Trae 是一款新兴的 AI 原生开发环境，支持强大的 Builder with MCP 功能。通过配置 CloudBase AI ToolKit，可以实现智能化的全栈应用开发，特别适合喜欢尝试新技术和追求极致 AI 开发体验的创新型开发者。

## 🚀 快速配置

### 步骤 1：获取项目模板

> 📖 **查看完整模板列表**：[项目模板](../templates)

如果你已经有项目，可以跳过此步骤。

### 步骤 2：配置 MCP

在 Trae 的 MCP 配置中添加：

```json
{
  "mcpServers": {
    "cloudbase-mcp": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```

### 步骤 3：配置 AI 规则

创建 `.trae/rules/cloudbase.md` 文件，或直接对 AI 说：

```
在当前项目中下载云开发 AI 规则
```

## 🎯 开始使用

### 1. 选择 Builder with MCP

在 Trae 的智能体选择中选择 **Builder with MCP**。

### 2. 推荐模型

- **Claude/DeepSeek V3 0324**：推荐用于复杂项目开发
- **GPT-4**：适合通用开发任务

### 3. 登录云开发

```
登录云开发
```

### 4. 开始开发

```
创建一个在线教育平台，支持课程管理、视频播放、作业提交功能，使用云开发后端，最后部署
```

## 💡 使用技巧

### Builder with MCP 特性

- **智能架构设计**：AI 自动设计应用架构
- **代码生成**：生成完整的前后端代码
- **MCP 工具集成**：直接调用云开发 API
- **实时预览**：支持实时预览开发效果

### 开发工作流

```bash
# 完整应用开发
开发一个智能客服系统，包含：
- 多轮对话管理
- 知识库问答
- 工单系统
- 数据统计分析
- 部署到云开发

# 小程序开发
创建一个健身打卡小程序，包含运动记录、社区分享、数据统计功能

# API 服务
设计并实现一套完整的用户管理 API，包含注册、登录、权限控制
```

### 最佳实践

1. **详细需求描述**：提供完整的功能需求和技术要求
2. **分模块开发**：大型项目按模块逐步实现
3. **及时测试**：每个功能模块完成后进行测试
4. **迭代优化**：根据测试结果持续优化

## 📚 相关资源

- [Trae 官方网站](https://www.trae.ai/)
- [CloudBase AI ToolKit 首页](../index)
- [快速开始指南](../getting-started)

## 💬 技术支持

- 📖 查看 [常见问题 FAQ](../faq)
- 🐛 提交 [GitHub Issue](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/issues)
- 💬 加入微信技术交流群 