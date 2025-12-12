# 调用链分析

## 完整调用链

```
1. CLI 启动 (cli.ts)
   └─> const server = createCloudBaseMcpServer({ ide: "CodeBuddy" })
       └─> 返回 Promise<ExtendedMcpServer>
   
2. Server 创建 (server.ts)
   └─> await createCloudBaseMcpServer()
       ├─> 创建 ExtendedMcpServer 实例
       ├─> server.ide = "CodeBuddy"
       ├─> server.server = McpServer 内部实例（有 sendLoggingMessage）
       └─> await plugin.register(server)  // 注册所有插件
           └─> registerEnvTools(server)    // server 是 ExtendedMcpServer 实例
   
3. 工具注册 (env.ts)
   └─> registerEnvTools(server)  // server 是 ExtendedMcpServer 实例
       └─> server.registerTool("login", async handler)
           └─> handler 中调用: await _promptAndSetEnvironmentId(forceUpdate, { server })
               // 这里的 server 是闭包中的 ExtendedMcpServer 实例
   
4. 环境选择流程 (interactive.ts)
   └─> _promptAndSetEnvironmentId(autoSelectSingle, { server })
       ├─> const server = options?.server  // ExtendedMcpServer 实例
       ├─> const resolvedServer = server instanceof Promise ? await server : server
       │   └─> resolvedServer = server (因为 server 不是 Promise)
       ├─> const interactiveServer = getInteractiveServer(resolvedServer)
       │   └─> 更新或创建 InteractiveServer 实例，设置 this._mcpServer = resolvedServer
       └─> await interactiveServer.collectEnvId(..., resolvedServer)
           // 传递 resolvedServer (ExtendedMcpServer 实例)
   
5. InteractiveServer (interactive-server.ts)
   └─> collectEnvId(..., mcpServer)
       ├─> if (mcpServer) { this._mcpServer = mcpServer }
       └─> await openUrl(url, { wait: false }, this._mcpServer)
           // 使用 this._mcpServer
   
6. openUrl (interactive-server.ts)
   └─> openUrl(url, options, mcpServer)
       ├─> const currentIde = mcpServer?.ide || process.env.INTEGRATION_IDE
       ├─> const internalServer = mcpServer?.server
       └─> if (currentIde === "CodeBuddy" && internalServer?.sendLoggingMessage)
           └─> internalServer.sendLoggingMessage({ ... })
```

## 问题分析

从日志看：
- `[collectEnvId] this._mcpServer type: undefined` - 说明 `this._mcpServer` 是 `undefined`
- `[openUrl] mcpServer type: undefined` - 说明传递给 `openUrl` 的 `mcpServer` 是 `undefined`

**可能的原因：**
1. `collectEnvId` 的 `mcpServer` 参数是 `undefined`，所以 `this._mcpServer` 没有被更新
2. 或者 `this._mcpServer` 被更新了，但在调用 `openUrl` 时又变成了 `undefined`

**需要检查的点：**
1. `resolvedServer` 在 `_promptAndSetEnvironmentId` 中是否正确
2. `collectEnvId` 的 `mcpServer` 参数是否正确传递
3. `this._mcpServer` 在 `collectEnvId` 中是否被正确更新

