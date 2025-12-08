#!/usr/bin/env node

import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const RULES_DIR = path.join(ROOT_DIR, 'config/rules');
const PROMPTS_DIR = path.join(ROOT_DIR, 'doc/prompts');
const CONFIG_FILE = path.join(PROMPTS_DIR, 'config.yaml');
const SIDEBAR_FILE = path.join(ROOT_DIR, 'doc/sidebar.json');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content: content.trim() };
  }
  
  const frontmatterText = match[1];
  const body = match[2];
  
  // Parse YAML frontmatter
  let frontmatter = {};
  try {
    frontmatter = yaml.load(frontmatterText) || {};
  } catch (e) {
    console.warn(`Warning: Failed to parse frontmatter: ${e.message}`);
  }
  
  return { frontmatter, content: body.trim() };
}

/**
 * Extract "How to use" section from content
 * Usually before "## How to use this skill" or similar sections
 * Excludes "## When to use this skill" section and file header (title/description)
 */
function extractHowToUse(content) {
  // First, find and exclude "When to use this skill" section (including everything until next ##)
  const whenToUsePattern = /^##\s+When\s+to\s+use\s+this\s+skill[\s\S]*?(?=\n##|\n---|$)/im;
  let cleanedContent = content;
  const whenToUseMatch = content.match(whenToUsePattern);
  if (whenToUseMatch) {
    // Remove the "When to use this skill" section and everything after it until next section
    cleanedContent = content.substring(0, whenToUseMatch.index).trim();
  }
  
  // Skip file header (title and description after frontmatter)
  // Usually starts with # Title, followed by description paragraph, then ## sections
  const headerPattern = /^#\s+[^\n]+\n\n[^\n]+\n\n/;
  const headerMatch = cleanedContent.match(headerPattern);
  if (headerMatch) {
    cleanedContent = cleanedContent.substring(headerMatch[0].length).trim();
  }
  
  // If after removing header, content starts with ##, there's no "how to use" section
  // Return null to skip adding it
  if (cleanedContent.match(/^##/)) {
    return null;
  }
  
  // Look for sections that indicate the start of the actual prompt content
  const patterns = [
    /^##\s+How\s+to\s+use\s+this\s+skill/i,
    /^##\s+Implementation/i,
    /^##\s+Scenarios/i,
    /^##\s+Core\s+Concepts/i,
  ];
  
  let howToUseEnd = cleanedContent.length;
  
  for (const pattern of patterns) {
    const match = cleanedContent.match(pattern);
    if (match && match.index < howToUseEnd) {
      howToUseEnd = match.index;
    }
  }
  
  const howToUse = cleanedContent.substring(0, howToUseEnd).trim();
  
  // If no clear section found or content is too short, return empty
  // (we don't want to show file header in "How to use" section)
  if (!howToUse || howToUse.length < 50) {
    return null;
  }
  
  return howToUse;
}

/**
 * Read all markdown files from a directory
 */
async function readRuleFiles(ruleDir) {
  const files = fs.readdirSync(ruleDir)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => {
      // Put rule.md first if it exists
      if (a === 'rule.md') return -1;
      if (b === 'rule.md') return 1;
      return a.localeCompare(b);
    });
  
  const fileContents = [];
  
  for (const file of files) {
    const filePath = path.join(ruleDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, content: body } = parseFrontmatter(content);
    
    fileContents.push({
      filename: file,
      frontmatter,
      content: body,
    });
  }
  
  return fileContents;
}

/**
 * Generate MDX content for a single rule
 */
function generateMDX(ruleConfig, files) {
  const { title, description, prompts = [] } = ruleConfig;
  
  let mdx = `# ${title}\n\n${description}\n\n`;
  
  // How to use section - just a brief note with link
  mdx += `## 如何使用\n\n`;
  mdx += `查看[如何使用提示词](/ai/cloudbase-ai-toolkit/prompts/how-to-use)了解详细的使用方法。\n\n`;
  
  // Extract how to use from rule.md (if exists) or first file
  const ruleFile = files.find(f => f.filename === 'rule.md') || files[0];
  if (ruleFile) {
    const howToUse = extractHowToUse(ruleFile.content);
    if (howToUse) {
      mdx += `${howToUse}\n\n`;
    }
  }
  
  // Test prompts section
  if (prompts.length > 0) {
    mdx += `### 测试提示词\n\n`;
    mdx += `你可以使用以下提示词来测试：\n\n`;
    for (const prompt of prompts) {
      mdx += `- "${prompt}"\n`;
    }
    mdx += `\n`;
  }
  
  // Prompt section
  mdx += `## 提示词\n\n`;
  
  if (files.length === 1) {
    // Single file - show content in code block with filename as title
    const content = files[0].content;
    const filename = files[0].filename;
    // In markdown code blocks, content should be protected from JSX parsing
    // But MDX might still try to parse JSX-like syntax, so we escape < and >
    // Use 4 backticks instead of 3 to wrap content that contains code blocks (```)
    // Escape & first to avoid double-escaping
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    mdx += `\`\`\`\`markdown title="${filename}"\n${escapedContent}\n\`\`\`\`\n`;
  } else {
    // Multiple files - use Tabs component
    mdx += `import Tabs from '@theme/Tabs';\n`;
    mdx += `import TabItem from '@theme/TabItem';\n\n`;
    mdx += `<Tabs>\n`;
    
    for (const file of files) {
      const value = file.filename.replace('.md', '').replace(/[^a-z0-9-]/gi, '-');
      const label = file.filename.replace('.md', '');
      const filename = file.filename;
      // In markdown code blocks, content should be protected from JSX parsing
      // But MDX might still try to parse JSX-like syntax, so we escape < and >
      // Use 4 backticks instead of 3 to wrap content that contains code blocks (```)
      // Escape & first to avoid double-escaping
      const escapedContent = file.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      mdx += `<TabItem value="${value}" label="${label}">\n\n`;
      // Show content in code block with filename as title
      mdx += `\`\`\`\`markdown title="${filename}"\n${escapedContent}\n\`\`\`\`\n\n`;
      mdx += `</TabItem>\n\n`;
    }
    
    mdx += `</Tabs>\n`;
  }
  
  return mdx;
}

/**
 * Update sidebar.json with prompts entries grouped by category
 */
function updateSidebar(config) {
  if (!fs.existsSync(SIDEBAR_FILE)) {
    console.warn(`Warning: Sidebar file not found: ${SIDEBAR_FILE}`);
    return;
  }
  
  // Read sidebar JSON file
  const sidebarContent = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  let sidebar = JSON.parse(sidebarContent);
  
  // Get categories from config
  const categories = (config.categories || []).sort((a, b) => (a.order || 999) - (b.order || 999));
  
  // Group rules by category
  const rulesByCategory = {};
  for (const rule of config.rules) {
    const mdxFile = path.join(PROMPTS_DIR, `${rule.id}.mdx`);
    if (!fs.existsSync(mdxFile)) {
      continue;
    }
    
    const categoryId = rule.category || 'other';
    if (!rulesByCategory[categoryId]) {
      rulesByCategory[categoryId] = [];
    }
    rulesByCategory[categoryId].push(rule);
  }
  
  // Sort rules within each category
  for (const categoryId in rulesByCategory) {
    rulesByCategory[categoryId].sort((a, b) => (a.order || 999) - (b.order || 999));
  }
  
  // Build category items
  const categoryItems = categories.map(category => {
    const rules = rulesByCategory[category.id] || [];
    const items = rules.map(rule => `ai/cloudbase-ai-toolkit/prompts/${rule.id}`);
    
    return {
      type: 'category',
      label: category.label,
      collapsible: true,
      collapsed: true,
      items: items
    };
  });
  
  // Add uncategorized rules if any
  const uncategorizedRules = rulesByCategory['other'] || [];
  if (uncategorizedRules.length > 0) {
    const items = uncategorizedRules
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .map(rule => `ai/cloudbase-ai-toolkit/prompts/${rule.id}`);
    
    categoryItems.push({
      type: 'category',
      label: '其他',
      collapsible: true,
      collapsed: true,
      items: items
    });
  }
  
  // Find the main category
  const mainCategory = sidebar.find(item => item.label === 'CloudBase AI Toolkit');
  if (!mainCategory || !mainCategory.items) {
    console.warn('Warning: Could not find main category in sidebar.json');
    return;
  }
  
  // Create prompts category with subcategories
  // Add "How to use" document at the beginning
  const howToUseItem = 'ai/cloudbase-ai-toolkit/prompts/how-to-use';
  const promptsCategoryItems = [howToUseItem, ...categoryItems];
  const promptsCategory = {
    type: 'category',
    label: 'AI 提示词',
    collapsible: true,
    collapsed: true,
    items: promptsCategoryItems
  };
  
  // Find or update prompts category
  let promptsCategoryIndex = mainCategory.items.findIndex(
    item => item.type === 'category' && (item.label === '提示词' || item.label === 'AI 提示词')
  );
  
  if (promptsCategoryIndex >= 0) {
    // Update existing prompts category
    mainCategory.items[promptsCategoryIndex] = promptsCategory;
  } else {
    // Find the position after "MCP" category and before "教程" category
    const tutorialIndex = mainCategory.items.findIndex(
      item => item.type === 'category' && item.label === '教程'
    );
    
    if (tutorialIndex >= 0) {
      mainCategory.items.splice(tutorialIndex, 0, promptsCategory);
    } else {
      // Insert before FAQ
      const faqIndex = mainCategory.items.findIndex(
        item => typeof item === 'string' && item.includes('faq')
      );
      if (faqIndex >= 0) {
        mainCategory.items.splice(faqIndex, 0, promptsCategory);
      } else {
        // Append to the end
        mainCategory.items.push(promptsCategory);
      }
    }
  }
  
  // Write back as formatted JSON
  fs.writeFileSync(SIDEBAR_FILE, JSON.stringify(sidebar, null, 2) + '\n', 'utf8');
  console.log(`Updated: ${SIDEBAR_FILE}`);
}

/**
 * Main function
 */
async function main() {
  // Read config
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`Config file not found: ${CONFIG_FILE}`);
    process.exit(1);
  }
  
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = yaml.load(configContent);
  
  if (!config.rules || !Array.isArray(config.rules)) {
    console.error('Invalid config: rules array not found');
    process.exit(1);
  }
  
  // Ensure prompts directory exists
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
  
  // Process each rule
  for (const ruleConfig of config.rules) {
    const { id, ruleDir } = ruleConfig;
    // Use ruleDir if specified, otherwise use id as directory name
    const actualRuleDir = path.join(RULES_DIR, ruleDir || id);
    
    if (!fs.existsSync(actualRuleDir)) {
      console.warn(`Warning: Rule directory not found: ${actualRuleDir}`);
      continue;
    }
    
    // Read all markdown files
    const files = await readRuleFiles(actualRuleDir);
    
    if (files.length === 0) {
      console.warn(`Warning: No markdown files found in ${actualRuleDir}`);
      continue;
    }
    
    // Generate MDX content
    const mdxContent = generateMDX(ruleConfig, files);
    
    // Write to file
    const outputFile = path.join(PROMPTS_DIR, `${id}.mdx`);
    fs.writeFileSync(outputFile, mdxContent, 'utf8');
    
    console.log(`Generated: ${outputFile}`);
  }
  
  // Update sidebar
  updateSidebar(config);
  
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

