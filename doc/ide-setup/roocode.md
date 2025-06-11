# 云开发 + RooCode 配置指南

> 💡 **为什么选择这个配置？**  
> RooCode 是一款专业的 AI 编程助手，支持 VS Code 集成。通过配置 CloudBase AI ToolKit，可以实现云端开发的智能化体验，特别适合追求轻量级工具和简洁开发体验的个人开发者。

## 🚀 快速配置

### 配置 MCP

```json
{
    "mcpServers": {
        "cloudbase": {
            "command": "npx",
            "args": [
                "@cloudbase/cloudbase-mcp@latest"
            ],
            "disabled": false
        }
    }
}
```

### 配置 AI 规则

创建 `.roo/rules/cloudbase.md` 或对 AI 说：

```
在当前项目中下载云开发 AI 规则
```

## 🎯 开始使用

```
登录云开发
```

```
创建一个任务管理应用，支持团队协作，使用云数据库存储，最后部署
```

## 📚 相关资源

- [RooCode 官网](https://roocode.com/)
- [CloudBase AI ToolKit 首页](../index) 