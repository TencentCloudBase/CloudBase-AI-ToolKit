# MCP 工具（自动生成）

当前包含 37 个工具。

源数据: `scripts/tools.json`

---

## 工具总览

| 名称 | 描述 |
|------|------|
| `login` | 登录云开发环境并选择要使用的环境 |
| `logout` | 退出云开发环境 |
| `envQuery` | 查询云开发环境相关信息，支持查询环境列表、当前环境信息和安全域名。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains，为兼容旧AI规则可继续使用这些名称） |
| `envDomainManagement` | 管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称） |
| `createCollection` | 管理云开发数据库集合：默认创建。可通过 action 指定 update。 |
| `collectionQuery` | 数据库集合的查询操作，支持检查存在性、查看详情、列表查询；并支持索引列表与检查。（兼容旧名称） |
| `updateCollection` | 更新云开发数据库集合配置（创建或删除索引） |
| `checkIndexExists` | 检查索引是否存在 |
| `insertDocuments` | 向云开发数据库集合中插入一个或多个文档（支持对象数组） |
| `queryDocuments` | 查询云开发数据库集合中的文档（支持对象参数） |
| `updateDocuments` | 更新云开发数据库集合中的文档（支持对象参数） |
| `deleteDocuments` | 删除云开发数据库集合中的文档（支持对象参数） |
| `manageDataModel` | 数据模型查询工具，支持查询和列表数据模型（只读操作）。list操作返回基础信息（不含Schema），get操作返回详细信息（含简化的Schema，包括字段列表、格式、关联关系等），docs操作生成SDK使用文档 |
| `modifyDataModel` | 基于Mermaid classDiagram创建或更新数据模型。支持创建新模型和更新现有模型结构。内置异步任务监控，自动轮询直至完成或超时。 |
| `getFunctionList` | 获取云函数列表或单个函数详情，通过 action 参数区分操作类型 |
| `createFunction` | 创建云函数 |
| `updateFunctionCode` | 更新函数代码 |
| `updateFunctionConfig` | 更新云函数配置 |
| `invokeFunction` | 调用云函数 |
| `getFunctionLogs` | 获取云函数日志基础信息（LogList），如需日志详情请用 RequestId 调用 getFunctionLogDetail 工具。此接口基于 manger-node 4.4.0+ 的 getFunctionLogsV2 实现，不返回具体日志内容。参数 offset+limit 不得大于 10000，startTime/endTime 间隔不得超过一天。 |
| `getFunctionLogDetail` | 根据 getFunctionLogs 返回的 RequestId 查询日志详情。参数 startTime、endTime、requestId，返回日志内容（LogJson 等）。仅支持 manger-node 4.4.0+。 |
| `manageFunctionTriggers` | 创建或删除云函数触发器，通过 action 参数区分操作类型 |
| `uploadFiles` | 上传文件到静态网站托管 |
| `getWebsiteConfig` | 获取静态网站托管配置 |
| `deleteFiles` | 删除静态网站托管的文件或文件夹 |
| `findFiles` | 搜索静态网站托管的文件 |
| `domainManagement` | 统一的域名管理工具，支持绑定、解绑、查询和修改域名配置 |
| `uploadFile` | 上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件） |
| `downloadTemplate` | 自动下载并部署CloudBase项目模板。

支持的模板:
- react: React + CloudBase 全栈应用模板
- vue: Vue + CloudBase 全栈应用模板
- miniprogram: 微信小程序 + 云开发模板  
- uniapp: UniApp + CloudBase 跨端应用模板
- rules: 只包含AI编辑器配置文件（包含Cursor、WindSurf、CodeBuddy等所有主流编辑器配置），适合在已有项目中补充AI编辑器配置

支持的IDE类型:
- all: 下载所有IDE配置（默认）
- cursor: Cursor AI编辑器
- windsurf: WindSurf AI编辑器
- codebuddy: CodeBuddy AI编辑器
- claude-code: Claude Code AI编辑器
- cline: Cline AI编辑器
- gemini-cli: Gemini CLI
- opencode: OpenCode AI编辑器
- qwen-code: 通义灵码
- baidu-comate: 百度Comate
- openai-codex-cli: OpenAI Codex CLI
- augment-code: Augment Code
- github-copilot: GitHub Copilot
- roocode: RooCode AI编辑器
- tongyi-lingma: 通义灵码
- trae: Trae AI编辑器
- vscode: Visual Studio Code

特别说明：
- rules 模板会自动包含当前 mcp 版本号信息（版本号：1.8.34），便于后续维护和版本追踪
- 下载 rules 模板时，如果项目中已存在 README.md 文件，系统会自动保护该文件不被覆盖（除非设置 overwrite=true） |
| `interactiveDialog` | 统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm |
| `searchWeb` | 使用联网来进行信息检索，如查询最新的新闻、文章、股价、天气等。支持自然语言查询，也可以直接输入网址获取网页内容 |
| `searchKnowledgeBase` | 云开发知识库智能检索工具，支持云开发与云函数知识的向量查询 |
| `createFunctionHTTPAccess` | 创建云函数的 HTTP 访问 |
| `downloadRemoteFile` | 下载远程文件到本地临时文件，返回一个系统的绝对路径 |
| `readSecurityRule` | 读取指定资源（数据库集合、云函数、存储桶）的安全规则和权限类别。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名） |
| `writeSecurityRule` | 设置指定资源（数据库集合、云函数、存储桶）的安全规则。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名）
- aclTag: 权限类别（READONLY/PRIVATE/ADMINWRITE/ADMINONLY/CUSTOM）
- rule: 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填 |
| `activateInviteCode` | 云开发 AI编程激励计划，通过邀请码激活用户激励。 |

---

## 详细规格

### `login`
登录云开发环境并选择要使用的环境

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `forceUpdate` | boolean |  | 是否强制重新选择环境 |  |  |


### `logout`
退出云开发环境

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `confirm` | string | 是 | 确认操作，默认传 yes | const "yes" |  |


### `envQuery`
查询云开发环境相关信息，支持查询环境列表、当前环境信息和安全域名。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains，为兼容旧AI规则可继续使用这些名称）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 查询类型：list=环境列表，info=当前环境信息，domains=安全域名列表 | "list", "info", "domains" |  |


### `envDomainManagement`
管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 操作类型：create=添加域名，delete=删除域名 | "create", "delete" |  |
| `domains` | array<string> | 是 | 安全域名数组 |  |  |


### `createCollection`
管理云开发数据库集合：默认创建。可通过 action 指定 update。

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string |  | 操作类型：create=创建(默认)，update=更新集合配置 | "create", "update" |  |
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `options` | object |  | 更新选项（action=update 时使用） |  |  |

- 详细字段（options）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `options.CreateIndexes` | array<object> |  |  |  |  |
| `options.DropIndexes` | array<object> |  |  |  |  |


### `collectionQuery`
数据库集合的查询操作，支持检查存在性、查看详情、列表查询；并支持索引列表与检查。（兼容旧名称）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 操作类型：check=检查是否存在，describe=查看详情，list=列表查询，index_list=索引列表，index_check=检查索引是否存在 | "check", "describe", "list", "index_list", "index_check" |  |
| `collectionName` | string |  | 集合名称（check、describe、index_list、index_check 操作时必填） |  |  |
| `indexName` | string |  | 索引名称（index_check 操作时必填） |  |  |
| `limit` | number |  | 返回数量限制（list操作时可选） |  |  |
| `offset` | number |  | 偏移量（list操作时可选） |  |  |


### `updateCollection`
更新云开发数据库集合配置（创建或删除索引）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `options` | object | 是 | 更新选项，支持创建和删除索引 |  |  |

- 详细字段（options）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `options.CreateIndexes` | array<object> |  |  |  |  |
| `options.DropIndexes` | array<object> |  |  |  |  |


### `checkIndexExists`
检查索引是否存在

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `indexName` | string | 是 | 索引名称 |  |  |


### `insertDocuments`
向云开发数据库集合中插入一个或多个文档（支持对象数组）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `documents` | array<object> | 是 | 要插入的文档对象数组，每个文档都是对象 |  |  |


### `queryDocuments`
查询云开发数据库集合中的文档（支持对象参数）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `query` | object \| string |  | 查询条件（对象或字符串，推荐对象） |  |  |
| `projection` | object \| string |  | 返回字段投影（对象或字符串，推荐对象） |  |  |
| `sort` | object \| string |  | 排序条件（对象或字符串，推荐对象） |  |  |
| `limit` | number |  | 返回数量限制 |  |  |
| `offset` | number |  | 跳过的记录数 |  |  |


### `updateDocuments`
更新云开发数据库集合中的文档（支持对象参数）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `query` | object \| string | 是 | 查询条件（对象或字符串，推荐对象） |  |  |
| `update` | object \| string | 是 | 更新内容（对象或字符串，推荐对象） |  |  |
| `isMulti` | boolean |  | 是否更新多条记录 |  |  |
| `upsert` | boolean |  | 是否在不存在时插入 |  |  |


### `deleteDocuments`
删除云开发数据库集合中的文档（支持对象参数）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `collectionName` | string | 是 | 云开发数据库集合名称 |  |  |
| `query` | object \| string | 是 | 查询条件（对象或字符串，推荐对象） |  |  |
| `isMulti` | boolean |  | 是否删除多条记录 |  |  |


### `manageDataModel`
数据模型查询工具，支持查询和列表数据模型（只读操作）。list操作返回基础信息（不含Schema），get操作返回详细信息（含简化的Schema，包括字段列表、格式、关联关系等），docs操作生成SDK使用文档

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 操作类型：get=查询单个模型（含Schema字段列表、格式、关联关系），list=获取模型列表（不含Schema），docs=生成SDK使用文档 | "get", "list", "docs" |  |
| `name` | string |  | 模型名称（get操作时必填） |  |  |
| `names` | array<string> |  | 模型名称数组（list操作时可选，用于过滤） |  |  |


### `modifyDataModel`
基于Mermaid classDiagram创建或更新数据模型。支持创建新模型和更新现有模型结构。内置异步任务监控，自动轮询直至完成或超时。

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `mermaidDiagram` | string | 是 | Mermaid classDiagram代码，描述数据模型结构。
示例：
classDiagram
    class Student {
        name: string <<姓名>>
        age: number = 18 <<年龄>>
        gender: x-enum = "男" <<性别>>
        classId: string <<班级ID>>
        identityId: string <<身份ID>>
        course: Course[] <<课程>>
        required() ["name"]
        unique() ["name"]
        enum_gender() ["男", "女"]
        display_field() "name"
    }
    class Class {
        className: string <<班级名称>>
        display_field() "className"
    }
    class Course {
        name: string <<课程名称>>
        students: Student[] <<学生>>
        display_field() "name"
    }
    class Identity {
        number: string <<证件号码>>
        display_field() "number"
    }

    %% 关联关系
    Student "1" --> "1" Identity : studentId
    Student "n" --> "1" Class : student2class
    Student "n" --> "m" Course : course
    Student "n" <-- "m" Course : students
    %% 类的命名
    note for Student "学生模型"
    note for Class "班级模型"
    note for Course "课程模型"
    note for Identity "身份模型"
 |  |  |
| `action` | string |  | 操作类型：create=创建新模型 | "create", "update" | "create" |
| `publish` | boolean |  | 是否立即发布模型 |  | false |
| `dbInstanceType` | string |  | 数据库实例类型 |  | "MYSQL" |


### `getFunctionList`
获取云函数列表或单个函数详情，通过 action 参数区分操作类型

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string |  | 操作类型：list=获取函数列表（默认），detail=获取函数详情 | "list", "detail" |  |
| `limit` | number |  | 范围（list 操作时使用） |  |  |
| `offset` | number |  | 偏移（list 操作时使用） |  |  |
| `name` | string |  | 函数名称（detail 操作时必需） |  |  |
| `codeSecret` | string |  | 代码保护密钥（detail 操作时使用） |  |  |


### `createFunction`
创建云函数

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `func` | object | 是 | 函数配置 |  |  |
| `functionRootPath` | string |  | 函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径，注意：不要包含函数名本身，例如函数名为 'hello'，应传入 '/path/to/cloudfunctions'，而不是 '/path/to/cloudfunctions/hello' |  |  |
| `force` | boolean | 是 | 是否覆盖 |  |  |

- 详细字段（func）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `func.name` | string |  | 函数名称 |  |  |
| `func.timeout` | number |  | 函数超时时间 |  |  |
| `func.envVariables` | object |  | 环境变量 |  |  |
| `func.vpc` | object |  | 私有网络配置 |  |  |
| `func.runtime` | string |  | 运行时环境,建议指定为 'Nodejs18.15'，其他可选值：Nodejs18.15，Nodejs16.13，Nodejs14.18，Nodejs12.16，Nodejs10.15，Nodejs8.9 |  |  |
| `func.triggers` | array<object> |  | Trigger configuration array |  |  |
| `func.handler` | string |  | 函数入口 |  |  |
| `func.ignore` | string \| array<string> |  | 忽略文件 |  |  |
| `func.isWaitInstall` | boolean |  | 是否等待依赖安装 |  |  |
| `func.layers` | array<object> |  | Layer配置 |  |  |


### `updateFunctionCode`
更新函数代码

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `name` | string | 是 | 函数名称 |  |  |
| `functionRootPath` | string | 是 | 函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径 |  |  |


### `updateFunctionConfig`
更新云函数配置

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `funcParam` | object | 是 | 函数配置 |  |  |

- 详细字段（funcParam）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `funcParam.name` | string |  | 函数名称 |  |  |
| `funcParam.timeout` | number |  | 超时时间 |  |  |
| `funcParam.envVariables` | object |  | 环境变量 |  |  |
| `funcParam.vpc` | object |  | VPC配置 |  |  |


### `invokeFunction`
调用云函数

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `name` | string | 是 | 函数名称 |  |  |
| `params` | object |  | 调用参数 |  |  |


### `getFunctionLogs`
获取云函数日志基础信息（LogList），如需日志详情请用 RequestId 调用 getFunctionLogDetail 工具。此接口基于 manger-node 4.4.0+ 的 getFunctionLogsV2 实现，不返回具体日志内容。参数 offset+limit 不得大于 10000，startTime/endTime 间隔不得超过一天。

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `name` | string | 是 | 函数名称 |  |  |
| `offset` | number |  | 数据的偏移量，Offset+Limit 不能大于 10000 |  |  |
| `limit` | number |  | 返回数据的长度，Offset+Limit 不能大于 10000 |  |  |
| `startTime` | string |  | 查询的具体日期，例如：2017-05-16 20:00:00，只能与 EndTime 相差一天之内 |  |  |
| `endTime` | string |  | 查询的具体日期，例如：2017-05-16 20:59:59，只能与 StartTime 相差一天之内 |  |  |
| `requestId` | string |  | 执行该函数对应的 requestId |  |  |
| `qualifier` | string |  | 函数版本，默认为 $LATEST |  |  |


### `getFunctionLogDetail`
根据 getFunctionLogs 返回的 RequestId 查询日志详情。参数 startTime、endTime、requestId，返回日志内容（LogJson 等）。仅支持 manger-node 4.4.0+。

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `startTime` | string |  | 查询的具体日期，例如：2017-05-16 20:00:00，只能与 EndTime 相差一天之内 |  |  |
| `endTime` | string |  | 查询的具体日期，例如：2017-05-16 20:59:59，只能与 StartTime 相差一天之内 |  |  |
| `requestId` | string | 是 | 执行该函数对应的 requestId |  |  |


### `manageFunctionTriggers`
创建或删除云函数触发器，通过 action 参数区分操作类型

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 操作类型：create=创建触发器，delete=删除触发器 | "create", "delete" |  |
| `name` | string | 是 | 函数名 |  |  |
| `triggers` | array<object> |  | 触发器配置数组（创建时必需） |  |  |
| `triggerName` | string |  | 触发器名称（删除时必需） |  |  |


### `uploadFiles`
上传文件到静态网站托管

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `localPath` | string |  | 本地文件或文件夹路径，需要是绝对路径，例如 /tmp/files/data.txt |  |  |
| `cloudPath` | string |  | 云端文件或文件夹路径，例如files/data.txt |  |  |
| `files` | array<object> |  | 多文件上传配置 |  | [] |
| `ignore` | string \| array<string> |  | 忽略文件模式 |  |  |


### `getWebsiteConfig`
获取静态网站托管配置

参数: 无参数


### `deleteFiles`
删除静态网站托管的文件或文件夹

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `cloudPath` | string | 是 | 云端文件或文件夹路径 |  |  |
| `isDir` | boolean |  | 是否为文件夹 |  | false |


### `findFiles`
搜索静态网站托管的文件

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `prefix` | string | 是 | 匹配前缀 |  |  |
| `marker` | string |  | 起始对象键标记 |  |  |
| `maxKeys` | number |  | 单次返回最大条目数 |  |  |


### `domainManagement`
统一的域名管理工具，支持绑定、解绑、查询和修改域名配置

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `action` | string | 是 | 操作类型: create=绑定域名, delete=解绑域名, check=查询域名配置, modify=修改域名配置 | "create", "delete", "check", "modify" |  |
| `domain` | string |  | 域名 |  |  |
| `certId` | string |  | 证书ID（绑定域名时必需） |  |  |
| `domains` | array<string> |  | 域名列表（查询配置时使用） |  |  |
| `domainId` | number |  | 域名ID（修改配置时必需） |  |  |
| `domainConfig` | object |  | 域名配置（修改配置时使用） |  |  |

- 详细字段（domainConfig）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `domainConfig.Refer` | object |  |  |  |  |
| `domainConfig.Cache` | array<object> |  |  |  |  |
| `domainConfig.IpFilter` | object |  |  |  |  |
| `domainConfig.IpFreqLimit` | object |  |  |  |  |


### `uploadFile`
上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `localPath` | string | 是 | 本地文件路径，建议传入绝对路径，例如 /tmp/files/data.txt |  |  |
| `cloudPath` | string | 是 | 云端文件路径，例如 files/data.txt |  |  |


### `downloadTemplate`
自动下载并部署CloudBase项目模板。

支持的模板:
- react: React + CloudBase 全栈应用模板
- vue: Vue + CloudBase 全栈应用模板
- miniprogram: 微信小程序 + 云开发模板  
- uniapp: UniApp + CloudBase 跨端应用模板
- rules: 只包含AI编辑器配置文件（包含Cursor、WindSurf、CodeBuddy等所有主流编辑器配置），适合在已有项目中补充AI编辑器配置

支持的IDE类型:
- all: 下载所有IDE配置（默认）
- cursor: Cursor AI编辑器
- windsurf: WindSurf AI编辑器
- codebuddy: CodeBuddy AI编辑器
- claude-code: Claude Code AI编辑器
- cline: Cline AI编辑器
- gemini-cli: Gemini CLI
- opencode: OpenCode AI编辑器
- qwen-code: 通义灵码
- baidu-comate: 百度Comate
- openai-codex-cli: OpenAI Codex CLI
- augment-code: Augment Code
- github-copilot: GitHub Copilot
- roocode: RooCode AI编辑器
- tongyi-lingma: 通义灵码
- trae: Trae AI编辑器
- vscode: Visual Studio Code

特别说明：
- rules 模板会自动包含当前 mcp 版本号信息（版本号：1.8.34），便于后续维护和版本追踪
- 下载 rules 模板时，如果项目中已存在 README.md 文件，系统会自动保护该文件不被覆盖（除非设置 overwrite=true）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `template` | string | 是 | 要下载的模板类型 | "react", "vue", "miniprogram", "uniapp", "rules" |  |
| `ide` | string |  | 指定要下载的IDE类型，默认为all（下载所有IDE配置） | "all", "cursor", "windsurf", "codebuddy", "claude-code", "cline", "gemini-cli", "opencode", "qwen-code", "baidu-comate", "openai-codex-cli", "augment-code", "github-copilot", "roocode", "tongyi-lingma", "trae", "vscode" | "all" |
| `overwrite` | boolean |  | 是否覆盖已存在的文件，默认为false（不覆盖） |  |  |


### `interactiveDialog`
统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `type` | string | 是 | 交互类型: clarify=需求澄清, confirm=任务确认 | "clarify", "confirm" |  |
| `message` | string |  | 对话消息内容 |  |  |
| `options` | array<string> |  | 可选的预设选项 |  |  |
| `forceUpdate` | boolean |  | 是否强制更新环境ID配置 |  |  |
| `risks` | array<string> |  | 操作风险提示 |  |  |


### `searchWeb`
使用联网来进行信息检索，如查询最新的新闻、文章、股价、天气等。支持自然语言查询，也可以直接输入网址获取网页内容

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `query` | string | 是 | 搜索关键词、问题或网址，支持自然语言 |  |  |


### `searchKnowledgeBase`
云开发知识库智能检索工具，支持云开发与云函数知识的向量查询

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `threshold` | number |  | 相似性检索阈值 |  | 0.5 |
| `id` | string | 是 | 知识库范围，cloudbase=云开发全量知识，scf=云开发的云函数知识, miniprogram=小程序知识（不包含云开发与云函数知识） | "cloudbase", "scf", "miniprogram" |  |
| `content` | string | 是 | 检索内容 |  |  |
| `options` | object |  | 其他选项 |  |  |
| `limit` | number |  | 指定返回最相似的 Top K 的 K 的值 |  | 5 |

- 详细字段（options）:

| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|------|------|------|------|-----------|--------|
| `options.chunkExpand` | array<number> |  | 指定返回的文档内容的展开长度,例如 [3,3]代表前后展开长度 |  | [3,3] |


### `createFunctionHTTPAccess`
创建云函数的 HTTP 访问

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `name` | string | 是 | 函数名 |  |  |
| `path` | string | 是 | HTTP 访问路径 |  |  |


### `downloadRemoteFile`
下载远程文件到本地临时文件，返回一个系统的绝对路径

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `url` | string | 是 | 远程文件的 URL 地址 |  |  |


### `readSecurityRule`
读取指定资源（数据库集合、云函数、存储桶）的安全规则和权限类别。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名）

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `resourceType` | string | 是 | 资源类型：database=数据库集合，function=云函数，storage=存储桶 | "database", "function", "storage" |  |
| `resourceId` | string | 是 | 资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。 |  |  |


### `writeSecurityRule`
设置指定资源（数据库集合、云函数、存储桶）的安全规则。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名）
- aclTag: 权限类别（READONLY/PRIVATE/ADMINWRITE/ADMINONLY/CUSTOM）
- rule: 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `resourceType` | string | 是 | 资源类型：database=数据库集合，function=云函数，storage=存储桶 | "database", "function", "storage" |  |
| `resourceId` | string | 是 | 资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。 |  |  |
| `aclTag` | string | 是 | 权限类别 | "READONLY", "PRIVATE", "ADMINWRITE", "ADMINONLY", "CUSTOM" |  |
| `rule` | string |  | 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填 |  |  |


### `activateInviteCode`
云开发 AI编程激励计划，通过邀请码激活用户激励。

参数

| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |
|--------|------|------|------|-----------|--------|
| `InviteCode` | string | 是 | 待激活的邀请码 |  |  |

