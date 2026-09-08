import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractMcpClientInfo,
  normalizeClientName,
  readMcpClientInfoFromServer,
  reportToolCall,
  reportToolkitLifecycle,
  telemetryReporter,
} from "./telemetry.js";

describe("telemetry payload serialization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should stringify duration and preserve requestId for tool calls", async () => {
    const reportSpy = vi
      .spyOn(telemetryReporter, "report")
      .mockResolvedValue(undefined);

    await reportToolCall({
      toolName: "readNoSqlDatabaseContent",
      success: true,
      requestId: "req-query",
      duration: 123,
    });

    expect(reportSpy).toHaveBeenCalledWith(
      "toolkit_tool_call",
      expect.objectContaining({
        requestId: "req-query",
        duration: "123",
      }),
    );
  });

  it("should include MCP clientInfo fields when provided", async () => {
    const reportSpy = vi
      .spyOn(telemetryReporter, "report")
      .mockResolvedValue(undefined);

    await reportToolCall({
      toolName: "queryEnv",
      success: true,
      mcpClientInfo: {
        name: "cursor-vscode",
        version: "1.2.3",
        title: "Cursor",
      },
    });

    expect(reportSpy).toHaveBeenCalledWith(
      "toolkit_tool_call",
      expect.objectContaining({
        mcpClientName: "cursor-vscode",
        mcpClientVersion: "1.2.3",
        mcpClientTitle: "Cursor",
      }),
    );
  });

  it("should include client, region and site fields when provided", async () => {
    const reportSpy = vi
      .spyOn(telemetryReporter, "report")
      .mockResolvedValue(undefined);

    await reportToolCall({
      toolName: "queryEnv",
      success: true,
      client: "Cursor",
      cloudBaseOptions: {
        region: "ap-singapore",
        site: "intl",
      } as any,
    });

    expect(reportSpy).toHaveBeenCalledWith(
      "toolkit_tool_call",
      expect.objectContaining({
        client: "cursor",
        region: "ap-singapore",
        site: "intl",
      }),
    );
  });

  it("should stringify lifecycle duration and exitCode", async () => {
    const reportSpy = vi
      .spyOn(telemetryReporter, "report")
      .mockResolvedValue(undefined);

    await reportToolkitLifecycle({
      event: "exit",
      duration: 456,
      exitCode: 2,
    });

    expect(reportSpy).toHaveBeenCalledWith(
      "toolkit_lifecycle",
      expect.objectContaining({
        duration: "456",
        exitCode: "2",
      }),
    );
  });
});

describe("normalizeClientName", () => {
  it("should trim, lowercase and strip disallowed characters", () => {
    expect(normalizeClientName("  Cursor ")).toBe("cursor");
    expect(normalizeClientName("claude-code")).toBe("claude-code");
    expect(normalizeClientName("CLine_v1")).toBe("cline_v1");
    expect(normalizeClientName("Cursor/VSCode 1.0")).toBe("cursorvscode10");
    expect(normalizeClientName("A".repeat(100))).toHaveLength(64);
  });

  it("should return undefined for empty or non-string values", () => {
    expect(normalizeClientName("")).toBeUndefined();
    expect(normalizeClientName("   ")).toBeUndefined();
    expect(normalizeClientName("///")).toBeUndefined();
    expect(normalizeClientName(undefined)).toBeUndefined();
    expect(normalizeClientName(123)).toBeUndefined();
  });
});

describe("MCP clientInfo helpers", () => {
  it("extractMcpClientInfo should keep name/version/title and drop empties", () => {
    expect(
      extractMcpClientInfo({
        name: " Claude Code ",
        version: "2.0.0",
        title: "Claude Code",
        extra: "ignored",
      }),
    ).toEqual({
      name: "Claude Code",
      version: "2.0.0",
      title: "Claude Code",
    });

    expect(extractMcpClientInfo({ name: "  ", version: "" })).toEqual({});
    expect(extractMcpClientInfo(undefined)).toEqual({});
  });

  it("readMcpClientInfoFromServer should read getClientVersion safely", () => {
    expect(
      readMcpClientInfoFromServer({
        server: {
          getClientVersion: () => ({ name: "cursor", version: "1.0.0" }),
        },
      }),
    ).toEqual({ name: "cursor", version: "1.0.0" });

    expect(readMcpClientInfoFromServer({})).toEqual({});
    expect(
      readMcpClientInfoFromServer({
        server: {
          getClientVersion: () => {
            throw new Error("not initialized");
          },
        },
      }),
    ).toEqual({});
  });
});
