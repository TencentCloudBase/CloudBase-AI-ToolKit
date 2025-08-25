# 云托管（CloudRun）使用指南

云托管让你可以轻松部署和运行各种后端服务，支持长连接、文件上传、多语言等场景。这个插件已经默认启用，你只需要用自然语言告诉 AI 你想要做什么。

## 什么时候用云托管？

当你需要：
- **实时通信**：WebSocket、SSE、流式响应
- **长任务**：后台处理
- **多语言**：Java、Go、PHP、Python、Node.js 等

## 两种模式怎么选？

**函数型**：推荐新手，支持 Node.js,内置 WebSocket 支持，可以本地运行调试，端口固定 3000

**容器型**：适合已有项目，支持任意语言，需要提供 Dockerfile

## 快速开始

### 1. 查看有什么模板
```
请列出可用的云托管模板
```

### 2. 创建新项目
```
用 helloworld 模板创建一个名为 my-service 的项目
```

### 3. 本地运行（函数型）
```
在本地运行 my-service，端口 3000
```

### 4. 部署到云端
```
部署 my-service，开启公网访问，CPU 0.5 核，内存 1GB
```

## 常见场景

### 小程序后端
```
创建一个支持 WebSocket 的函数型服务，用于小程序聊天功能
```

### Java Spring Boot 应用
```
部署一个 Spring Boot 应用，提供 REST API 服务
```

### Go 微服务
```
用 Go 创建一个高性能的微服务，处理用户认证
```

### Python 数据处理
```
部署一个 Python 服务，定时处理数据并生成报表
```

### PHP Laravel 应用
```
部署一个 Laravel 应用，提供完整的 Web 后台管理
```

## 访问你的服务

部署完成后，你可以通过以下方式访问：

**小程序直接调用**（推荐）：
```js
const res = await wx.cloud.callContainer({
  config: { env: "your-env-id" },
  path: "/api/data",
  method: "POST",
  header: { "X-WX-SERVICE": "my-service" }
});
```

**Web 应用**：
```js
import cloudbase from "@cloudbase/js-sdk";
const app = cloudbase.init({ env: "your-env-id" });
const res = await app.callContainer({
  name: "my-service",
  method: "GET",
  path: "/health"
});
```

**直接 HTTP 访问**：
```bash
curl https://your-service-domain.com
```