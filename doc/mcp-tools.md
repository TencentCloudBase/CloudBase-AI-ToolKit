# MCP 工具

当前包含 37 个工具。

源数据: [tools.json](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/scripts/tools.json)

---

## 工具总览

<table>
<thead><tr><th>名称</th><th>描述</th></tr></thead>
<tbody>
<tr><td><code>login</code></td><td>登录云开发环境并选择要使用的环境</td></tr>
<tr><td><code>logout</code></td><td>退出云开发环境</td></tr>
<tr><td><code>envQuery</code></td><td>查询云开发环境相关信息，支持查询环境列表、当前环境信息和安全域名。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains，为兼容旧AI规则可继续使用这些名称）</td></tr>
<tr><td><code>envDomainManagement</code></td><td>管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称）</td></tr>
<tr><td><code>createCollection</code></td><td>管理云开发数据库集合：默认创建。可通过 action 指定 update。</td></tr>
<tr><td><code>collectionQuery</code></td><td>数据库集合的查询操作，支持检查存在性、查看详情、列表查询；并支持索引列表与检查。（兼容旧名称）</td></tr>
<tr><td><code>updateCollection</code></td><td>更新云开发数据库集合配置（创建或删除索引）</td></tr>
<tr><td><code>checkIndexExists</code></td><td>检查索引是否存在</td></tr>
<tr><td><code>insertDocuments</code></td><td>向云开发数据库集合中插入一个或多个文档（支持对象数组）</td></tr>
<tr><td><code>queryDocuments</code></td><td>查询云开发数据库集合中的文档（支持对象参数）</td></tr>
<tr><td><code>updateDocuments</code></td><td>更新云开发数据库集合中的文档（支持对象参数）</td></tr>
<tr><td><code>deleteDocuments</code></td><td>删除云开发数据库集合中的文档（支持对象参数）</td></tr>
<tr><td><code>manageDataModel</code></td><td>数据模型查询工具，支持查询和列表数据模型（只读操作）。list操作返回基础信息（不含Schema），get操作返回详细信息（含简化的Schema，包括字段列表、格式、关联关系等），docs操作生成SDK使用文档</td></tr>
<tr><td><code>modifyDataModel</code></td><td>基于Mermaid classDiagram创建或更新数据模型。支持创建新模型和更新现有模型结构。内置异步任务监控，自动轮询直至完成或超时。</td></tr>
<tr><td><code>getFunctionList</code></td><td>获取云函数列表或单个函数详情，通过 action 参数区分操作类型</td></tr>
<tr><td><code>createFunction</code></td><td>创建云函数</td></tr>
<tr><td><code>updateFunctionCode</code></td><td>更新函数代码</td></tr>
<tr><td><code>updateFunctionConfig</code></td><td>更新云函数配置</td></tr>
<tr><td><code>invokeFunction</code></td><td>调用云函数</td></tr>
<tr><td><code>getFunctionLogs</code></td><td>获取云函数日志基础信息（LogList），如需日志详情请用 RequestId 调用 getFunctionLogDetail 工具。此接口基于 manger-node 4.4.0+ 的 getFunctionLogsV2 实现，不返回具体日志内容。参数 offset+limit 不得大于 10000，startTime/endTime 间隔不得超过一天。</td></tr>
<tr><td><code>getFunctionLogDetail</code></td><td>根据 getFunctionLogs 返回的 RequestId 查询日志详情。参数 startTime、endTime、requestId，返回日志内容（LogJson 等）。仅支持 manger-node 4.4.0+。</td></tr>
<tr><td><code>manageFunctionTriggers</code></td><td>创建或删除云函数触发器，通过 action 参数区分操作类型</td></tr>
<tr><td><code>uploadFiles</code></td><td>上传文件到静态网站托管</td></tr>
<tr><td><code>getWebsiteConfig</code></td><td>获取静态网站托管配置</td></tr>
<tr><td><code>deleteFiles</code></td><td>删除静态网站托管的文件或文件夹</td></tr>
<tr><td><code>findFiles</code></td><td>搜索静态网站托管的文件</td></tr>
<tr><td><code>domainManagement</code></td><td>统一的域名管理工具，支持绑定、解绑、查询和修改域名配置</td></tr>
<tr><td><code>uploadFile</code></td><td>上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件）</td></tr>
<tr><td><code>downloadTemplate</code></td><td>自动下载并部署CloudBase项目模板。&lt;br/&gt;支持的模板:&lt;br/&gt;- react: React + CloudBase 全栈应用模板&lt;br/&gt;- vue: Vue + CloudBase 全栈应用模板&lt;br/&gt;- miniprogram: 微信小程序 + 云开发模板  &lt;br/&gt;- uniapp: UniApp + CloudBase 跨端应用模板&lt;br/&gt;- rules: 只包含AI编辑器配置文件（包含Cursor、WindSurf、CodeBuddy等所有主流编辑器配置），适合在已有项目中补充AI编辑器配置&lt;br/&gt;支持的IDE类型:&lt;br/&gt;- all: 下载所有IDE配置（默认）&lt;br/&gt;- cursor: Cursor AI编辑器&lt;br/&gt;- windsurf: WindSurf AI编辑器&lt;br/&gt;- codebuddy: CodeBuddy AI编辑器&lt;br/&gt;- claude-code: Claude Code AI编辑器&lt;br/&gt;- cline: Cline AI编辑器&lt;br/&gt;- gemini-cli: Gemini CLI&lt;br/&gt;- opencode: OpenCode AI编辑器&lt;br/&gt;- qwen-code: 通义灵码&lt;br/&gt;- baidu-comate: 百度Comate&lt;br/&gt;- openai-codex-cli: OpenAI Codex CLI&lt;br/&gt;- augment-code: Augment Code&lt;br/&gt;- github-copilot: GitHub Copilot&lt;br/&gt;- roocode: RooCode AI编辑器&lt;br/&gt;- tongyi-lingma: 通义灵码&lt;br/&gt;- trae: Trae AI编辑器&lt;br/&gt;- vscode: Visual Studio Code&lt;br/&gt;特别说明：&lt;br/&gt;- rules 模板会自动包含当前 mcp 版本号信息（版本号：1.8.34），便于后续维护和版本追踪&lt;br/&gt;- 下载 rules 模板时，如果项目中已存在 README.md 文件，系统会自动保护该文件不被覆盖（除非设置 overwrite=true）</td></tr>
<tr><td><code>interactiveDialog</code></td><td>统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm</td></tr>
<tr><td><code>searchWeb</code></td><td>使用联网来进行信息检索，如查询最新的新闻、文章、股价、天气等。支持自然语言查询，也可以直接输入网址获取网页内容</td></tr>
<tr><td><code>searchKnowledgeBase</code></td><td>云开发知识库智能检索工具，支持云开发与云函数知识的向量查询</td></tr>
<tr><td><code>createFunctionHTTPAccess</code></td><td>创建云函数的 HTTP 访问</td></tr>
<tr><td><code>downloadRemoteFile</code></td><td>下载远程文件到本地临时文件，返回一个系统的绝对路径</td></tr>
<tr><td><code>readSecurityRule</code></td><td>读取指定资源（数据库集合、云函数、存储桶）的安全规则和权限类别。&lt;br/&gt;参数说明：&lt;br/&gt;- resourceType: 资源类型（database/function/storage）&lt;br/&gt;- resourceId: 资源唯一标识（集合名/函数名/桶名）</td></tr>
<tr><td><code>writeSecurityRule</code></td><td>设置指定资源（数据库集合、云函数、存储桶）的安全规则。&lt;br/&gt;参数说明：&lt;br/&gt;- resourceType: 资源类型（database/function/storage）&lt;br/&gt;- resourceId: 资源唯一标识（集合名/函数名/桶名）&lt;br/&gt;- aclTag: 权限类别（READONLY/PRIVATE/ADMINWRITE/ADMINONLY/CUSTOM）&lt;br/&gt;- rule: 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填</td></tr>
<tr><td><code>activateInviteCode</code></td><td>云开发 AI编程激励计划，通过邀请码激活用户激励。</td></tr>
</tbody>
</table>

---

## 详细规格

### `login`
登录云开发环境并选择要使用的环境

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>forceUpdate</code></td><td>boolean</td><td></td><td>是否强制重新选择环境</td></tr>
</tbody>
</table>

---

### `logout`
退出云开发环境

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>confirm</code></td><td>string</td><td>是</td><td>确认操作，默认传 yes 可填写的值: const "yes"</td></tr>
</tbody>
</table>

---

### `envQuery`
查询云开发环境相关信息，支持查询环境列表、当前环境信息和安全域名。（原工具名：listEnvs/getEnvInfo/getEnvAuthDomains，为兼容旧AI规则可继续使用这些名称）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>查询类型：list=环境列表，info=当前环境信息，domains=安全域名列表 可填写的值: "list", "info", "domains"</td></tr>
</tbody>
</table>

---

### `envDomainManagement`
管理云开发环境的安全域名，支持添加和删除操作。（原工具名：createEnvDomain/deleteEnvDomain，为兼容旧AI规则可继续使用这些名称）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>操作类型：create=添加域名，delete=删除域名 可填写的值: "create", "delete"</td></tr>
<tr><td><code>domains</code></td><td>array of string</td><td>是</td><td>安全域名数组</td></tr>
</tbody>
</table>

---

### `createCollection`
管理云开发数据库集合：默认创建。可通过 action 指定 update。

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td></td><td>操作类型：create=创建(默认)，update=更新集合配置 可填写的值: "create", "update"</td></tr>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>options</code></td><td>object</td><td></td><td>更新选项（action=update 时使用）</td></tr>
<tr><td><code>options.CreateIndexes</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>options.CreateIndexes[].IndexName</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema</code></td><td>object</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIsUnique</code></td><td>boolean</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys</code></td><td>array of object</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys[].Name</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys[].Direction</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.DropIndexes</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>options.DropIndexes[].IndexName</code></td><td>string</td><td>是</td><td></td></tr>
</tbody>
</table>

---

### `collectionQuery`
数据库集合的查询操作，支持检查存在性、查看详情、列表查询；并支持索引列表与检查。（兼容旧名称）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>操作类型：check=检查是否存在，describe=查看详情，list=列表查询，index_list=索引列表，index_check=检查索引是否存在 可填写的值: "check", "describe", "list", "index_list", "index_check"</td></tr>
<tr><td><code>collectionName</code></td><td>string</td><td></td><td>集合名称（check、describe、index_list、index_check 操作时必填）</td></tr>
<tr><td><code>indexName</code></td><td>string</td><td></td><td>索引名称（index_check 操作时必填）</td></tr>
<tr><td><code>limit</code></td><td>number</td><td></td><td>返回数量限制（list操作时可选）</td></tr>
<tr><td><code>offset</code></td><td>number</td><td></td><td>偏移量（list操作时可选）</td></tr>
</tbody>
</table>

---

### `updateCollection`
更新云开发数据库集合配置（创建或删除索引）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>options</code></td><td>object</td><td>是</td><td>更新选项，支持创建和删除索引</td></tr>
<tr><td><code>options.CreateIndexes</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>options.CreateIndexes[].IndexName</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema</code></td><td>object</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIsUnique</code></td><td>boolean</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys</code></td><td>array of object</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys[].Name</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.CreateIndexes[].MgoKeySchema.MgoIndexKeys[].Direction</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>options.DropIndexes</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>options.DropIndexes[].IndexName</code></td><td>string</td><td>是</td><td></td></tr>
</tbody>
</table>

---

### `checkIndexExists`
检查索引是否存在

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>indexName</code></td><td>string</td><td>是</td><td>索引名称</td></tr>
</tbody>
</table>

---

### `insertDocuments`
向云开发数据库集合中插入一个或多个文档（支持对象数组）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>documents</code></td><td>array of object</td><td>是</td><td>要插入的文档对象数组，每个文档都是对象</td></tr>
</tbody>
</table>

---

### `queryDocuments`
查询云开发数据库集合中的文档（支持对象参数）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>query</code></td><td>object \| string</td><td></td><td>查询条件（对象或字符串，推荐对象）</td></tr>
<tr><td><code>projection</code></td><td>object \| string</td><td></td><td>返回字段投影（对象或字符串，推荐对象）</td></tr>
<tr><td><code>sort</code></td><td>object \| string</td><td></td><td>排序条件（对象或字符串，推荐对象）</td></tr>
<tr><td><code>limit</code></td><td>number</td><td></td><td>返回数量限制</td></tr>
<tr><td><code>offset</code></td><td>number</td><td></td><td>跳过的记录数</td></tr>
</tbody>
</table>

---

### `updateDocuments`
更新云开发数据库集合中的文档（支持对象参数）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>query</code></td><td>object \| string</td><td>是</td><td>查询条件（对象或字符串，推荐对象）</td></tr>
<tr><td><code>update</code></td><td>object \| string</td><td>是</td><td>更新内容（对象或字符串，推荐对象）</td></tr>
<tr><td><code>isMulti</code></td><td>boolean</td><td></td><td>是否更新多条记录</td></tr>
<tr><td><code>upsert</code></td><td>boolean</td><td></td><td>是否在不存在时插入</td></tr>
</tbody>
</table>

---

### `deleteDocuments`
删除云开发数据库集合中的文档（支持对象参数）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>collectionName</code></td><td>string</td><td>是</td><td>云开发数据库集合名称</td></tr>
<tr><td><code>query</code></td><td>object \| string</td><td>是</td><td>查询条件（对象或字符串，推荐对象）</td></tr>
<tr><td><code>isMulti</code></td><td>boolean</td><td></td><td>是否删除多条记录</td></tr>
</tbody>
</table>

---

### `manageDataModel`
数据模型查询工具，支持查询和列表数据模型（只读操作）。list操作返回基础信息（不含Schema），get操作返回详细信息（含简化的Schema，包括字段列表、格式、关联关系等），docs操作生成SDK使用文档

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>操作类型：get=查询单个模型（含Schema字段列表、格式、关联关系），list=获取模型列表（不含Schema），docs=生成SDK使用文档 可填写的值: "get", "list", "docs"</td></tr>
<tr><td><code>name</code></td><td>string</td><td></td><td>模型名称（get操作时必填）</td></tr>
<tr><td><code>names</code></td><td>array of string</td><td></td><td>模型名称数组（list操作时可选，用于过滤）</td></tr>
</tbody>
</table>

---

### `modifyDataModel`
基于Mermaid classDiagram创建或更新数据模型。支持创建新模型和更新现有模型结构。内置异步任务监控，自动轮询直至完成或超时。

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>mermaidDiagram</code></td><td>string</td><td>是</td><td>Mermaid classDiagram代码，描述数据模型结构。&lt;br/&gt;示例：&lt;br/&gt;classDiagram&lt;br/&gt;    class Student {&lt;br/&gt;        name: string &lt;&lt;姓名&gt;&gt;&lt;br/&gt;        age: number = 18 &lt;&lt;年龄&gt;&gt;&lt;br/&gt;        gender: x-enum = "男" &lt;&lt;性别&gt;&gt;&lt;br/&gt;        classId: string &lt;&lt;班级ID&gt;&gt;&lt;br/&gt;        identityId: string &lt;&lt;身份ID&gt;&gt;&lt;br/&gt;        course: Course[] &lt;&lt;课程&gt;&gt;&lt;br/&gt;        required() ["name"]&lt;br/&gt;        unique() ["name"]&lt;br/&gt;        enum_gender() ["男", "女"]&lt;br/&gt;        display_field() "name"&lt;br/&gt;    }&lt;br/&gt;    class Class {&lt;br/&gt;        className: string &lt;&lt;班级名称&gt;&gt;&lt;br/&gt;        display_field() "className"&lt;br/&gt;    }&lt;br/&gt;    class Course {&lt;br/&gt;        name: string &lt;&lt;课程名称&gt;&gt;&lt;br/&gt;        students: Student[] &lt;&lt;学生&gt;&gt;&lt;br/&gt;        display_field() "name"&lt;br/&gt;    }&lt;br/&gt;    class Identity {&lt;br/&gt;        number: string &lt;&lt;证件号码&gt;&gt;&lt;br/&gt;        display_field() "number"&lt;br/&gt;    }&lt;br/&gt;    %% 关联关系&lt;br/&gt;    Student "1" --&gt; "1" Identity : studentId&lt;br/&gt;    Student "n" --&gt; "1" Class : student2class&lt;br/&gt;    Student "n" --&gt; "m" Course : course&lt;br/&gt;    Student "n" &lt;-- "m" Course : students&lt;br/&gt;    %% 类的命名&lt;br/&gt;    note for Student "学生模型"&lt;br/&gt;    note for Class "班级模型"&lt;br/&gt;    note for Course "课程模型"&lt;br/&gt;    note for Identity "身份模型"&lt;br/&gt;</td></tr>
<tr><td><code>action</code></td><td>string</td><td></td><td>操作类型：create=创建新模型 可填写的值: "create", "update"；默认值: "create"</td></tr>
<tr><td><code>publish</code></td><td>boolean</td><td></td><td>是否立即发布模型 默认值: false</td></tr>
<tr><td><code>dbInstanceType</code></td><td>string</td><td></td><td>数据库实例类型 默认值: "MYSQL"</td></tr>
</tbody>
</table>

---

### `getFunctionList`
获取云函数列表或单个函数详情，通过 action 参数区分操作类型

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td></td><td>操作类型：list=获取函数列表（默认），detail=获取函数详情 可填写的值: "list", "detail"</td></tr>
<tr><td><code>limit</code></td><td>number</td><td></td><td>范围（list 操作时使用）</td></tr>
<tr><td><code>offset</code></td><td>number</td><td></td><td>偏移（list 操作时使用）</td></tr>
<tr><td><code>name</code></td><td>string</td><td></td><td>函数名称（detail 操作时必需）</td></tr>
<tr><td><code>codeSecret</code></td><td>string</td><td></td><td>代码保护密钥（detail 操作时使用）</td></tr>
</tbody>
</table>

---

### `createFunction`
创建云函数

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>func</code></td><td>object</td><td>是</td><td>函数配置</td></tr>
<tr><td><code>func.name</code></td><td>string</td><td>是</td><td>函数名称</td></tr>
<tr><td><code>func.timeout</code></td><td>number</td><td></td><td>函数超时时间</td></tr>
<tr><td><code>func.envVariables</code></td><td>object</td><td></td><td>环境变量</td></tr>
<tr><td><code>func.vpc</code></td><td>object</td><td></td><td>私有网络配置</td></tr>
<tr><td><code>func.vpc.vpcId</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>func.vpc.subnetId</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>func.runtime</code></td><td>string</td><td></td><td>运行时环境,建议指定为 'Nodejs18.15'，其他可选值：Nodejs18.15，Nodejs16.13，Nodejs14.18，Nodejs12.16，Nodejs10.15，Nodejs8.9</td></tr>
<tr><td><code>func.triggers</code></td><td>array of object</td><td></td><td>Trigger configuration array</td></tr>
<tr><td><code>func.triggers[].name</code></td><td>string</td><td>是</td><td>Trigger name</td></tr>
<tr><td><code>func.triggers[].type</code></td><td>string</td><td>是</td><td>Trigger type, currently only supports 'timer' 可填写的值: "timer"</td></tr>
<tr><td><code>func.triggers[].config</code></td><td>string</td><td>是</td><td>Trigger configuration. For timer triggers, use cron expression format: second minute hour day month week year. IMPORTANT: Must include exactly 7 fields (second minute hour day month week year). Examples: '0 0 2 1 * * *' (monthly), '0 30 9 * * * *' (daily at 9:30 AM)</td></tr>
<tr><td><code>func.handler</code></td><td>string</td><td></td><td>函数入口</td></tr>
<tr><td><code>func.ignore</code></td><td>string \| array of string</td><td></td><td>忽略文件</td></tr>
<tr><td><code>func.isWaitInstall</code></td><td>boolean</td><td></td><td>是否等待依赖安装</td></tr>
<tr><td><code>func.layers</code></td><td>array of object</td><td></td><td>Layer配置</td></tr>
<tr><td><code>func.layers[].name</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>func.layers[].version</code></td><td>number</td><td>是</td><td></td></tr>
<tr><td><code>functionRootPath</code></td><td>string</td><td></td><td>函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径，注意：不要包含函数名本身，例如函数名为 'hello'，应传入 '/path/to/cloudfunctions'，而不是 '/path/to/cloudfunctions/hello'</td></tr>
<tr><td><code>force</code></td><td>boolean</td><td>是</td><td>是否覆盖</td></tr>
</tbody>
</table>

---

### `updateFunctionCode`
更新函数代码

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>name</code></td><td>string</td><td>是</td><td>函数名称</td></tr>
<tr><td><code>functionRootPath</code></td><td>string</td><td>是</td><td>函数根目录（云函数目录的父目录），这里需要传操作系统上文件的绝对路径</td></tr>
</tbody>
</table>

---

### `updateFunctionConfig`
更新云函数配置

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>funcParam</code></td><td>object</td><td>是</td><td>函数配置</td></tr>
<tr><td><code>funcParam.name</code></td><td>string</td><td>是</td><td>函数名称</td></tr>
<tr><td><code>funcParam.timeout</code></td><td>number</td><td></td><td>超时时间</td></tr>
<tr><td><code>funcParam.envVariables</code></td><td>object</td><td></td><td>环境变量</td></tr>
<tr><td><code>funcParam.vpc</code></td><td>object</td><td></td><td>VPC配置</td></tr>
<tr><td><code>funcParam.vpc.vpcId</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>funcParam.vpc.subnetId</code></td><td>string</td><td>是</td><td></td></tr>
</tbody>
</table>

---

### `invokeFunction`
调用云函数

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>name</code></td><td>string</td><td>是</td><td>函数名称</td></tr>
<tr><td><code>params</code></td><td>object</td><td></td><td>调用参数</td></tr>
</tbody>
</table>

---

### `getFunctionLogs`
获取云函数日志基础信息（LogList），如需日志详情请用 RequestId 调用 getFunctionLogDetail 工具。此接口基于 manger-node 4.4.0+ 的 getFunctionLogsV2 实现，不返回具体日志内容。参数 offset+limit 不得大于 10000，startTime/endTime 间隔不得超过一天。

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>name</code></td><td>string</td><td>是</td><td>函数名称</td></tr>
<tr><td><code>offset</code></td><td>number</td><td></td><td>数据的偏移量，Offset+Limit 不能大于 10000</td></tr>
<tr><td><code>limit</code></td><td>number</td><td></td><td>返回数据的长度，Offset+Limit 不能大于 10000</td></tr>
<tr><td><code>startTime</code></td><td>string</td><td></td><td>查询的具体日期，例如：2017-05-16 20:00:00，只能与 EndTime 相差一天之内</td></tr>
<tr><td><code>endTime</code></td><td>string</td><td></td><td>查询的具体日期，例如：2017-05-16 20:59:59，只能与 StartTime 相差一天之内</td></tr>
<tr><td><code>requestId</code></td><td>string</td><td></td><td>执行该函数对应的 requestId</td></tr>
<tr><td><code>qualifier</code></td><td>string</td><td></td><td>函数版本，默认为 $LATEST</td></tr>
</tbody>
</table>

---

### `getFunctionLogDetail`
根据 getFunctionLogs 返回的 RequestId 查询日志详情。参数 startTime、endTime、requestId，返回日志内容（LogJson 等）。仅支持 manger-node 4.4.0+。

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>startTime</code></td><td>string</td><td></td><td>查询的具体日期，例如：2017-05-16 20:00:00，只能与 EndTime 相差一天之内</td></tr>
<tr><td><code>endTime</code></td><td>string</td><td></td><td>查询的具体日期，例如：2017-05-16 20:59:59，只能与 StartTime 相差一天之内</td></tr>
<tr><td><code>requestId</code></td><td>string</td><td>是</td><td>执行该函数对应的 requestId</td></tr>
</tbody>
</table>

---

### `manageFunctionTriggers`
创建或删除云函数触发器，通过 action 参数区分操作类型

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>操作类型：create=创建触发器，delete=删除触发器 可填写的值: "create", "delete"</td></tr>
<tr><td><code>name</code></td><td>string</td><td>是</td><td>函数名</td></tr>
<tr><td><code>triggers</code></td><td>array of object</td><td></td><td>触发器配置数组（创建时必需）</td></tr>
<tr><td><code>triggers[].name</code></td><td>string</td><td>是</td><td>Trigger name</td></tr>
<tr><td><code>triggers[].type</code></td><td>string</td><td>是</td><td>Trigger type, currently only supports 'timer' 可填写的值: "timer"</td></tr>
<tr><td><code>triggers[].config</code></td><td>string</td><td>是</td><td>Trigger configuration. For timer triggers, use cron expression format: second minute hour day month week year. IMPORTANT: Must include exactly 7 fields (second minute hour day month week year). Examples: '0 0 2 1 * * *' (monthly), '0 30 9 * * * *' (daily at 9:30 AM)</td></tr>
<tr><td><code>triggerName</code></td><td>string</td><td></td><td>触发器名称（删除时必需）</td></tr>
</tbody>
</table>

---

### `uploadFiles`
上传文件到静态网站托管

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>localPath</code></td><td>string</td><td></td><td>本地文件或文件夹路径，需要是绝对路径，例如 /tmp/files/data.txt</td></tr>
<tr><td><code>cloudPath</code></td><td>string</td><td></td><td>云端文件或文件夹路径，例如files/data.txt</td></tr>
<tr><td><code>files</code></td><td>array of object</td><td></td><td>多文件上传配置 默认值: []</td></tr>
<tr><td><code>files[].localPath</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>files[].cloudPath</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>ignore</code></td><td>string \| array of string</td><td></td><td>忽略文件模式</td></tr>
</tbody>
</table>

---

### `getWebsiteConfig`
获取静态网站托管配置

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td colspan="4">无</td></tr>
</tbody>
</table>

---

### `deleteFiles`
删除静态网站托管的文件或文件夹

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>cloudPath</code></td><td>string</td><td>是</td><td>云端文件或文件夹路径</td></tr>
<tr><td><code>isDir</code></td><td>boolean</td><td></td><td>是否为文件夹 默认值: false</td></tr>
</tbody>
</table>

---

### `findFiles`
搜索静态网站托管的文件

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>prefix</code></td><td>string</td><td>是</td><td>匹配前缀</td></tr>
<tr><td><code>marker</code></td><td>string</td><td></td><td>起始对象键标记</td></tr>
<tr><td><code>maxKeys</code></td><td>number</td><td></td><td>单次返回最大条目数</td></tr>
</tbody>
</table>

---

### `domainManagement`
统一的域名管理工具，支持绑定、解绑、查询和修改域名配置

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>action</code></td><td>string</td><td>是</td><td>操作类型: create=绑定域名, delete=解绑域名, check=查询域名配置, modify=修改域名配置 可填写的值: "create", "delete", "check", "modify"</td></tr>
<tr><td><code>domain</code></td><td>string</td><td></td><td>域名</td></tr>
<tr><td><code>certId</code></td><td>string</td><td></td><td>证书ID（绑定域名时必需）</td></tr>
<tr><td><code>domains</code></td><td>array of string</td><td></td><td>域名列表（查询配置时使用）</td></tr>
<tr><td><code>domainId</code></td><td>number</td><td></td><td>域名ID（修改配置时必需）</td></tr>
<tr><td><code>domainConfig</code></td><td>object</td><td></td><td>域名配置（修改配置时使用）</td></tr>
<tr><td><code>domainConfig.Refer</code></td><td>object</td><td></td><td></td></tr>
<tr><td><code>domainConfig.Refer.Switch</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Refer.RefererRules</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>domainConfig.Refer.RefererRules[].RefererType</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Refer.RefererRules[].Referers</code></td><td>array of string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Refer.RefererRules[].AllowEmpty</code></td><td>boolean</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Cache</code></td><td>array of object</td><td></td><td></td></tr>
<tr><td><code>domainConfig.Cache[].RuleType</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Cache[].RuleValue</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.Cache[].CacheTtl</code></td><td>number</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.IpFilter</code></td><td>object</td><td></td><td></td></tr>
<tr><td><code>domainConfig.IpFilter.Switch</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.IpFilter.FilterType</code></td><td>string</td><td></td><td></td></tr>
<tr><td><code>domainConfig.IpFilter.Filters</code></td><td>array of string</td><td></td><td></td></tr>
<tr><td><code>domainConfig.IpFreqLimit</code></td><td>object</td><td></td><td></td></tr>
<tr><td><code>domainConfig.IpFreqLimit.Switch</code></td><td>string</td><td>是</td><td></td></tr>
<tr><td><code>domainConfig.IpFreqLimit.Qps</code></td><td>number</td><td></td><td></td></tr>
</tbody>
</table>

---

### `uploadFile`
上传文件到云存储（区别于静态网站托管，云存储更适合存储业务数据文件）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>localPath</code></td><td>string</td><td>是</td><td>本地文件路径，建议传入绝对路径，例如 /tmp/files/data.txt</td></tr>
<tr><td><code>cloudPath</code></td><td>string</td><td>是</td><td>云端文件路径，例如 files/data.txt</td></tr>
</tbody>
</table>

---

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

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>template</code></td><td>string</td><td>是</td><td>要下载的模板类型 可填写的值: "react", "vue", "miniprogram", "uniapp", "rules"</td></tr>
<tr><td><code>ide</code></td><td>string</td><td></td><td>指定要下载的IDE类型，默认为all（下载所有IDE配置） 可填写的值: "all", "cursor", "windsurf", "codebuddy", "claude-code", "cline", "gemini-cli", "opencode", "qwen-code", "baidu-comate", "openai-codex-cli", "augment-code", "github-copilot", "roocode", "tongyi-lingma", "trae", "vscode"；默认值: "all"</td></tr>
<tr><td><code>overwrite</code></td><td>boolean</td><td></td><td>是否覆盖已存在的文件，默认为false（不覆盖）</td></tr>
</tbody>
</table>

---

### `interactiveDialog`
统一的交互式对话工具，支持需求澄清和任务确认，当需要和用户确认下一步的操作的时候，可以调用这个工具的clarify，如果有敏感的操作，需要用户确认，可以调用这个工具的confirm

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>type</code></td><td>string</td><td>是</td><td>交互类型: clarify=需求澄清, confirm=任务确认 可填写的值: "clarify", "confirm"</td></tr>
<tr><td><code>message</code></td><td>string</td><td></td><td>对话消息内容</td></tr>
<tr><td><code>options</code></td><td>array of string</td><td></td><td>可选的预设选项</td></tr>
<tr><td><code>forceUpdate</code></td><td>boolean</td><td></td><td>是否强制更新环境ID配置</td></tr>
<tr><td><code>risks</code></td><td>array of string</td><td></td><td>操作风险提示</td></tr>
</tbody>
</table>

---

### `searchWeb`
使用联网来进行信息检索，如查询最新的新闻、文章、股价、天气等。支持自然语言查询，也可以直接输入网址获取网页内容

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>query</code></td><td>string</td><td>是</td><td>搜索关键词、问题或网址，支持自然语言</td></tr>
</tbody>
</table>

---

### `searchKnowledgeBase`
云开发知识库智能检索工具，支持云开发与云函数知识的向量查询

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>threshold</code></td><td>number</td><td></td><td>相似性检索阈值 默认值: 0.5</td></tr>
<tr><td><code>id</code></td><td>string</td><td>是</td><td>知识库范围，cloudbase=云开发全量知识，scf=云开发的云函数知识, miniprogram=小程序知识（不包含云开发与云函数知识） 可填写的值: "cloudbase", "scf", "miniprogram"</td></tr>
<tr><td><code>content</code></td><td>string</td><td>是</td><td>检索内容</td></tr>
<tr><td><code>options</code></td><td>object</td><td></td><td>其他选项</td></tr>
<tr><td><code>options.chunkExpand</code></td><td>array of number</td><td></td><td>指定返回的文档内容的展开长度,例如 [3,3]代表前后展开长度 默认值: [3,3]</td></tr>
<tr><td><code>limit</code></td><td>number</td><td></td><td>指定返回最相似的 Top K 的 K 的值 默认值: 5</td></tr>
</tbody>
</table>

---

### `createFunctionHTTPAccess`
创建云函数的 HTTP 访问

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>name</code></td><td>string</td><td>是</td><td>函数名</td></tr>
<tr><td><code>path</code></td><td>string</td><td>是</td><td>HTTP 访问路径</td></tr>
</tbody>
</table>

---

### `downloadRemoteFile`
下载远程文件到本地临时文件，返回一个系统的绝对路径

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>url</code></td><td>string</td><td>是</td><td>远程文件的 URL 地址</td></tr>
</tbody>
</table>

---

### `readSecurityRule`
读取指定资源（数据库集合、云函数、存储桶）的安全规则和权限类别。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名）

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>resourceType</code></td><td>string</td><td>是</td><td>资源类型：database=数据库集合，function=云函数，storage=存储桶 可填写的值: "database", "function", "storage"</td></tr>
<tr><td><code>resourceId</code></td><td>string</td><td>是</td><td>资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。</td></tr>
</tbody>
</table>

---

### `writeSecurityRule`
设置指定资源（数据库集合、云函数、存储桶）的安全规则。

参数说明：
- resourceType: 资源类型（database/function/storage）
- resourceId: 资源唯一标识（集合名/函数名/桶名）
- aclTag: 权限类别（READONLY/PRIVATE/ADMINWRITE/ADMINONLY/CUSTOM）
- rule: 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>resourceType</code></td><td>string</td><td>是</td><td>资源类型：database=数据库集合，function=云函数，storage=存储桶 可填写的值: "database", "function", "storage"</td></tr>
<tr><td><code>resourceId</code></td><td>string</td><td>是</td><td>资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。</td></tr>
<tr><td><code>aclTag</code></td><td>string</td><td>是</td><td>权限类别 可填写的值: "READONLY", "PRIVATE", "ADMINWRITE", "ADMINONLY", "CUSTOM"</td></tr>
<tr><td><code>rule</code></td><td>string</td><td></td><td>自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填</td></tr>
</tbody>
</table>

---

### `activateInviteCode`
云开发 AI编程激励计划，通过邀请码激活用户激励。

#### 参数

<table>
<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>InviteCode</code></td><td>string</td><td>是</td><td>待激活的邀请码</td></tr>
</tbody>
</table>

---
