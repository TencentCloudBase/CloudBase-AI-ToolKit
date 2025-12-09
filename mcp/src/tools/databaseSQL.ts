import { z } from "zod";
import { getCloudBaseManager, getEnvId, logCloudBaseResult } from "../cloudbase-manager.js";
import { ExtendedMcpServer } from "../server.js";
import { READ_SECURITY_RULE, WRITE_SECURITY_RULE } from "./security-rule.js";

const CATEGORY = "SQL database";

export function registerSQLDatabaseTools(server: ExtendedMcpServer) {
  // Get cloudBaseOptions, if not available then undefined
  const cloudBaseOptions = server.cloudBaseOptions;

  // Create closure function to get CloudBase Manager
  const getManager = () => getCloudBaseManager({ cloudBaseOptions });

  // executeReadOnlySQL
  server.registerTool?.(
    "executeReadOnlySQL",
    {
      title: "Execute read-only SQL query",
      description:
        "Execute a read-only SQL query on the SQL database. Note: For per-user ACL, each table should contain a fixed `_openid` column defined as `_openid VARCHAR(64) DEFAULT '' NOT NULL` that represents the user and is used for access control.",
      inputSchema: {
        sql: z.string().describe("SQL query statement (SELECT queries only)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ sql }) => {
      try {
        const cloudbase = await getManager();
        const envId = await getEnvId(cloudBaseOptions);

        // TODO: 考虑是否有支持指定其他 instance、schema 的需求
        const schemaId = envId;
        const instanceId = "default";

        const result = await cloudbase.commonService("tcb").call({
          Action: "RunSql",
          Param: {
            EnvId: envId,
            Sql: sql,
            DbInstance: {
              EnvId: envId,
              InstanceId: instanceId,
              Schema: schemaId,
            },
          },
        });
        logCloudBaseResult(server.logger, result);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "SQL query executed successfully",
                  result,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message,
                  message: "SQL query execution failed",
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );

  // executeWriteSQL
  server.registerTool?.(
    "executeWriteSQL",
    {
      title: "Execute write SQL statement",
      description:
        "Execute a write SQL statement on the SQL database (INSERT, UPDATE, DELETE, etc.). Whenever you create a new table, you **must** include a fixed `_openid` column defined as `_openid VARCHAR(64) DEFAULT '' NOT NULL` that represents the user and is used for access control.",
      inputSchema: {
        sql: z
          .string()
          .describe(
            "SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER, etc.)",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ sql }) => {
      try {
        const cloudbase = await getManager();
        const envId = await getEnvId(cloudBaseOptions);

        // TODO: 考虑是否有支持指定其他 instance、schema 的需求
        const schemaId = envId;
        const instanceId = "default";

        const result = await cloudbase.commonService("tcb").call({
          Action: "RunSql",
          Param: {
            EnvId: envId,
            Sql: sql,
            DbInstance: {
              EnvId: envId,
              InstanceId: instanceId,
              Schema: schemaId,
            },
          },
        });
        logCloudBaseResult(server.logger, result);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `SQL statement executed successfully. If you just created a table, make sure to check its security rule is set to a proper value by using \`${WRITE_SECURITY_RULE}\` and \`${READ_SECURITY_RULE}\` tools.`,
                  result,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message,
                  message: "SQL statement execution failed",
                },
                null,
                2,
              ),
            },
          ],
        };
      }
    },
  );
}
