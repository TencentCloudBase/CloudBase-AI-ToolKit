#!/usr/bin/env node

/**
 * CloudBase AI 配置文件硬链接修复脚本
 * 用于确保所有 AI 编辑器的配置文件都指向同一个源文件
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Color definitions
const colors = {
  RED: "\x1b[0;31m",
  GREEN: "\x1b[0;32m",
  YELLOW: "\x1b[1;33m",
  BLUE: "\x1b[0;34m",
  NC: "\x1b[0m", // No Color
};

// Configuration
const RULES_SOURCE = "config/.cursor/rules/cloudbase-rules.mdc";
const RULES_TARGETS = [
  "config/.trae/rules/cloudbase-rules.md",
  "config/.windsurf/rules/cloudbase-rules.md",
  "config/.roo/rules/cloudbaase-rules.md",
  "config/.lingma/rules/cloudbaase-rules.md",
  "config/.qoder/rules/cloudbase-rules.md",
  "config/.rules/cloudbase-rules.md",
  "config/.rules/cloudbase-rules.mdc",
  "config/.clinerules/cloudbase-rules.mdc",
  "config/.github/copilot-instructions.md",
  "config/.comate/rules/cloudbase-rules.mdr",
  "config/.augment-guidelines",
  "config/CLAUDE.md",
  "config/.gemini/GEMINI.md",
  "config/AGENTS.md",
  "config/.qwen/QWEN.md",
  "config/CODEBUDDY.md",
];

const MCP_SOURCE = "config/.mcp.json";
const MCP_TARGETS = [".mcp.json"];

const SKILLS_SOURCE_DIR = "config/.claude/skills";
const SKILLS_TARGET_DIR = "config/.codebuddy/skills";
const RULES_DIR = "config/rules";

/**
 * Get file inode number
 * @param {string} filePath - File path
 * @returns {number|null} Inode number or null if file doesn't exist
 */
function getInode(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const stats = fs.statSync(fullPath);
    return stats.ino;
  } catch (error) {
    return null;
  }
}

/**
 * Check if two files are hard linked (same inode)
 * @param {string} sourcePath - Source file path
 * @param {string} targetPath - Target file path
 * @returns {boolean} True if files are hard linked
 */
function checkHardLinkStatus(sourcePath, targetPath) {
  const sourceInode = getInode(sourcePath);
  const targetInode = getInode(targetPath);

  if (sourceInode === null || targetInode === null) {
    return false;
  }

  return sourceInode === targetInode;
}

/**
 * Create hard link
 * @param {string} sourcePath - Source file path
 * @param {string} targetPath - Target file path
 * @returns {boolean} True if successful
 */
function createHardLink(sourcePath, targetPath) {
  try {
    const sourceFullPath = path.join(projectRoot, sourcePath);
    const targetFullPath = path.join(projectRoot, targetPath);

    // Ensure target directory exists
    const targetDir = path.dirname(targetFullPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Remove existing file if it exists
    if (fs.existsSync(targetFullPath)) {
      fs.unlinkSync(targetFullPath);
    }

    // Create hard link
    fs.linkSync(sourceFullPath, targetFullPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Prompt user for confirmation
 * @param {string} message - Prompt message
 * @returns {Promise<boolean>} True if user confirms
 */
function promptUser(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(/^[Yy]$/.test(answer.trim()));
    });
  });
}

/**
 * Get all hard linked files for a given file
 * @param {string} filePath - File path
 * @returns {string[]} Array of hard linked file paths
 */
function getHardLinkedFiles(filePath) {
  const linkedFiles = [];
  const sourceInode = getInode(filePath);

  if (sourceInode === null) {
    return linkedFiles;
  }

  function searchDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath);
            if (stats.ino === sourceInode) {
              const relativePath = path.relative(projectRoot, fullPath);
              linkedFiles.push(relativePath);
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        } else if (entry.isDirectory()) {
          searchDirectory(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
    }
  }

  searchDirectory(projectRoot);
  return linkedFiles.sort();
}

/**
 * Get hard link count for a file
 * @param {string} filePath - File path
 * @returns {number} Hard link count
 */
function getHardLinkCount(filePath) {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const stats = fs.statSync(fullPath);
    return stats.nlink;
  } catch (error) {
    return 0;
  }
}

/**
 * Process Rules configuration files hard links
 */
async function processRulesLinks() {
  console.log(
    `\n${colors.BLUE}📁 处理 Rules 配置文件: ${RULES_SOURCE}${colors.NC}`,
  );

  const sourcePath = path.join(projectRoot, RULES_SOURCE);
  if (!fs.existsSync(sourcePath)) {
    console.log(
      `${colors.RED}❌ 错误: 源文件 ${RULES_SOURCE} 不存在${colors.NC}`,
    );
    process.exit(1);
  }

  console.log(`${colors.GREEN}✅ 源文件存在: ${RULES_SOURCE}${colors.NC}`);

  const sourceInode = getInode(RULES_SOURCE);
  console.log(`${colors.BLUE}📋 源文件 inode: ${sourceInode}${colors.NC}`);

  console.log(`${colors.YELLOW}🔍 检查 Rules 硬链接状态...${colors.NC}`);

  const brokenLinks = [];
  const correctLinks = [];

  for (const target of RULES_TARGETS) {
    const targetPath = path.join(projectRoot, target);
    if (fs.existsSync(targetPath)) {
      const targetInode = getInode(target);
      if (targetInode === sourceInode) {
        console.log(`${colors.GREEN}✅ ${target} (正确链接)${colors.NC}`);
        correctLinks.push(target);
      } else {
        console.log(
          `${colors.RED}❌ ${target} (独立文件, inode: ${targetInode})${colors.NC}`,
        );
        brokenLinks.push(target);
      }
    } else {
      console.log(`${colors.YELLOW}⚠️  ${target} (文件不存在)${colors.NC}`);
      brokenLinks.push(target);
    }
  }

  if (brokenLinks.length === 0) {
    console.log(
      `\n${colors.GREEN}🎉 所有 Rules 配置文件都已正确硬链接！${colors.NC}`,
    );
    console.log(
      `${colors.BLUE}📊 总共 ${correctLinks.length + 1} 个硬链接${colors.NC}`,
    );
    return;
  }

  console.log(
    `\n${colors.YELLOW}🔧 需要修复的文件 (${brokenLinks.length} 个):${colors.NC}`,
  );
  for (const broken of brokenLinks) {
    console.log(`   - ${broken}`);
  }

  const shouldContinue = await promptUser(
    `\n${colors.YELLOW}❓ 是否继续修复这些 Rules 文件？这将删除独立副本并创建硬链接。 [y/N]${colors.NC} `,
  );

  if (!shouldContinue) {
    console.log(`${colors.BLUE}🚫 Rules 修复操作已取消${colors.NC}`);
    return;
  }

  console.log(`\n${colors.BLUE}🔧 开始修复 Rules 硬链接...${colors.NC}`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const target of brokenLinks) {
    console.log(`${colors.YELLOW}🔄 处理: ${target}${colors.NC}`);

    const targetFullPath = path.join(projectRoot, target);
    const targetDir = path.dirname(targetFullPath);

    if (!fs.existsSync(targetDir)) {
      console.log(`   📁 创建目录: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetFullPath)) {
      console.log(`   🗑️  删除现有文件`);
      fs.unlinkSync(targetFullPath);
    }

    if (createHardLink(RULES_SOURCE, target)) {
      console.log(`   ${colors.GREEN}✅ 硬链接创建成功${colors.NC}`);
      fixedCount++;
    } else {
      console.log(`   ${colors.RED}❌ 硬链接创建失败${colors.NC}`);
      errorCount++;
    }
  }

  console.log(`\n${colors.BLUE}📊 Rules 修复完成统计:${colors.NC}`);
  console.log(`${colors.GREEN}✅ 成功修复: ${fixedCount} 个文件${colors.NC}`);
  if (errorCount > 0) {
    console.log(`${colors.RED}❌ 修复失败: ${errorCount} 个文件${colors.NC}`);
  }

  console.log(`\n${colors.BLUE}🔍 最终验证 Rules 硬链接状态...${colors.NC}`);
  const totalLinks = getHardLinkCount(RULES_SOURCE);
  console.log(`${colors.GREEN}🎉 总硬链接数: ${totalLinks}${colors.NC}`);

  console.log(`\n${colors.BLUE}📋 所有 Rules 硬链接文件:${colors.NC}`);
  const linkedFiles = getHardLinkedFiles(RULES_SOURCE);
  for (const file of linkedFiles) {
    console.log(file);
  }

  console.log(
    `\n${colors.GREEN}✨ Rules 硬链接修复完成！现在修改任何一个文件都会同步到所有其他文件。${colors.NC}`,
  );
}

/**
 * Process MCP configuration files hard links
 */
async function processMcpLinks() {
  console.log(
    `\n${colors.BLUE}📁 处理 MCP 配置文件: ${MCP_SOURCE}${colors.NC}`,
  );

  const sourcePath = path.join(projectRoot, MCP_SOURCE);
  if (!fs.existsSync(sourcePath)) {
    console.log(
      `${colors.RED}❌ 错误: 源文件 ${MCP_SOURCE} 不存在${colors.NC}`,
    );
    process.exit(1);
  }

  console.log(`${colors.GREEN}✅ 源文件存在: ${MCP_SOURCE}${colors.NC}`);

  const sourceInode = getInode(MCP_SOURCE);
  console.log(`${colors.BLUE}📋 源文件 inode: ${sourceInode}${colors.NC}`);

  console.log(`${colors.YELLOW}🔍 检查 MCP 硬链接状态...${colors.NC}`);

  const brokenLinks = [];
  const correctLinks = [];

  for (const target of MCP_TARGETS) {
    const targetPath = path.join(projectRoot, target);
    if (fs.existsSync(targetPath)) {
      const targetInode = getInode(target);
      if (targetInode === sourceInode) {
        console.log(`${colors.GREEN}✅ ${target} (正确链接)${colors.NC}`);
        correctLinks.push(target);
      } else {
        console.log(
          `${colors.RED}❌ ${target} (独立文件, inode: ${targetInode})${colors.NC}`,
        );
        brokenLinks.push(target);
      }
    } else {
      console.log(`${colors.YELLOW}⚠️  ${target} (文件不存在)${colors.NC}`);
      brokenLinks.push(target);
    }
  }

  if (brokenLinks.length === 0) {
    console.log(
      `\n${colors.GREEN}🎉 所有 MCP 配置文件都已正确硬链接！${colors.NC}`,
    );
    console.log(
      `${colors.BLUE}📊 总共 ${correctLinks.length + 1} 个硬链接${colors.NC}`,
    );
    return;
  }

  console.log(
    `\n${colors.YELLOW}🔧 需要修复的文件 (${brokenLinks.length} 个):${colors.NC}`,
  );
  for (const broken of brokenLinks) {
    console.log(`   - ${broken}`);
  }

  const shouldContinue = await promptUser(
    `\n${colors.YELLOW}❓ 是否继续修复这些文件？这将删除独立副本并创建硬链接。 [y/N]${colors.NC} `,
  );

  if (!shouldContinue) {
    console.log(`${colors.BLUE}🚫 操作已取消${colors.NC}`);
    return;
  }

  console.log(`\n${colors.BLUE}🔧 开始修复硬链接...${colors.NC}`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const target of brokenLinks) {
    console.log(`${colors.YELLOW}🔄 处理: ${target}${colors.NC}`);

    const targetFullPath = path.join(projectRoot, target);
    const targetDir = path.dirname(targetFullPath);

    if (!fs.existsSync(targetDir)) {
      console.log(`   📁 创建目录: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetFullPath)) {
      console.log(`   🗑️  删除现有文件`);
      fs.unlinkSync(targetFullPath);
    }

    if (createHardLink(MCP_SOURCE, target)) {
      console.log(`   ${colors.GREEN}✅ 硬链接创建成功${colors.NC}`);
      fixedCount++;
    } else {
      console.log(`   ${colors.RED}❌ 硬链接创建失败${colors.NC}`);
      errorCount++;
    }
  }

  console.log(`\n${colors.BLUE}📊 MCP 修复完成统计:${colors.NC}`);
  console.log(`${colors.GREEN}✅ 成功修复: ${fixedCount} 个文件${colors.NC}`);
  if (errorCount > 0) {
    console.log(`${colors.RED}❌ 修复失败: ${errorCount} 个文件${colors.NC}`);
  }

  console.log(`\n${colors.BLUE}🔍 最终验证 MCP 硬链接状态...${colors.NC}`);
  const totalLinks = getHardLinkCount(MCP_SOURCE);
  console.log(`${colors.GREEN}🎉 总硬链接数: ${totalLinks}${colors.NC}`);

  console.log(`\n${colors.BLUE}📋 所有 MCP 硬链接文件:${colors.NC}`);
  const linkedFiles = getHardLinkedFiles(MCP_SOURCE);
  for (const file of linkedFiles) {
    console.log(file);
  }

  console.log(
    `\n${colors.GREEN}✨ MCP 硬链接修复完成！现在修改任何一个文件都会同步到所有其他文件。${colors.NC}`,
  );
}

/**
 * Sync skills directory recursively
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 */
function syncSkillsDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      syncSkillsDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      // Create hard link for file
      try {
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        fs.linkSync(srcPath, destPath);
      } catch (error) {
        console.log(
          `   ${colors.RED}❌ 无法创建硬链接: ${entry.name}${colors.NC}`,
        );
      }
    }
  }
}

/**
 * Sync skills directory from .claude/skills to .codebuddy/skills
 */
async function syncSkillsDirectory() {
  console.log(
    `\n${colors.BLUE}📁 处理 Skills 目录同步: ${SKILLS_SOURCE_DIR} -> ${SKILLS_TARGET_DIR}${colors.NC}`,
  );

  const sourcePath = path.join(projectRoot, SKILLS_SOURCE_DIR);
  if (!fs.existsSync(sourcePath)) {
    console.log(
      `${colors.YELLOW}⚠️  源目录 ${SKILLS_SOURCE_DIR} 不存在，跳过${colors.NC}`,
    );
    return;
  }

  console.log(`${colors.GREEN}✅ 源目录存在: ${SKILLS_SOURCE_DIR}${colors.NC}`);

  const destPath = path.join(projectRoot, SKILLS_TARGET_DIR);

  console.log(`${colors.YELLOW}🔍 开始同步 Skills 目录...${colors.NC}`);

  syncSkillsDirectoryRecursive(sourcePath, destPath);

  console.log(`${colors.GREEN}✨ Skills 目录同步完成！${colors.NC}`);
}

/**
 * Copy directory recursively
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @returns {{files: number, errors: number}} Copy statistics
 */
function copyDirectoryRecursive(srcDir, destDir) {
  let filesCount = 0;
  let errorsCount = 0;

  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
      return;
    }

    // Ensure destination directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      // Rename SKILL.md to rule.md when copying
      const destFileName = entry.name === "SKILL.md" ? "rule.md" : entry.name;
      const destPath = path.join(dest, destFileName);

      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else if (entry.isFile()) {
        try {
          // Remove existing file if it exists
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
          }
          // Copy file
          fs.copyFileSync(srcPath, destPath);
          filesCount++;
        } catch (error) {
          console.log(
            `   ${colors.RED}❌ 无法复制文件: ${entry.name} - ${error.message}${colors.NC}`,
          );
          errorsCount++;
        }
      }
    }
  }

  copyRecursive(srcDir, destDir);

  return { files: filesCount, errors: errorsCount };
}

/**
 * Sync skills directory to rules directory, maintaining original structure
 */
async function syncSkillFiles() {
  console.log(
    `\n${colors.BLUE}📁 处理 Skills 目录同步到 rules 目录${colors.NC}`,
  );

  const skillsSourcePath = path.join(projectRoot, SKILLS_SOURCE_DIR);
  if (!fs.existsSync(skillsSourcePath)) {
    console.log(
      `${colors.YELLOW}⚠️  源目录 ${SKILLS_SOURCE_DIR} 不存在，跳过${colors.NC}`,
    );
    return;
  }

  console.log(`${colors.GREEN}✅ 源目录存在: ${SKILLS_SOURCE_DIR}${colors.NC}`);

  const rulesDirPath = path.join(projectRoot, RULES_DIR);
  if (!fs.existsSync(rulesDirPath)) {
    fs.mkdirSync(rulesDirPath, { recursive: true });
  }

  console.log(
    `${colors.YELLOW}🔍 开始复制 Skills 目录到 rules 目录...${colors.NC}`,
  );
  console.log(`   ${colors.BLUE}源: ${SKILLS_SOURCE_DIR}${colors.NC}`);
  console.log(`   ${colors.BLUE}目标: ${RULES_DIR}${colors.NC}`);

  const stats = copyDirectoryRecursive(skillsSourcePath, rulesDirPath);

  console.log(`\n${colors.BLUE}📊 Skills 目录同步完成统计:${colors.NC}`);
  console.log(`${colors.GREEN}✅ 成功复制: ${stats.files} 个文件${colors.NC}`);
  if (stats.errors > 0) {
    console.log(`${colors.RED}❌ 复制失败: ${stats.errors} 个文件${colors.NC}`);
  }

  console.log(
    `\n${colors.GREEN}✨ Skills 目录同步完成！已保持原有目录结构和文件名。${colors.NC}`,
  );
}

/**
 * Sync rules directory to IDE-specific rules directories using hard links
 */
async function syncRulesToIDEDirectories() {
  console.log(
    `\n${colors.BLUE}📁 处理 Rules 目录同步到 IDE 特定目录${colors.NC}`,
  );

  const rulesSourcePath = path.join(projectRoot, RULES_DIR);
  if (!fs.existsSync(rulesSourcePath)) {
    console.log(
      `${colors.YELLOW}⚠️  源目录 ${RULES_DIR} 不存在，跳过${colors.NC}`,
    );
    return;
  }

  console.log(`${colors.GREEN}✅ 源目录存在: ${RULES_DIR}${colors.NC}`);

  // IDE-specific rules directories configuration
  // Each entry: { dir: string, convertMdToMdc: boolean }
  const ideRulesConfigs = [
    { dir: "config/.qoder/rules", convertMdToMdc: false },
    { dir: "config/.cursor/rules", convertMdToMdc: true },
    { dir: "config/.agent/rules", convertMdToMdc: false },
    { dir: "config/.trae/rules", convertMdToMdc: false },
    { dir: "config/.windsurf/rules", convertMdToMdc: false },
    { dir: "config/.clinerules", convertMdToMdc: false },
    { dir: "config/.kiro/steering", convertMdToMdc: false },
  ];

  console.log(
    `${colors.YELLOW}🔍 开始同步 Rules 目录到 IDE 特定目录...${colors.NC}`,
  );

  let totalFiles = 0;
  let totalErrors = 0;

  for (const config of ideRulesConfigs) {
    const ideRulesDir = config.dir;
    const convertMdToMdc = config.convertMdToMdc;
    const ideRulesPath = path.join(projectRoot, ideRulesDir);
    
    console.log(`\n${colors.BLUE}📂 处理: ${ideRulesDir}${colors.NC}`);
    if (convertMdToMdc) {
      console.log(`   ${colors.YELLOW}📝 将 .md 文件转换为 .mdc 格式${colors.NC}`);
    }

    // Ensure target directory exists
    if (!fs.existsSync(ideRulesPath)) {
      fs.mkdirSync(ideRulesPath, { recursive: true });
      console.log(`   📁 创建目录: ${ideRulesDir}`);
    }

    // Recursively sync files
    function syncRulesRecursive(srcDir, destDir) {
      if (!fs.existsSync(srcDir)) {
        return;
      }

      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        let destFileName = entry.name;
        
        // Convert .md to .mdc for Cursor
        if (convertMdToMdc && entry.isFile() && entry.name.endsWith('.md')) {
          destFileName = entry.name.replace(/\.md$/, '.mdc');
        }
        
        const destPath = path.join(destDir, destFileName);

        if (entry.isDirectory()) {
          // Create subdirectory if it doesn't exist
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          syncRulesRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
          try {
            if (convertMdToMdc && entry.name.endsWith('.md')) {
              // For Cursor, copy file content and rename extension
              if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
              }
              fs.copyFileSync(srcPath, destPath);
              totalFiles++;
            } else {
              // For other IDEs, create hard link
              if (fs.existsSync(destPath)) {
                // Check if it's already a hard link
                const srcStats = fs.statSync(srcPath);
                const destStats = fs.statSync(destPath);
                
                if (srcStats.ino === destStats.ino) {
                  // Already hard linked, skip
                  continue;
                } else {
                  // Remove existing file and create hard link
                  fs.unlinkSync(destPath);
                }
              }
              
              fs.linkSync(srcPath, destPath);
              totalFiles++;
            }
          } catch (error) {
            console.log(
              `   ${colors.RED}❌ 无法同步文件: ${entry.name} - ${error.message}${colors.NC}`,
            );
            totalErrors++;
          }
        }
      }
    }

    syncRulesRecursive(rulesSourcePath, ideRulesPath);
    console.log(`   ${colors.GREEN}✅ ${ideRulesDir} 同步完成${colors.NC}`);
  }

  console.log(`\n${colors.BLUE}📊 Rules 目录同步完成统计:${colors.NC}`);
  console.log(`${colors.GREEN}✅ 成功创建硬链接: ${totalFiles} 个文件${colors.NC}`);
  if (totalErrors > 0) {
    console.log(`${colors.RED}❌ 创建失败: ${totalErrors} 个文件${colors.NC}`);
  }

  console.log(
    `\n${colors.GREEN}✨ Rules 目录同步完成！所有文件已通过硬链接同步。${colors.NC}`,
  );
}

/**
 * Main function
 */
async function main() {
  console.log(
    `${colors.BLUE}🔧 CloudBase AI 配置文件硬链接修复工具${colors.NC}`,
  );
  console.log("==================================================");

  try {
    await processRulesLinks();
    await processMcpLinks();
    await syncSkillsDirectory();
    await syncSkillFiles();
    await syncRulesToIDEDirectories();

    console.log(`\n${colors.GREEN}🎉 所有操作完成！${colors.NC}`);
  } catch (error) {
    console.error(
      `\n${colors.RED}❌ 脚本执行失败: ${error.message}${colors.NC}`,
    );
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
