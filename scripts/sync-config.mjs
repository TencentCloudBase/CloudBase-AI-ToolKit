#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'config');
const templateConfigPath = path.join(__dirname, 'template-config.json');

// 读取模板配置
let templateConfig;
try {
  const configContent = fs.readFileSync(templateConfigPath, 'utf8');
  templateConfig = JSON.parse(configContent);
} catch (error) {
  console.error('❌ 无法读取模板配置文件:', error.message);
  process.exit(1);
}

/**
 * 复制目录内容
 * @param {string} srcDir 源目录
 * @param {string} destDir 目标目录
 * @param {Array} excludePatterns 排除模式
 */
function copyDirectory(srcDir, destDir, excludePatterns = []) {
  try {
    // 确保目标目录存在
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const items = fs.readdirSync(srcDir);
    
    for (const item of items) {
      // 检查是否需要排除
      if (excludePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(item);
        }
        return item === pattern;
      })) {
        console.log(`  ⏭️  跳过: ${item} (匹配排除规则)`);
        continue;
      }

      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath, excludePatterns);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ 已复制: ${path.relative(projectRoot, destPath)}`);
      }
    }
  } catch (error) {
    console.error(`复制目录失败: ${srcDir} -> ${destDir}`, error.message);
  }
}

/**
 * 检查目标路径是否存在
 * @param {string} targetPath 目标路径
 * @returns {boolean}
 */
function checkTargetExists(targetPath) {
  return fs.existsSync(targetPath);
}

/**
 * 执行Git命令
 * @param {string} command Git命令
 * @param {string} cwd 工作目录
 */
function executeGitCommand(command, cwd = projectRoot) {
  try {
    const result = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    return result.trim();
  } catch (error) {
    console.error(`Git命令执行失败: ${command}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * 获取当前Git分支
 */
function getCurrentBranch(cwd = projectRoot) {
  try {
    return executeGitCommand('git rev-parse --abbrev-ref HEAD', cwd);
  } catch (error) {
    return 'main'; // 默认分支
  }
}

/**
 * 检查是否有未提交的更改
 */
function hasUncommittedChanges(cwd = projectRoot) {
  try {
    const status = executeGitCommand('git status --porcelain', cwd);
    return status.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 创建备份
 * @param {string} targetDir 目标目录
 */
function createBackup(targetDir) {
  if (!fs.existsSync(targetDir)) return null;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${targetDir}.backup.${timestamp}`;
  
  try {
    execSync(`cp -r "${targetDir}" "${backupDir}"`);
    console.log(`  💾 已创建备份: ${path.basename(backupDir)}`);
    return backupDir;
  } catch (error) {
    console.error(`创建备份失败:`, error.message);
    return null;
  }
}

/**
 * 主同步函数
 */
async function syncConfigs(options = {}) {
  const {
    filter = null,     // 过滤器，支持字符串匹配
    dryRun = false,    // 干运行模式
    skipGit = false,   // 跳过Git操作
    createBackup: shouldBackup = templateConfig.syncConfig?.createBackup || false
  } = options;

  console.log('🚀 开始同步配置和规则到模板项目...\n');
  
  // 检查config目录是否存在
  if (!fs.existsSync(configDir)) {
    console.error('❌ config目录不存在，请确保项目结构正确');
    process.exit(1);
  }
  
  console.log(`📁 配置源目录: ${configDir}`);
  
  // 获取要同步的模板路径
  let templatePaths = templateConfig.templates;
  
  if (filter) {
    templatePaths = templatePaths.filter(path => path.includes(filter));
    console.log(`🔍 过滤条件: 包含 "${filter}"`);
  }
  
  console.log(`📋 共需要同步 ${templatePaths.length} 个模板`);
  console.log(`🔧 模式: ${dryRun ? '干运行' : '实际执行'}\n`);
  
  let successCount = 0;
  let skipCount = 0;
  
  // 遍历模板列表
  for (let i = 0; i < templatePaths.length; i++) {
    const templatePath = templatePaths[i];
    console.log(`\n[${i + 1}/${templatePaths.length}] 处理模板: ${templatePath}`);
    
    const targetDir = path.join(projectRoot, '..', 'cloudbase-examples', templatePath);
    
    if (!checkTargetExists(path.dirname(targetDir))) {
      console.log(`  ⚠️  跳过: 目标目录不存在 ${templatePath}`);
      skipCount++;
      continue;
    }
    
    if (dryRun) {
      console.log(`  🔍 [干运行] 将同步到: ${targetDir}`);
      successCount++;
      continue;
    }
    
    // 创建备份
    if (shouldBackup) {
      createBackup(targetDir);
    }
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 同步config目录下的所有内容
    const configItems = fs.readdirSync(configDir);
    for (const configItem of configItems) {
      const srcPath = path.join(configDir, configItem);
      const destPath = path.join(targetDir, configItem);
      
      if (fs.statSync(srcPath).isDirectory()) {
        console.log(`  📂 同步目录: ${configItem}`);
        copyDirectory(srcPath, destPath, templateConfig.excludePatterns);
      } else {
        console.log(`  📄 同步文件: ${configItem}`);
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    successCount++;
    console.log(`  ✅ 同步完成: ${templatePath}`);
  }
  
  console.log(`\n📊 同步统计:`);
  console.log(`  ✅ 成功同步: ${successCount} 个模板`);
  console.log(`  ⚠️  跳过: ${skipCount} 个模板`);
  
  // Git提交和推送
  if (!skipGit && !dryRun && templateConfig.syncConfig?.autoCommit) {
    await handleGitOperations();
  } else if (dryRun) {
    console.log('\n🔍 [干运行] 跳过Git操作');
  } else if (skipGit) {
    console.log('\n⏭️  已跳过Git操作');
  }
}

/**
 * 处理Git操作
 */
async function handleGitOperations() {
  console.log('\n🔄 开始Git操作...');
  
  const examplesDir = path.join(projectRoot, '..', 'cloudbase-examples');
  
  if (!fs.existsSync(examplesDir)) {
    console.log('⚠️  cloudbase-examples 目录不存在，跳过Git操作');
    console.log('请先克隆该仓库到上级目录：');
    console.log('git clone https://github.com/TencentCloudBase/awsome-cloudbase-examples.git cloudbase-examples');
    return;
  }
  
  try {
    // 检查Git状态
    if (!hasUncommittedChanges(examplesDir)) {
      console.log('📝 没有检测到更改，跳过提交');
      return;
    }
    
    const currentBranch = getCurrentBranch(examplesDir);
    console.log(`📍 当前分支: ${currentBranch}`);
    
    // 添加所有更改
    console.log('📝 添加更改到暂存区...');
    executeGitCommand('git add .', examplesDir);
    
    // 生成提交信息
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const commitMessage = templateConfig.syncConfig?.commitMessage || 
      `chore: sync config and rules from cloudbase-turbo-deploy ${timestamp}`;
    
    // 提交更改
    console.log('💾 提交更改...');
    executeGitCommand(`git commit -m "${commitMessage}"`, examplesDir);
    
    // 推送到远程仓库
    console.log('🚀 推送到远程仓库...');
    executeGitCommand(`git pull  --rebase`, examplesDir);
    executeGitCommand(`git push origin ${currentBranch}`, examplesDir);
    
    console.log('✅ Git操作完成！');
    
  } catch (error) {
    console.error('❌ Git操作失败:', error.message);
    console.log('\n请手动检查并处理Git操作：');
    console.log('1. cd ../awsome-cloudbase-examples');
    console.log('2. git add .');
    console.log('3. git commit -m "sync config and rules"');
    console.log('4. git push');
  }
}

/**
 * 显示使用说明
 */
function showUsage() {
  console.log(`
📖 使用说明:

基本用法:
  node scripts/sync-config.mjs [选项]

选项:
  --help, -h              显示帮助信息
  --dry-run              干运行模式，不实际执行操作
  --skip-git             跳过Git提交和推送操作
  --backup               创建备份（覆盖配置文件设置）
  --filter <关键词>       只同步路径包含指定关键词的模板

示例:
  node scripts/sync-config.mjs                     # 同步所有模板
  node scripts/sync-config.mjs --dry-run           # 干运行模式
  node scripts/sync-config.mjs --filter web        # 只同步包含"web"的模板
  node scripts/sync-config.mjs --filter miniprogram # 只同步小程序模板
  node scripts/sync-config.mjs --skip-git          # 跳过Git操作
  node scripts/sync-config.mjs --backup            # 创建备份

准备工作:
1. 克隆目标仓库到上级目录：
   cd ..
   git clone https://github.com/TencentCloudBase/awsome-cloudbase-examples.git

2. 确保你有该仓库的推送权限

配置文件: scripts/template-config.json
模板总数: ${templateConfig.templates.length} 个
`);
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {
    dryRun: false,
    skipGit: false,
    createBackup: undefined,
    filter: null,
    showHelp: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.showHelp = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-git':
        options.skipGit = true;
        break;
      case '--backup':
        options.createBackup = true;
        break;
      case '--filter':
        if (i + 1 < args.length) {
          options.filter = args[i + 1];
          i++; // 跳过下一个参数
        }
        break;
    }
  }

  return options;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.showHelp) {
    showUsage();
    return;
  }
  
  try {
    await syncConfigs(options);
    console.log('\n🎉 所有操作完成！');
  } catch (error) {
    console.error('\n❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error); 