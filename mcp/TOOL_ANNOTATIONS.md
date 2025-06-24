# CloudBase MCP Server Tool Annotations

本文档记录了为 CloudBase MCP Server 实现的工具注解功能。

## 概述

为了符合 MCP (Model Context Protocol) 规范 (https://modelcontextprotocol.io/docs/concepts/tools.md)，我们实现了工具注解功能，提供工具元数据以帮助客户端更好地理解和使用工具。

## 实现方案

### 1. 注解接口定义
```typescript
interface ToolAnnotations {
  title?: string;           // 人类可读的工具标题
  readOnlyHint?: boolean;   // 工具是否只读（不修改环境）
  destructiveHint?: boolean; // 工具是否可能执行破坏性操作
  idempotentHint?: boolean; // 重复调用是否具有相同效果
  openWorldHint?: boolean;  // 工具是否与外部实体交互
}
```

### 2. 新API设计
```typescript
server.registerTool(name: string, config: ToolConfig, handler: any)

interface ToolConfig {
  title?: string;
  description?: string;
  inputSchema?: any;
  annotations?: ToolAnnotations;
}
```

### 3. 向前兼容性
- 保持现有 `server.tool()` 方法正常工作
- 新的 `registerTool` 方法为可选实现
- 当 MCP SDK 原生支持注解时，可以轻松迁移

## 已更新的工具

### 环境管理工具 (env.ts) - 8 个工具 ✅
1. **login** - 登录云开发
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
2. **logout** - 登出云开发
   - readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false
3. **listEnvs** - 获取环境列表
   - readOnlyHint: true, openWorldHint: true
4. **getEnvAuthDomains** - 获取环境安全域名
   - readOnlyHint: true, openWorldHint: true
5. **createEnvDomain** - 添加安全域名
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
6. **deleteEnvDomain** - 删除安全域名
   - readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true
7. **getEnvInfo** - 获取环境信息
   - readOnlyHint: true, openWorldHint: true
8. **updateEnvInfo** - 更新环境信息
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 静态托管工具 (hosting.ts) - 5 个工具 ✅
1. **uploadFiles** - 上传文件到静态托管
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
2. **getWebsiteConfig** - 获取静态托管配置
   - readOnlyHint: true, openWorldHint: true
3. **deleteFiles** - 删除静态托管文件
   - readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true
4. **findFiles** - 查找静态托管文件
   - readOnlyHint: true, openWorldHint: true
5. **domainManagement** - 静态托管域名管理
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 云函数工具 (functions.ts) - 3 个工具 ✅
1. **getFunctionList** - 获取云函数列表
   - readOnlyHint: true, openWorldHint: true
2. **createFunction** - 创建云函数
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
3. **updateFunctionCode** - 更新云函数代码
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 交互对话工具 (interactive.ts) - 1 个工具 ✅
1. **interactiveDialog** - 交互式对话
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false

### 下载工具 (download.ts) - 1 个工具 ✅
1. **downloadRemoteFile** - 下载远程文件
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 云存储工具 (storage.ts) - 1 个工具 ✅
1. **uploadFile** - 上传文件到云存储
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 网关工具 (gateway.ts) - 1 个工具 ✅
1. **createFunctionHTTPAccess** - 创建云函数HTTP访问
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 知识库工具 (rag.ts) - 1 个工具 ✅
1. **searchKnowledgeBase** - 云开发知识库检索
   - readOnlyHint: true, openWorldHint: true

### 文件工具 (file.ts) - 2 个工具 ✅
1. **createTempFile** - 创建临时文件
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false
2. **readTempFile** - 读取临时文件
   - readOnlyHint: true, openWorldHint: false

### 项目设置工具 (setup.ts) - 1 个工具 ✅
1. **downloadTemplate** - 下载项目模板
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true

### 数据库工具 (database.ts) - 10 个工具 ✅
1. **createCollection** - 创建数据库集合
   - readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true
2. **checkCollectionExists** - 检查集合是否存在
   - readOnlyHint: true, openWorldHint: true
3. **updateCollection** - 更新数据库集合
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
4. **describeCollection** - 查询集合详情
   - readOnlyHint: true, openWorldHint: true
5. **listCollections** - 获取集合列表
   - readOnlyHint: true, openWorldHint: true
6. **checkIndexExists** - 检查索引是否存在
   - readOnlyHint: true, openWorldHint: true
7. **distribution** - 查询数据分布
   - readOnlyHint: true, openWorldHint: true
8. **insertDocuments** - 插入文档
   - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
9. **queryDocuments** - 查询文档
   - readOnlyHint: true, openWorldHint: true
10. **updateDocuments** - 更新文档
    - readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true
11. **deleteDocuments** - 删除文档
    - readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true
12. **manageDataModel** - 数据模型管理
    - readOnlyHint: true, openWorldHint: true

## 📊 完成统计

### ✅ 全部完成
- **总计工具数**: 34 个
- **已完成文件**: 11 个
- **完成率**: 100% 🎉

所有 `/tools` 目录下的工具文件都已成功更新为使用新的 `registerTool` API 并添加了适当的工具注解！

## 注解设计原则

### readOnlyHint (只读提示)
- `true`: 查询操作，不修改系统状态
- `false`: 修改操作，会改变系统状态

### destructiveHint (破坏性提示)
- `true`: 删除操作或不可逆操作
- `false`: 非破坏性操作

### idempotentHint (幂等性提示)
- `true`: 重复调用具有相同效果
- `false`: 重复调用可能产生不同效果

### openWorldHint (开放世界提示)
- `true`: 与云端API或外部服务交互
- `false`: 仅本地或封闭环境操作

## 技术实现

1. **类型安全**: 使用TypeScript接口定义注解结构
2. **向前兼容**: 保持现有API不变，新增可选方法
3. **渐进式迁移**: 可以逐步将现有工具迁移到新API
4. **标准化**: 遵循MCP官方规范

## 后续计划

1. ✅ 完成所有工具文件的注解添加
2. 在 MCP SDK 官方支持注解后，移除自定义实现
3. 基于实际使用情况优化注解内容 