import { z } from "zod";
import { getCloudBaseManager, getEnvId } from "../cloudbase-manager.js";
import { ExtendedMcpServer } from "../server.js";

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
      description: "Execute a read-only SQL query on the SQL database",
      inputSchema: {
        sql: z.string().describe("SQL query statement (SELECT queries only)"),
        instanceId: z
          .string()
          .optional()
          .describe("Database instance ID (defaults to 'default')"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ sql, instanceId = "default" }) => {
      try {
        const cloudbase = await getManager();
        const envId = await getEnvId(cloudBaseOptions);

        const result = await cloudbase.commonService("tcb").call({
          Action: "RunSql",
          Param: {
            EnvId: envId,
            Sql: sql,
            DbInstance: {
              EnvId: envId,
              InstanceId: instanceId,
            },
          },
        });
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
                2
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
                2
              ),
            },
          ],
        };
      }
    }
  );

  // executeWriteSQL
  server.registerTool?.(
    "executeWriteSQL",
    {
      title: "Execute write SQL statement",
      description:
        "Execute a write SQL statement on the SQL database (INSERT, UPDATE, DELETE, etc.)",
      inputSchema: {
        sql: z
          .string()
          .describe(
            "SQL statement (INSERT, UPDATE, DELETE, CREATE, ALTER, etc.)"
          ),
        instanceId: z
          .string()
          .optional()
          .describe("Database instance ID (defaults to 'default')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        category: CATEGORY,
      },
    },
    async ({ sql, instanceId = "default" }) => {
      try {
        const cloudbase = await getManager();
        const envId = await getEnvId(cloudBaseOptions);

        const result = await cloudbase.commonService("tcb").call({
          Action: "RunSql",
          Param: {
            EnvId: envId,
            Sql: sql,
            DbInstance: {
              EnvId: envId,
              InstanceId: instanceId,
            },
          },
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "SQL statement executed successfully",
                  result,
                },
                null,
                2
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
                2
              ),
            },
          ],
        };
      }
    }
  );
}
