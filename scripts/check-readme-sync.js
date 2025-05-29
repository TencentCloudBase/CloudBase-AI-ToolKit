#!/usr/bin/env node

/**
 * README 同步检查脚本
 * 检查中英文 README 文件的基本同步状态
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const README_CN = path.join(__dirname, '../README.md');
const README_EN = path.join(__dirname, '../README-EN.md');

// 关键章节标题（用于检查结构一致性）
const KEY_SECTIONS = [
  '## ✨', // 核心特性 / Key Features
  '## 🚀', // 快速开始 / Quick Start  
  '## 🎯', // 使用案例 / Use Cases
  '## 🛠️', // 工具一览 / Tools Overview
  '## 🏗️', // 架构原理 / Architecture
  '## 🌟', // 为什么选择 / Why Choose
  '## 💬', // 技术交流群 / Community
  '## 🤝', // 贡献指南 / Contributing
  '## 📄', // 开源协议 / License
];

// 关键词检查（确保重要概念都被翻译）
const KEY_TERMS = {
  cn: ['云开发', '环境ID', '小程序', 'AI编程', '一键部署'],
  en: ['CloudBase', 'Environment ID', 'Mini-Program', 'AI IDE', 'One-Click']
};

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ 无法读取文件: ${filePath}`);
    return null;
  }
}

function checkFileExists() {
  const cnExists = fs.existsSync(README_CN);
  const enExists = fs.existsSync(README_EN);
  
  console.log('📁 文件存在性检查:');
  console.log(`   中文版 README.md: ${cnExists ? '✅' : '❌'}`);
  console.log(`   英文版 README-EN.md: ${enExists ? '✅' : '❌'}`);
  
  return cnExists && enExists;
}

function checkSectionStructure(cnContent, enContent) {
  console.log('\n📋 章节结构检查:');
  
  let allMatch = true;
  
  KEY_SECTIONS.forEach(section => {
    const cnHas = cnContent.includes(section);
    const enHas = enContent.includes(section);
    const match = cnHas === enHas;
    
    console.log(`   ${section}: 中文${cnHas ? '✅' : '❌'} 英文${enHas ? '✅' : '❌'} ${match ? '✅' : '❌'}`);
    
    if (!match) allMatch = false;
  });
  
  return allMatch;
}

function checkKeyTerms(cnContent, enContent) {
  console.log('\n🔍 关键词检查:');
  
  let allMatch = true;
  
  // 检查中文关键词
  console.log('   中文关键词:');
  KEY_TERMS.cn.forEach(term => {
    const exists = cnContent.includes(term);
    console.log(`     ${term}: ${exists ? '✅' : '❌'}`);
    if (!exists) allMatch = false;
  });
  
  // 检查英文关键词
  console.log('   英文关键词:');
  KEY_TERMS.en.forEach(term => {
    const exists = enContent.includes(term);
    console.log(`     ${term}: ${exists ? '✅' : '❌'}`);
    if (!exists) allMatch = false;
  });
  
  return allMatch;
}

function checkLanguageNavigation(cnContent, enContent) {
  console.log('\n🌍 语言导航检查:');
  
  const cnNavPattern = /Languages.*中文.*English.*README-EN\.md/;
  const enNavPattern = /Languages.*中文.*README\.md.*English/;
  
  const cnHasNav = cnNavPattern.test(cnContent);
  const enHasNav = enNavPattern.test(enContent);
  
  console.log(`   中文版语言导航: ${cnHasNav ? '✅' : '❌'}`);
  console.log(`   英文版语言导航: ${enHasNav ? '✅' : '❌'}`);
  
  return cnHasNav && enHasNav;
}

function getBasicStats(content) {
  return {
    lines: content.split('\n').length,
    characters: content.length,
    headers: (content.match(/^#+\s/gm) || []).length,
    links: (content.match(/\[.*?\]\(.*?\)/g) || []).length,
    images: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
  };
}

function checkBasicStats(cnContent, enContent) {
  console.log('\n📊 基本统计比较:');
  
  const cnStats = getBasicStats(cnContent);
  const enStats = getBasicStats(enContent);
  
  console.log('   指标        中文版    英文版    差异');
  console.log('   ----        ------    ------    ----');
  console.log(`   行数        ${cnStats.lines.toString().padEnd(8)} ${enStats.lines.toString().padEnd(8)} ${Math.abs(cnStats.lines - enStats.lines)}`);
  console.log(`   字符数      ${cnStats.characters.toString().padEnd(8)} ${enStats.characters.toString().padEnd(8)} ${Math.abs(cnStats.characters - enStats.characters)}`);
  console.log(`   标题数      ${cnStats.headers.toString().padEnd(8)} ${enStats.headers.toString().padEnd(8)} ${Math.abs(cnStats.headers - enStats.headers)}`);
  console.log(`   链接数      ${cnStats.links.toString().padEnd(8)} ${enStats.links.toString().padEnd(8)} ${Math.abs(cnStats.links - enStats.links)}`);
  console.log(`   图片数      ${cnStats.images.toString().padEnd(8)} ${enStats.images.toString().padEnd(8)} ${Math.abs(cnStats.images - enStats.images)}`);
  
  // 简单的差异检查（允许一定容差）
  const headersDiff = Math.abs(cnStats.headers - enStats.headers);
  const linksDiff = Math.abs(cnStats.links - enStats.links);
  const imagesDiff = Math.abs(cnStats.images - enStats.images);
  
  return headersDiff <= 2 && linksDiff <= 3 && imagesDiff <= 1;
}

function main() {
  console.log('🔍 CloudBase AI ToolKit README 同步检查\n');
  console.log('=' * 50);
  
  // 检查文件存在性
  if (!checkFileExists()) {
    console.log('\n❌ 同步检查失败：文件缺失');
    process.exit(1);
  }
  
  // 读取文件内容
  const cnContent = readFile(README_CN);
  const enContent = readFile(README_EN);
  
  if (!cnContent || !enContent) {
    console.log('\n❌ 同步检查失败：无法读取文件内容');
    process.exit(1);
  }
  
  // 执行各项检查
  const structureOK = checkSectionStructure(cnContent, enContent);
  const termsOK = checkKeyTerms(cnContent, enContent);
  const navOK = checkLanguageNavigation(cnContent, enContent);
  const statsOK = checkBasicStats(cnContent, enContent);
  
  // 总结
  console.log('\n📋 同步检查总结:');
  console.log('=' * 30);
  console.log(`章节结构: ${structureOK ? '✅ 通过' : '❌ 失败'}`);
  console.log(`关键词检查: ${termsOK ? '✅ 通过' : '❌ 失败'}`);
  console.log(`语言导航: ${navOK ? '✅ 通过' : '❌ 失败'}`);
  console.log(`基本统计: ${statsOK ? '✅ 通过' : '⚠️  差异较大'}`);
  
  const allPassed = structureOK && termsOK && navOK && statsOK;
  
  if (allPassed) {
    console.log('\n🎉 同步检查通过！中英文 README 基本同步。');
    process.exit(0);
  } else {
    console.log('\n⚠️  同步检查发现问题，请参考 docs/README-SYNC.md 进行修复。');
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = {
  checkFileExists,
  checkSectionStructure,
  checkKeyTerms,
  checkLanguageNavigation,
  checkBasicStats
}; 