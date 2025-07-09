import { z } from "zod";
import { ExtendedMcpServer } from '../server.js';

// 1. 枚举定义
const KnowledgeBaseEnum = z.enum(["cloudbase", "scf", "miniprogram"]);
// 2. 枚举到后端 id 的映射
const KnowledgeBaseIdMap: Record<z.infer<typeof KnowledgeBaseEnum>, string> = {
  cloudbase: "ykfzskv4_ad28",
  scf: "scfsczskzyws_4bdc",
  miniprogram: "xcxzskws_25d8",
};

// 安全 JSON.parse
function safeParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}

// 安全 JSON.stringify，处理循环引用
function safeStringify(obj: any) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return;
        seen.add(value);
      }
      return value;
    });
  } catch (e) {
    return "";
  }
}

export function registerRagTools(server: ExtendedMcpServer) {
    // 联网搜索
    server.registerTool?.(
        'searchWeb',
        {
            title: "联网搜索",
            description: '使用联网来进行信息检索，如查询最新的新闻、文章、股价、天气等。支持自然语言查询，也可以直接输入网址获取网页内容',
            inputSchema: {
                query: z.string().describe("搜索关键词、问题或网址，支持自然语言")
            },
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                category: "web"
            }
        },
        async ({ query }: { query: string }) => {
            try {
                // 使用混元进行联网搜索
                const signInRes = await fetch('https://tcb-advanced-a656fc.api.tcloudbasegateway.com/auth/v1/signin/anonymously', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'x-device-id': 'cloudbase-ai-toolkit'
                    },
                    body: safeStringify({})
                });
                const { access_token } = await signInRes.json();

                // 调用混元API进行联网搜索
                const searchRes = await fetch('https://tcb-advanced-a656fc.api.tcloudbasegateway.com/v1/ai/hunyuan-beta/openapi/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    body: safeStringify({
                        model: 'hunyuan',
                        messages: [
                            {
                                role: 'user',
                                content: `你好，你将扮演一个知识库的角色，联网查询到问题的答案之后回答给我`
                            },
                            {
                                role: 'assistant',
                                content: '好的'
                            },
                            {
                                role: 'user',
                                content: query
                            }
                        ],
                        enable_enhancement: true,
                        search_info: true,
                        enable_speed_search: true,
                        force_search_enhancement: true
                    })
                });

                const result = await searchRes.json();

                if (result.error) {
                    throw new Error(result.error.message || '联网搜索失败');
                }

                const content = result.choices?.[0]?.message?.content || '';
                const searchResults = result.search_info?.search_results || [];

                return {
                    content: [{
                        type: "text",
                        text: safeStringify({
                            type: "web_search",
                            content: content,
                            search_results: searchResults.map((item: any) => ({
                                title: item.title,
                                url: item.url,
                                snippet: item.snippet
                            })),
                            status: "success"
                        })
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: safeStringify({
                            type: "error",
                            message: error instanceof Error ? error.message : '联网搜索失败',
                            status: "error"
                        })
                    }]
                };
            }
        }
    );

    // 知识库检索
    server.registerTool?.(
        'searchKnowledgeBase',
        {
            title: "云开发知识库检索",
            description: '云开发知识库智能检索工具，支持云开发与云函数知识的向量查询',
            inputSchema: {
                threshold: z.number().default(0.5).optional().describe("相似性检索阈值"),
                id: KnowledgeBaseEnum.describe("知识库范围，cloudbase=云开发全量知识，scf=云开发的云函数知识, miniprogram=小程序知识（不包含云开发与云函数知识）"),
                content: z.string().describe("检索内容"),
                options: z.object({
                    chunkExpand: z.array(z.number()).min(2).max(2).default([3, 3]).describe("指定返回的文档内容的展开长度,例如 [3,3]代表前后展开长度"),
                }).optional().describe("其他选项"),
                limit: z.number().default(5).optional().describe("指定返回最相似的 Top K 的 K 的值")
            },
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                category: "rag"
            }
        },
        async ({
            id,
            content,
            options: {
                chunkExpand = [3, 3]
            } = {},
            limit = 5,
            threshold = 0.5
        }: {
            id: string;
            content: string;
            options?: { chunkExpand?: number[] };
            limit?: number;
            threshold?: number;
        }) => {
            // 枚举到后端 id 映射
            const backendId = KnowledgeBaseIdMap[id as keyof typeof KnowledgeBaseIdMap] || id;
            const signInRes = await fetch('https://tcb-advanced-a656fc.api.tcloudbasegateway.com/auth/v1/signin/anonymously',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'x-device-id': 'cloudbase-ai-toolkit'
                },
                body: safeStringify({
                    collectionView: backendId,
                    options: {
                        chunkExpand
                    },
                    search: {
                        content: content,
                        limit
                    }
                })
            })
            const token = (await signInRes.json()).access_token
            const res = await fetch(`https://tcb-advanced-a656fc.api.tcloudbasegateway.com/v1/knowledge/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: safeStringify({
                    collectionView: backendId,
                    options: {
                        chunkExpand
                    },
                    search: {
                        content: content,
                        limit
                    }
                })
            })
            const result = await res.json()

            if (result.code) {
                throw new Error(result.message)
            }

            return {
                content: [{
                    type: "text",
                    text: safeStringify(result.data.documents
                        .filter((item: any) => item.score >= threshold)
                        .map((item: any) => {
                            return {
                                score: item.score,
                                fileTile: item.documentSet.fileTitle,
                                url: safeParse(item.documentSet.fileMetaData).url,
                                paragraphTitle: item.data.paragraphTitle,
                                text:`${item.data.pre?.join('\n') || ''}
    ${item.data.text}
    ${item.data.next?.join('\n') || ''}`,
                            }
                        })
                    )
                }]
            }
        }
    );
}