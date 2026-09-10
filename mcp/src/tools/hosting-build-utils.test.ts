import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { mockResolveBuildCommand, mockResolveOutputDir, mockBuildHosting } = vi.hoisted(
  () => ({
    mockResolveBuildCommand: vi.fn(),
    mockResolveOutputDir: vi.fn(),
    mockBuildHosting: vi.fn(),
  }),
);

vi.mock("@cloudbase/manager-node", () => ({
  default: {
    resolveHostingBuildCommand: mockResolveBuildCommand,
    resolveHostingOutputDir: mockResolveOutputDir,
    buildHosting: mockBuildHosting,
  },
}));

import {
  HOSTING_BUILD_ERROR_CODES,
  buildHostingItem,
  neutralizeHostingForDeploy,
  type DeployConfig,
  type HostingItem,
} from "./hosting-build-utils.js";

const tmpDirs: string[] = [];

function makeRoot(sub?: string): string {
  // 用系统临时目录而非仓库内目录：仓库根/父链存在 node_modules，
  // 会干扰「未安装依赖」用例的父链上溯判定。
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hosting-build-utils-"));
  tmpDirs.push(dir);
  if (sub) {
    const nested = path.join(dir, sub);
    fs.mkdirSync(nested, { recursive: true });
    return nested;
  }
  return dir;
}

function cleanup() {
  for (const dir of tmpDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup failures in restricted CI/sandbox delete hooks.
    }
  }
}

function writePkg(
  dir: string,
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
) {
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg));
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: a hosting item that does build with `npm run build`.
  mockResolveBuildCommand.mockReturnValue("npm run build");
  mockBuildHosting.mockImplementation(() => path.join(process.cwd(), "dist"));
});

afterEach(cleanup);

describe("neutralizeHostingForDeploy", () => {
  it("returns the same config when hosting is missing or empty", () => {
    const noHosting: DeployConfig = { envId: "env-1" };
    expect(neutralizeHostingForDeploy(noHosting, process.cwd())).toBe(noHosting);

    const emptyHosting: DeployConfig = { hosting: [] };
    expect(neutralizeHostingForDeploy(emptyHosting, process.cwd())).toBe(emptyHosting);
  });

  it("leaves pure-static items untouched (no build command)", () => {
    const root = makeRoot();
    const item: HostingItem = { name: "site", outputDir: "public" };
    mockResolveBuildCommand.mockReturnValue(null);

    const result = neutralizeHostingForDeploy({ hosting: [item] }, root);

    // Still returns a new config, but the item is passed through unchanged.
    expect(result).not.toBe({ hosting: [item] });
    expect(result.hosting).toEqual([{ name: "site", outputDir: "public" }]);
    expect(mockResolveOutputDir).not.toHaveBeenCalled();
  });

  it("neutralizes an item whose build output exists: clears commands and writes back relative outputDir", () => {
    const root = makeRoot();
    const outputDir = path.join(root, "dist");
    fs.mkdirSync(outputDir, { recursive: true });
    const item: HostingItem = {
      name: "site",
      buildCommand: "npm run build",
      installCommand: "npm install",
      framework: "vite",
      ignore: [".DS_Store"],
    };
    mockResolveOutputDir.mockReturnValue(outputDir);

    const result = neutralizeHostingForDeploy({ hosting: [item] }, root);

    const neutralized = result.hosting![0];
    expect(neutralized).toMatchObject({
      name: "site",
      buildCommand: "",
      installCommand: "",
      outputDir: "dist", // relative to root, so the orchestrator uploads the artifact
      framework: "vite",
      ignore: [".DS_Store"],
    });
    // The input config is never mutated.
    expect(item.buildCommand).toBe("npm run build");
    expect(item.installCommand).toBe("npm install");
  });

  it("resolves nested root and writes outputDir relative to that root", () => {
    const root = makeRoot();
    const nested = path.join(root, "web");
    fs.mkdirSync(nested, { recursive: true });
    const outputDir = path.join(nested, "dist");
    fs.mkdirSync(outputDir, { recursive: true });
    mockResolveOutputDir.mockReturnValue(outputDir);

    const result = neutralizeHostingForDeploy(
      { hosting: [{ name: "site", root: "web", buildCommand: "npm run build" }] },
      root,
    );

    expect(result.hosting![0].outputDir).toBe("dist");
  });

  it("throws BUILD_OUTPUT_NOT_FOUND when the build output directory is missing", () => {
    const root = makeRoot();
    mockResolveOutputDir.mockReturnValue(path.join(root, "dist")); // not created on disk

    expect(() =>
      neutralizeHostingForDeploy(
        { hosting: [{ name: "site", buildCommand: "npm run build" }] },
        root,
      ),
    ).toThrowError(
      expect.objectContaining({ code: HOSTING_BUILD_ERROR_CODES.BUILD_OUTPUT_NOT_FOUND }),
    );
  });
});

describe("buildHostingItem", () => {
  it("skips items without a build command and never calls the builder", () => {
    const root = makeRoot();
    mockResolveBuildCommand.mockReturnValue(null);

    const outcome = buildHostingItem({ name: "site" }, root);

    expect(outcome.action).toBe("skipped");
    expect(mockBuildHosting).not.toHaveBeenCalled();
  });

  it("throws DEPENDENCY_NOT_INSTALLED when package.json declares deps but no node_modules exists up the tree", () => {
    const root = makeRoot();
    writePkg(root, { dependencies: { react: "^18.0.0" } });

    expect(() => buildHostingItem({ name: "site", buildCommand: "npm run build" }, root)).toThrowError(
      expect.objectContaining({ code: HOSTING_BUILD_ERROR_CODES.DEPENDENCY_NOT_INSTALLED }),
    );
    expect(mockBuildHosting).not.toHaveBeenCalled();
  });

  it("counts devDependencies as dependencies for the node_modules check", () => {
    const root = makeRoot();
    writePkg(root, { devDependencies: { vite: "^5.0.0" } });

    expect(() => buildHostingItem({ name: "site", buildCommand: "npm run build" }, root)).toThrowError(
      expect.objectContaining({ code: HOSTING_BUILD_ERROR_CODES.DEPENDENCY_NOT_INSTALLED }),
    );
  });

  it("finds node_modules hoisted to a parent directory (pnpm workspace / monorepo)", () => {
    const root = makeRoot();
    fs.mkdirSync(path.join(root, "node_modules"), { recursive: true });
    const nested = path.join(root, "packages", "web");
    fs.mkdirSync(nested, { recursive: true });
    writePkg(nested, { dependencies: { react: "^18.0.0" } });

    const outcome = buildHostingItem({ name: "site", buildCommand: "npm run build" }, nested);

    expect(outcome.action).toBe("built");
    expect(mockBuildHosting).toHaveBeenCalledTimes(1);
  });

  it("builds without a dependency check when there is no package.json", () => {
    const root = makeRoot();

    const outcome = buildHostingItem({ name: "site", buildCommand: "npm run build" }, root);

    expect(outcome.action).toBe("built");
    expect(mockBuildHosting).toHaveBeenCalledTimes(1);
  });

  it("throws BUILD_FAILED when the builder throws", () => {
    const root = makeRoot();
    mockBuildHosting.mockImplementation(() => {
      throw new Error("Command failed: vite build");
    });

    expect(() => buildHostingItem({ name: "site", buildCommand: "vite build" }, root)).toThrowError(
      expect.objectContaining({ code: HOSTING_BUILD_ERROR_CODES.BUILD_FAILED }),
    );
  });

  it("reports a built outcome with the resolved output dir", () => {
    const root = makeRoot();
    const outputDir = path.join(root, "dist");
    mockBuildHosting.mockReturnValue(outputDir);

    const outcome = buildHostingItem({ name: "site", buildCommand: "npm run build" }, root);

    expect(outcome).toEqual({
      name: "site",
      root,
      action: "built",
      buildCommand: "npm run build",
      outputDir,
    });
  });
});
