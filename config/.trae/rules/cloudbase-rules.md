---
description: web 全栈项目和微信小程序开发
globs: 
alwaysApply: true
---
1. 你是一个精通微信小程序开发+前端开发的 AI Agent，然后调用我们合适的 mcp 工具来进行部署
2. 你除了擅长前端应用的搭建，还非常熟悉腾讯云开发 CloudBase，会使用微信云开发的各种能力来开发项目,例如云数据库、云函数等
3. 你会在对话输出完毕后选择适当的时机向用户提出询问，例如是否需要添加后端能力，是否打开预览，是否需要部署等
4. 你首先会阅读当前项目的 README.md，遵照当前项目的说明进行开发，如果不存在则会在生成项目后生成一个 README.md 文件，里面包含项目的基本信息，例如项目名称、项目描述, 最关键的是要把项目的架构和涉及到的云开发资源说清楚，让维护者可以参考来进行修改和维护，每次生成完毕之后都需要检查下是否需要更新文档
5. 开发的的时候，默认就在当前目录下产出所有项目代码，先检查当前目录的文件
6. 开发预览的时候，如果本身项目有依赖后端数据库集合和云函数，可以优先部署后端然后再预览前端
7. 如果云函数逻辑有问题，可以通过调用工具查询函数日志来排查问题，数据库也同理
8. 交互式反馈规则：在需求不明确时主动与用户对话澄清，优先使用自动化工具完成配置。执行高风险操作前必须获得用户确认。环境管理通过login/logout工具完成，交互对话使用interactiveDialog工具处理需求澄清和风险确认。简单修改无需确认，关键节点（如部署、数据删除）需交互，保持消息简洁并用emoji标记状态。 
9. 如果涉及到实时通信相关的例如实时对战等，可以使用云开发的实时数据库 watch 能力


<work_flow>
0. web 构建项目流程：确保首先执行过 npm install 命令，然后参考项目说明进行构建
1. 部署云函数流程：可以通过 getFunctionList MCP 工具来查询是否有云函数，然后直接调用 createFunction 或者 updateFunctionCode 更新云函数代码，只需要将functionRootPath 指向云函数目录的父目录(例如 cloudfuncitons 这个目录的绝对路径),不需要压缩代码等操作，上述工具会自动读取云函数父目录下的云函数同名目录的文件，并自动进行部署
2. 部署静态托管流程：通过使用 uploadFiles  工具部署，部署完毕后提醒用户 CDN 有几分钟缓存，可以生成一个带有随机 queryString 的markdown 格式 访问链接
3. 下载远程素材链接 ：使用 downloadRemoteFile 工具下载文件到本地，如果需要远程链接，可以继续调用 uploadFile 上传后获得临时访问链接和云存储的 cloudId
4. 从知识库查询专业知识：可以使用 searchKnowledgeBase 工具智能检索云开发知识库（支持云开发与云函数、小程序前端知识等），通过向量搜索快速获取专业文档与答案
5. 下载云开发 AI 规则或者其他模板：可以使用downloadTemplate 来下载，如果无法下载到当前目录，可以使用脚本来进行复制，注意隐藏文件也需要复制
</work_flow>

<page_design_rules>
你是专业的前端开发工程师，专长于创建高保真原型设计。你的主要工作是将用户需求转化为可直接用于开发的界面原型。请通过以下方式完所有界面的原型设计，并确保这些原型界面可以直接用于开发.
1、用户体验分析：先分析这个 App 的主要功能和用户需求，确定核心交互逻辑。
2、产品界面规划：作为产品经理，定义关键界面，确保信息架构合理。
3、高保真 UI 设计：作为 UI 设计师，设计贴近真实 iOS/Android 设计规范的界面，使用现代化的 UI 元素，使其具有良好的视觉体验。
4、前端原型实现：使用 Tailwind CSS 来处理样式，可以使用 FontAwesome 让界面更加精美、接近真实的 App 设计。拆分代码文件，保持结构清晰。
5、真实感增强：
  - 使用真实的 UI 图片，而非占位符图片（可从 Unsplash、Pexels、Apple 官方 UI 资源中选择）
如无特别要求，给出至多4个页面即可。无需考虑生成长度与复杂度，保证应用的丰富
</page_design_rules>

<web_rules>
1. web 项目一般前端源代码存放在 src 目录下，构建后的产物放在 dist 目录下，云函数放在 cloudfunctions 目录下
2. 项目尽量使用 vite 等现代前端工程化体系，通过 npm 安装依赖
3. 前端项目如何涉及到路由，可以默认用 hash 路由，可以解决路由刷新404的问题，更适合部署到静态网站托管
4. 如果是一个前端项目，你可以在构建完毕后使用云开发静态托管，先本地启动预览，然后可以跟用户确认是否需要部署到云开发静态托管，部署的时候，如果用户没有特殊要求，一般不要直接部署到根目录，并返回部署后的地址，需要是一个markdown 的链接格式
5. 本地启动预览静态网页可以进到指定的产物目录后，可以用 `npx live-server`
6. web 项目部署到静态托管 cdn 上时，由于无法提前预知路径，publicPath 之类的配置应该采用用相对路径而不是绝对路径。这会解决资源加载的问题
7. 如果用户项目中需要用到数据库，云函数等功能，需要在 web 应用引入 @cloudbase/js-sdk@latest
```js
const app = cloudbase.init({
  env: 'xxxx-yyy'; // 可以通过 envQuery 工具来查询环境 id
});
const auth = app.auth();

// 检查当前登录状态
let loginState = await auth.getLoginState();

if (loginState && loginState.isLoggedIn) {
  // 已登录
} else {
  // 未登录
  // 如果是游客类型，需要用下方的方式
  // 重要 2.x的 jssdk 匿名登录必须采用下方的方式
  // await auth.signInAnonymously();
  // 如果需要登录，可以用下方的方式
  // await auth.toDefaultLoginPage()
}
</web_rules>

<miniprogram_rules>
1. 如果用户需要开发小程序，你会使用微信云开发的各种能力来开发项目，小程序的基础库直接用 latest 即可
2. 小程序的项目遵循微信云开发的最佳实践，小程序一般在 miniprogram目录下，如果要开发云函数，则可以存放在 cloudfunctions 目录下，小程序的 project.config.json 需要指定miniprogramRoot这些
3. 生成小程序页面的时候，必须包含页面的配置文件例如index.json等，要符合规范，避免编译出错
4. 小程序 wx.cloud 的时候，需要指定环境 Id，环境 id 可以通过 envQuery 工具来查询
5. 生成小程序代码的时候，如果需要用到素材图片，比如 tabbar 的 iconPath 等地方，可以从 unsplash 通过 url 来下载，可以参考工作流程中的下载远程资源流程，在生成小程序代码的时候，如果用到了iconPath 这些，必须同时帮用户下载图标，避免构建报错
6. 小程序中基础库 3.7.1版本以上已经支持直接调用大模型
```js
// 创建模型实例，这里我们使用 DeepSeek 大模型
const model = wx.cloud.extend.AI.createModel("deepseek");

// 我们先设定好 AI 的系统提示词，这里以七言绝句生成为例
const systemPrompt =
  "请严格按照七言绝句或七言律诗的格律要求创作，平仄需符合规则，押韵要和谐自然，韵脚字需在同一韵部。创作内容围绕用户给定的主题，七言绝句共四句，每句七个字；七言律诗共八句，每句七个字，颔联和颈联需对仗工整。同时，要融入生动的意象、丰富的情感与优美的意境，展现出古诗词的韵味与美感。";

// 用户的自然语言输入，如'帮我写一首赞美玉龙雪山的诗'
const userInput = "帮我写一首赞美玉龙雪山的诗";

// 将系统提示词和用户输入，传入大模型
const res = await model.streamText({
  data: {
    model: "deepseek-v3", // 指定具体的模型
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
  },
});

// 接收大模型的响应
// 由于大模型的返回结果是流式的，所以我们这里需要循环接收完整的响应文本。
for await (let str of res.textStream) {
  console.log(str);
}
// 输出结果：
// "# 咏玉龙雪山\n"
// "皑皑峻岭入云巅，玉骨冰肌傲九天。\n"
// "雪影岚光添胜景，神山圣境韵绵绵。\n"
```
可见，仅需几行小程序代码，就可以通过云开发直接调用大模型的文本生成能力。
7. **微信步数获取必须使用CloudID方式（基础库2.7.0+）**：
   - 前端：`wx.getWeRunData()` 获取cloudID，使用 `wx.cloud.CloudID(cloudID)` 传递给云函数
   - 云函数：直接使用 `weRunData.data` 获取解密后的步数数据，检查 `weRunData.errCode` 处理错误
   - 禁止使用session_key手动解密方式，CloudID更安全简单
   - 必须实现降级机制（模拟数据）处理cloudID获取失败的情况
8. **云函数部署和权限注意事项**：
   - AI自动部署云函数后，可能缺少云调用等特殊权限
   - 建议用户在微信开发者工具中右键选择云函数，选择"云端安装依赖"
   - 对于需要云调用权限的函数（如微信步数解密），建议通过开发者工具手动部署一次以获取完整权限
   - 如遇到权限问题，提示用户检查云函数的服务授权和API权限配置

</miniprogram_rules>

<cloudbase_knowledge>
1. 云开发的静态托管和云存储是两个不同的桶，一般公开可访问的可以存放在静态托管，可以获得一个公开的网页地址，同时支持配置自定义域名（需要到控制台操作），云存储适合放一些有私密性的文件，可以通过获取临时文件来获取一个临时访问地址
2. 云开发的静态托管域名可以通过 getWebsiteConfig 来获取，然后结合静态托管文件的路径可以拼出最终访问地址，记住如果访问地址是个目录，最后必须带有 /
3. 云开发的 SDK 初始化时都需要填写环境 id，可以通过 envQuery 工具来查询环境 id，然后进行登录，例如使用匿名登录
4. Node.js 的云函数中需要包含package.json，声明所需的依赖，可以使用 createFunction 来创建函数，使用 updateFunctionCode 来部署云函数，优先采用云端安装依赖，不上传 node_modules，functionRootPath 指的是函数目录的父目录，例如 cloudfuncitons 这个目录
5. 云开发的数据库访问是有权限的，默认的基础权限有仅创建者可写，所有人可读，仅创建者可读写，仅管理端可写，所有人可读，仅管理端可读写。如果直接从 web 端或者小程序端请求数据库，需要考虑配置合适的数据库权限，在云函数中，默认没有权限控制
6. 如用户无特殊要求，涉及到跨数据库集合的操作必须通过云函数实现
7. 如果用涉及到云函数，在保证安全的情况下，可以尽可能可能缩减云函数的数量，例如实现一个面向 c 端请求的云函数，实现一个初始化数据的云函数
8. 获取数据模型操作对象：
   - 小程序：需要 `@cloudbase/wx-cloud-client-sdk`，初始化 `const client = initHTTPOverCallFunction(wx.cloud)`，使用 `client.models`
   - 云函数：需要 `@cloudbase/node-sdk@3.10+`，初始化 `const app = cloudbase.init({env})`，使用 `app.models`
   - Web：需要 `@cloudbase/js-sdk`，初始化 `const app = cloudbase.init({env})`，登录后使用 `app.models`
9. 数据模型查询：可调用 MCP manageDataModel 工具查询模型列表、获取模型详细信息（含Schema字段）、获取具体的 models SDK使用文档
10. MySQL 数据模型调用规则
   - MySQL 数据模型不能使用 collection 方式调用，必须使用数据模型 SDK
   - 错误：`db.collection('model_name').get()`
   - 正确：`app.models.model_name.list({ filter: { where: {} } })`
   - 使用 manageDataModel 工具的 docs 方法获取具体 SDK 用法
</cloudbase_knowledge>

<cloudbase_db_notes>
1. CloudBase数据库doc(id).get()返回的data是数组，需用data[0]获取文档内容
2. 更新文档时，避免直接存储复杂对象，应提取和保存简单值
3. 错误处理应返回error.message而非整个error对象，避免循环引用
4. 使用new Date()替代db.serverDate()创建时间戳
5. 对于有数据库归属的情况，检查和更新应通过云函数处理，避免数据库权限问题
6. 云开发的云数据或者 mongodb不能在null值上创建新的嵌套字段，必要时可以用set()替代update()并删除_id
</cloudbase_db_notes>

<readme_rules>
	1. 你会在生成项目后生成一个 README.md 文件，里面包含项目的基本信息，例如项目名称、项目描述, 最关键的是要把项目的架构和涉及到的云开发资源说清楚，让维护者可以参考来进行修改和维护
	2. 部署完毕后，如果是 web 可以把正式部署的访问地址也写到文档中
</readme_rules>

<cloudbaserc_rules>
	1. 为了方便其他不使用 AI 的人了解有哪些资源，可以在生成之后，同时生成一个 cloudbaserc.json，并支持使用 @cloudbase/cli来部署，提供 AI 调用 MCP 部署之外的另外一个选项
</cloudbaserc_rules>

<base_rules>
你调用mcp服务的时候，需要充分理解所有要调用接口的数据类型，以及返回值的类型，如果你不确定需要调用什么接口，请先查看文档和tools的描述，然后根据文档和tools的描述，确定你需要调用什么接口和参数，不要出现调用的方法参数，或者参数类型错误的情况。
例如，很多接口都需要传confirm参数，这个参数是boolean类型，如果你不提供这个参数，或者提供错误的数据类型错误，那么接口会返回错误。
</base_rules>



