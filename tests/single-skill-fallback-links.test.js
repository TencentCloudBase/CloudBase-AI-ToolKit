import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, test } from 'vitest';
import { buildClawhubPublishArtifacts } from '../scripts/build-clawhub-publish-artifacts.mjs';
import { buildCompatConfig } from '../scripts/build-compat-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_SKILLS_DIR = path.join(ROOT_DIR, 'config', 'source', 'skills');
const PLUGIN_SKILLS_DIR = path.join(ROOT_DIR, 'plugin', 'cloudbase', 'skills');
const CLOUD_GUIDELINES_FILE = path.join(
  ROOT_DIR,
  'config',
  'source',
  'guideline',
  'cloudbase',
  'SKILL.md',
);
const SKILLS_REPO_OUTPUT_DIR = path.join(
  ROOT_DIR,
  `.skills-repo-output-fallback-test-${process.pid}-${Date.now()}`,
);
const tempDirs = [];

const RAW_SKILLS_ROOT_URL =
  'https://cnb.cool/tencent/cloud/cloudbase/cloudbase-skills/-/git/raw';
const LOCAL_SIBLING_SECTION_TITLE = '## Sibling skills (local only)';
const FORBIDDEN_FETCH_PHRASE =
  'Do **not** HTTP-fetch remote skill or protocol markdown into the agent context';

// Positive assertions are matched against whitespace-flattened text so that
// equivalent wording with different line wrapping still passes. Negative
// assertions (forbidden URLs/phrases) stay on the raw text on purpose: a
// forbidden URL split across lines would not function as a link anyway.
function flatten(text) {
  return text.replace(/\s+/g, ' ');
}

afterEach(() => {
  fs.rmSync(SKILLS_REPO_OUTPUT_DIR, { recursive: true, force: true });
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

function listSkillDirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

describe('local-only sibling skill links (no remote skill fetch)', () => {
  test('source skills forbid remote skill raw URLs and keep local-only sibling guidance', () => {
    for (const skillDir of listSkillDirs(SOURCE_SKILLS_DIR)) {
      const raw = fs.readFileSync(
        path.join(SOURCE_SKILLS_DIR, skillDir, 'SKILL.md'),
        'utf8',
      );

      expect(flatten(raw)).toContain(LOCAL_SIBLING_SECTION_TITLE);
      expect(flatten(raw)).toContain(FORBIDDEN_FETCH_PHRASE);
      expect(raw).not.toContain(RAW_SKILLS_ROOT_URL);
      expect(raw).not.toContain('standalone fallback:');
      expect(raw).not.toContain('## Standalone Install Note');
      expect(raw).not.toContain('/skills/cloudbase-guidelines/SKILL.md');
    }
  });

  test('plugin packaged skills have zero cloudbase-skills git/raw URLs', () => {
    for (const skillDir of listSkillDirs(PLUGIN_SKILLS_DIR)) {
      const skillMd = path.join(PLUGIN_SKILLS_DIR, skillDir, 'SKILL.md');
      if (!fs.existsSync(skillMd)) {
        continue;
      }
      const raw = fs.readFileSync(skillMd, 'utf8');
      expect(raw).not.toContain(RAW_SKILLS_ROOT_URL);
      expect(raw).not.toContain('standalone fallback:');
    }
  });

  test('source sibling references stay local-relative without remote fallbacks', () => {
    for (const skillDir of listSkillDirs(SOURCE_SKILLS_DIR)) {
      const raw = fs.readFileSync(
        path.join(SOURCE_SKILLS_DIR, skillDir, 'SKILL.md'),
        'utf8',
      );
      const siblingRefs = [...raw.matchAll(/`\.\.\/([a-z0-9-]+)\/SKILL\.md`/g)].map(
        (match) => match[1],
      );

      expect(siblingRefs.length >= 0).toBe(true);
      for (const siblingRef of siblingRefs) {
        expect(raw).toContain(`\`../${siblingRef}/SKILL.md\``);
        expect(raw).not.toMatch(
          new RegExp(
            `\\.\\./${siblingRef}/SKILL\\.md\`\\s*\\(standalone fallback:`,
          ),
        );
      }
    }
  });

  test('cloudbase guideline documents local sibling paths instead of raw-link fetch', () => {
    const raw = fs.readFileSync(CLOUD_GUIDELINES_FILE, 'utf8');

    expect(raw).not.toContain(RAW_SKILLS_ROOT_URL);
    expect(raw).toMatch(/local relative paths/i);
    expect(raw).toMatch(/Do \*\*not\*\* fetch sibling skill markdown from remote raw URLs/i);
    expect(raw).not.toContain('/skills/cloudbase-guidelines/SKILL.md');
    expect(raw).toMatch(/mcporter/i);
  });

  test('build-skills-repo keeps local-only sibling guidance in standalone outputs', () => {
    execFileSync('node', ['scripts/build-skills-repo.mjs'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      env: {
        ...process.env,
        SKILLS_REPO_OUTPUT_DIR: path.relative(ROOT_DIR, SKILLS_REPO_OUTPUT_DIR),
      },
    });

    const outputSkill = fs.readFileSync(
      path.join(SKILLS_REPO_OUTPUT_DIR, 'skills', 'auth-web-cloudbase', 'SKILL.md'),
      'utf8',
    );

    expect(flatten(outputSkill)).toContain(LOCAL_SIBLING_SECTION_TITLE);
    expect(flatten(outputSkill)).toContain(FORBIDDEN_FETCH_PHRASE);
    expect(outputSkill).not.toContain(RAW_SKILLS_ROOT_URL);
    expect(outputSkill).toContain('../auth-tool-cloudbase/SKILL.md');
  });

  test('buildClawhubPublishArtifacts omits remote skill raw URLs', () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawhub-fallback-'));
    tempDirs.push(outputDir);

    const manifest = buildClawhubPublishArtifacts({
      targets: 'web-development',
      outputDir,
    });

    const outputSkill = fs.readFileSync(
      path.join(manifest.targets[0].artifactDir, 'SKILL.md'),
      'utf8',
    );

    expect(flatten(outputSkill)).toContain(LOCAL_SIBLING_SECTION_TITLE);
    expect(outputSkill).not.toContain(RAW_SKILLS_ROOT_URL);
    expect(outputSkill).toContain('../auth-tool-cloudbase/SKILL.md');
  });

  test('buildCompatConfig omits remote skill raw URLs in IDE compatibility outputs', () => {
    const compatDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'compat-fallback-links-'),
    );
    tempDirs.push(compatDir);

    buildCompatConfig({ outputDir: compatDir });

    const compatSkill = fs.readFileSync(
      path.join(compatDir, 'rules', 'auth-web-cloudbase', 'rule.md'),
      'utf8',
    );

    expect(flatten(compatSkill)).toContain(LOCAL_SIBLING_SECTION_TITLE);
    expect(compatSkill).not.toContain(RAW_SKILLS_ROOT_URL);
    expect(compatSkill).toContain('../auth-tool-cloudbase/SKILL.md');
  });
});
