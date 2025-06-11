# 云开发 + 文心快码配置指南

> 💡 **为什么选择这个配置？**  
> 文心快码是百度推出的 AI 编程助手，支持多种 IDE 平台。通过配置 CloudBase AI ToolKit，可以实现高效的云端应用开发

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

创建 `.comate/rules/cloudbase.md` 或对 AI 说：

```
在当前项目中下载云开发 AI 规则
```

## 🎯 开始使用

### 切换到 Zulu 模式

在对话窗口中切换到 Zulu 模式进行操作。

```
登录云开发
```

```
创建一个在线考试系统，支持题库管理、考试监控、成绩统计，使用云数据库，最后部署
```

## 📚 相关资源

- [文心快码官网](https://comate.baidu.com/)
- [CloudBase AI ToolKit 首页](../index) 