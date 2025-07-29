# 小程序插件

小程序插件提供了微信小程序开发和部署的完整工具链支持，包括代码上传、预览、构建等功能。

## 配置

### 环境变量

```bash
# 设置小程序代码上传密钥（二选一）
export MINIPROGRAM_PRIVATE_KEY="私钥内容"
# 或者
export MINIPROGRAM_PRIVATE_KEY_PATH="/path/to/private.key"

# 启用小程序插件
export CLOUDBASE_MCP_PLUGINS_ENABLED="env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
```

### MCP 配置

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["npm-global-exec@latest", "@cloudbase/cloudbase-mcp@latest"],
      "env": {
        "MINIPROGRAM_PRIVATE_KEY": "你的小程序私钥",
        "CLOUDBASE_MCP_PLUGINS_ENABLED": "env,database,functions,hosting,storage,setup,interactive,rag,gateway,download,miniprogram"
      }
    }
  }
}
```

## 工具

### uploadMiniprogramCode

上传小程序代码到微信平台

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `version`: 版本号
- `desc`: 版本描述（可选）
- `setting`: 编译设置（可选）
- `robot`: 机器人编号 1-30（可选）
- `type`: 项目类型 miniProgram/miniGame（可选）

### previewMiniprogramCode

预览小程序代码并生成二维码

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `desc`: 预览描述（可选）
- `setting`: 编译设置（可选）
- `robot`: 机器人编号 1-30（可选）
- `type`: 项目类型 miniProgram/miniGame（可选）
- `qrcodeFormat`: 二维码格式 image/base64/terminal（可选）
- `qrcodeOutputDest`: 二维码输出路径（可选）
- `pagePath`: 预览页面路径（可选）
- `searchQuery`: 预览页面参数（可选）

### buildMiniprogramNpm

构建小程序 npm 包

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `type`: 项目类型 miniProgram/miniGame（可选）
- `robot`: 机器人编号 1-30（可选）

### getMiniprogramProjectConfig

获取小程序项目配置

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `type`: 项目类型 miniProgram/miniGame（可选）

### getMiniprogramSourceMap

获取最近上传版本的 SourceMap，用于生产环境错误调试

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `robot`: 指定使用哪一个 ci 机器人，1-30
- `sourceMapSavePath`: SourceMap 保存路径
- `type`: 项目类型 miniProgram/miniGame（可选）

### checkMiniprogramCodeQuality

检查小程序代码质量，生成质量报告（需要 miniprogram-ci 1.9.11+）

**参数：**
- `appId`: 小程序 appId
- `projectPath`: 项目路径
- `saveReportPath`: 质量报告保存路径
- `type`: 项目类型 miniProgram/miniGame（可选）

### packMiniprogramNpmManually

自定义 node_modules 位置的小程序 npm 构建，支持复杂项目结构

**参数：**
- `packageJsonPath`: 希望被构建的 node_modules 对应的 package.json 的路径
- `miniprogramNpmDistDir`: 被构建 miniprogram_npm 的目标位置
- `ignores`: 指定需要排除的规则（可选）

## 使用场景

### 开发流程

1. **构建依赖**
   ```
   调用 buildMiniprogramNpm 构建 npm 包
   调用 packMiniprogramNpmManually 自定义构建复杂项目结构
   ```

2. **预览测试**
   ```
   调用 previewMiniprogramCode 生成预览二维码
   ```

3. **发布上线**
   ```
   调用 uploadMiniprogramCode 上传代码到微信平台
   ```

4. **调试优化**
   ```
   调用 getMiniprogramSourceMap 获取 SourceMap 进行错误调试
   调用 checkMiniprogramCodeQuality 检查代码质量并生成报告
   ```

### 密钥配置

使用此插件前，需要在微信公众平台配置：

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"管理-开发管理-开发设置-小程序代码上传"
3. 生成「代码上传密钥」
4. 配置 IP 白名单（推荐开启）

## 注意事项

- 代码上传密钥拥有预览、上传代码的权限
- 密钥不会明文存储在微信公众平台上
- 密钥一旦遗失必须重置，请妥善保管
- 建议开启 IP 白名单以降低安全风险

## 常见问题

### Q: 如何获取小程序 appId？
A: 在微信公众平台的小程序管理页面可以查看到 appId。

### Q: 机器人编号有什么作用？
A: 机器人编号用于区分不同的上传任务，可以设置 1-30 之间的数字。

### Q: 支持哪些编译设置？
A: 支持 ES6/ES7 转换、代码压缩、WXSS 压缩等常见编译选项。

### Q: SourceMap 有什么作用？
A: SourceMap 用于生产环境错误调试，可以将压缩后的代码错误映射回原始代码位置，便于问题定位。

### Q: 代码质量检查包含哪些内容？
A: 包含代码规范、性能问题、潜在 bug、可优化项等多维度的质量分析，生成详细的质量报告。

### Q: 何时需要使用自定义 npm 构建？
A: 当项目有特殊的目录结构、需要自定义 node_modules 位置或有特殊的构建需求时使用。