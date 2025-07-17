import { z } from "zod";
import { getCloudBaseManager, getEnvId } from '../cloudbase-manager.js';
import { ExtendedMcpServer } from '../server.js';

/**
 * 权限类别（AclTag）
 * - READONLY：所有用户可读，仅创建者和管理员可写
 * - PRIVATE：仅创建者及管理员可读写
 * - ADMINWRITE：所有用户可读，仅管理员可写
 * - ADMINONLY：仅管理员可读写
 * - CUSTOM：自定义安全规则（需传 rule 字段）
 */
export type AclTag = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY' | 'CUSTOM';

/**
 * 资源类型（resourceType）
 * - database：数据库集合
 * - function：云函数
 * - storage：存储桶
 */
export type ResourceType = 'database' | 'function' | 'storage';

/**
 * 读取安全规则参数
 */
export interface ReadSecurityRuleParams {
    resourceType: ResourceType;
    resourceId: string;
}

/**
 * 写入安全规则参数
 */
export interface WriteSecurityRuleParams {
    resourceType: ResourceType;
    resourceId: string;
    aclTag: AclTag;
    rule?: string;
}

/**
 * 注册安全规则相关 Tool
 * @param server MCP Server 实例
 */
export function registerSecurityRuleTools(server: ExtendedMcpServer) {
    const cloudBaseOptions = server.cloudBaseOptions;
    const getManager = () => getCloudBaseManager({ cloudBaseOptions });



    // 读取安全规则 Tool
    server.registerTool?.(
        "readSecurityRule",
        {
            title: "读取安全规则",
            description: `读取指定资源（数据库集合、云函数、存储桶）的安全规则和权限类别。\n\n参数说明：\n- resourceType: 资源类型（database/function/storage）\n- resourceId: 资源唯一标识（集合名/函数名/桶名）`,
            inputSchema: {
                resourceType: z.enum(["database", "function", "storage"]).describe("资源类型：database=数据库集合，function=云函数，storage=存储桶"),
                resourceId: z.string().describe("资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。"),
            },
            annotations: {
                readOnlyHint: true,
                openWorldHint: true,
                category: "security-rule"
            }
        },
        async ({ resourceType, resourceId }: ReadSecurityRuleParams) => {

            const envId = await getEnvId(cloudBaseOptions);
            try {
                const cloudbase = await getManager();
                let result;
                if (resourceType === 'database') {
                    // 查询数据库安全规则
                    result = await cloudbase.commonService().call({
                        Action: 'DescribeSafeRule',
                        Param: {
                            CollectionName: resourceId,
                            EnvId: envId
                        }
                    });
                } else if (resourceType === 'function') {
                    // 查询云函数安全规则
                    result = await cloudbase.commonService().call({
                        Action: 'DescribeSecurityRule',
                        Param: {
                            ResourceType: 'FUNCTION',
                            EnvId: envId
                        }
                    });
                } else if (resourceType === 'storage') {
                    // 查询存储安全规则
                    result = await cloudbase.commonService().call({
                        Action: 'DescribeStorageSafeRule',
                        Param: {
                            Bucket: resourceId,
                            EnvId: envId
                        }
                    });
                } else {
                    throw new Error(`不支持的资源类型: ${resourceType}`);
                }
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            aclTag: result.AclTag,
                            rule: result.Rule ?? null,
                            raw: result,
                            message: "安全规则读取成功"
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            message: "安全规则读取失败"
                        }, null, 2)
                    }]
                };
            }
        }
    );

    // 写入安全规则 Tool
    server.registerTool?.(
        "writeSecurityRule",
        {
            title: "写入安全规则",
            description: `设置指定资源（数据库集合、云函数、存储桶）的安全规则。\n\n参数说明：\n- resourceType: 资源类型（database/function/storage）\n- resourceId: 资源唯一标识（集合名/函数名/桶名）\n- aclTag: 权限类别（READONLY/PRIVATE/ADMINWRITE/ADMINONLY/CUSTOM）\n- rule: 自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填`,
            inputSchema: {
                resourceType: z.enum(["database", "function", "storage"]).describe("资源类型：database=数据库集合，function=云函数，storage=存储桶"),
                resourceId: z.string().describe("资源唯一标识。数据库为集合名，云函数为函数名，存储为桶名。"),
                aclTag: z.enum(["READONLY", "PRIVATE", "ADMINWRITE", "ADMINONLY", "CUSTOM"]).describe("权限类别"),
                rule: z.string().optional().describe("自定义安全规则内容，仅当 aclTag 为 CUSTOM 时必填")
            },
            annotations: {
                readOnlyHint: false,
                openWorldHint: true,
                category: "security-rule"
            }
        },
        async ({ resourceType, resourceId, aclTag, rule }: WriteSecurityRuleParams) => {
            try {
                const cloudbase = await getManager();
                const envId = await getEnvId(cloudBaseOptions);
                let result;
                if (resourceType === 'database') {
                    if (aclTag === 'CUSTOM') {
                        if (!rule) throw new Error('数据库自定义安全规则（CUSTOM）必须提供 rule 字段');
                        result = await cloudbase.commonService().call({
                            Action: 'ModifySafeRule',
                            Param: {
                                CollectionName: resourceId,
                                EnvId: envId,
                                AclTag: aclTag,
                                Rule: rule
                            }
                        });
                    } else {
                        result = await cloudbase.commonService().call({
                            Action: 'ModifyDatabaseACL',
                            Param: {
                                CollectionName: resourceId,
                                EnvId: envId,
                                AclTag: aclTag
                            }
                        });
                    }
                } else if (resourceType === 'function') {
                    if (aclTag !== 'CUSTOM') throw new Error('云函数安全规则仅支持 CUSTOM 权限类别');
                    if (!rule) throw new Error('云函数自定义安全规则（CUSTOM）必须提供 rule 字段');
                    result = await cloudbase.commonService().call({
                        Action: 'ModifySecurityRule',
                        Param: {
                            AclTag: aclTag,
                            EnvId: envId,
                            ResourceType: 'FUNCTION',
                            Rule: rule
                        }
                    });
                } else if (resourceType === 'storage') {
                    if (aclTag === 'CUSTOM') {
                        if (!rule) throw new Error('存储自定义安全规则（CUSTOM）必须提供 rule 字段');
                        result = await cloudbase.commonService().call({
                            Action: 'ModifyStorageSafeRule',
                            Param: {
                                Bucket: resourceId,
                                EnvId: envId,
                                AclTag: aclTag,
                                Rule: rule
                            }
                        });
                    } else {
                        result = await cloudbase.commonService().call({
                            Action: 'ModifyStorageSafeRule',
                            Param: {
                                Bucket: resourceId,
                                EnvId: envId,
                                AclTag: aclTag
                            }
                        });
                    }
                } else {
                    throw new Error(`不支持的资源类型: ${resourceType}`);
                }
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            requestId: result.RequestId,
                            raw: result,
                            message: "安全规则写入成功"
                        }, null, 2)
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            message: "安全规则写入失败"
                        }, null, 2)
                    }]
                };
            }
        }
    );
} 