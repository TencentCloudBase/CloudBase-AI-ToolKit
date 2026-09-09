#!/usr/bin/env node
/**
 * Auto-bump version in expert packs whose content changed since the last tag.
 *
 * Why: expert pack submission (开放平台提审) requires a version increment
 * whenever pack content changes. This script detects content changes per
 * pack and patches the `version` field (patch +1) in each pack's
 * .codebuddy-plugin/plugin.json. CI runs it on every push to main and
 * commits the bumps back with [skip ci].
 *
 * Loop safety: the version bump itself modifies plugin.json inside the pack
 * dir, so a naive "any diff since last tag" check would bump forever. The
 * comparison therefore strips the `version` field before comparing
 * plugin.json, and compares blob hashes for every other file.
 *
 * Usage:
 *   node scripts/bump-expert-versions.mjs [--base <ref>] [--dry-run]
 *
 *   --base <ref>   Compare against this git ref (default: latest tag via
 *                  `git describe --tags --abbrev=0`; skips if no tag exists)
 *   --dry-run      Print what would be bumped without writing files
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const expertsDir = path.join(repoRoot, "plugins", "experts");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const baseIdx = args.indexOf("--base");
let base = baseIdx >= 0 ? args[baseIdx + 1] : null;

function git(cmdArgs, { allowFail = false } = {}) {
  try {
    return execFileSync("git", cmdArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      // expected-failure probes (rev-parse / cat-file -e on absent paths)
      // must not leak "fatal:" noise to stderr
      stdio: allowFail ? ["ignore", "pipe", "ignore"] : "pipe",
    }).trim();
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

if (!base) {
  base = git(["describe", "--tags", "--abbrev=0"], { allowFail: true });
  if (!base) {
    console.log(
      "No git tag found — nothing to compare against, skipping version bump.",
    );
    process.exit(0);
  }
}

const pluginName = ".codebuddy-plugin/plugin.json";

function listExpertDirs() {
  const names = git(["ls-files", "plugins/experts"])
    .split("\n")
    .filter(Boolean)
    .map((p) => p.split("/")[2])
    .filter((name) =>
      existsSyncQuiet(path.join(expertsDir, name, pluginName)),
    );
  return [...new Set(names)];
}

function existsSyncQuiet(p) {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

// Pack content changed since `base`?
// - plugin.json: compare with the version field stripped (bump commits must
//   not count as content changes)
// - every other file: compare git blob hashes between base and HEAD
function packChangedSince(packName, base) {
  const relPack = `plugins/experts/${packName}`;
  const headFiles = git(["ls-tree", "-r", "--name-only", "HEAD", relPack])
    .split("\n")
    .filter(Boolean);

  // Pack did not exist at base -> brand new pack, keep its initial version.
  const existsAtBase = git(
    ["cat-file", "-e", `${base}:${relPack}/${pluginName}`],
    { allowFail: true },
  );
  if (existsAtBase === null) {
    console.log(`  ${packName}: new pack since ${base}, keeping initial version`);
    return false;
  }

  for (const file of headFiles) {
    const headHash = git(["rev-parse", `HEAD:${file}`]);
    const baseHash = git(["rev-parse", `${base}:${file}`], { allowFail: true });
    if (baseHash === headHash) continue;

    if (file.endsWith(pluginName)) {
      const baseText = git(["show", `${base}:${file}`]);
      const headText = git(["show", `HEAD:${file}`]);
      if (normalizePluginJson(baseText) !== normalizePluginJson(headText)) {
        return true;
      }
      continue;
    }
    return true;
  }
  return false;
}

function normalizePluginJson(text) {
  try {
    const obj = JSON.parse(text);
    delete obj.version;
    return JSON.stringify(obj);
  } catch {
    return text; // malformed JSON: fall back to raw comparison
  }
}

function bumpPatch(version) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  parts[2] += 1;
  return parts.join(".");
}

const packs = listExpertDirs();
const bumped = [];

for (const name of packs) {
  if (!packChangedSince(name, base)) continue;
  const pluginPath = path.join(expertsDir, name, pluginName);
  const raw = readFileSync(pluginPath, "utf8");
  const json = JSON.parse(raw);
  const next = bumpPatch(json.version ?? "1.0.0");
  if (!next) {
    console.warn(
      `  ⚠️  ${name}: cannot parse version "${json.version}", skipped`,
    );
    continue;
  }
  console.log(`  ${name}: ${json.version} -> ${next}`);
  if (!dryRun) {
    json.version = next;
    writeFileSync(pluginPath, JSON.stringify(json, null, 2) + "\n");
  }
  bumped.push({ name, from: json.version, to: next });
}

if (bumped.length === 0) {
  console.log(`No expert pack content changed since ${base}.`);
} else if (dryRun) {
  console.log(`Dry run: ${bumped.length} pack(s) would be bumped.`);
}
