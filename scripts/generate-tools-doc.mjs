#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_PAGE_URL = 'https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/scripts/tools.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/TencentCloudBase/CloudBase-AI-ToolKit/main/scripts/tools.json';

async function readToolsJson() {
  // Prefer remote source
  try {
    if (typeof fetch === 'function') {
      const res = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`fetch failed with ${res.status}`);
      const json = await res.json();
      console.log(`🌐 使用远程 tools.json: ${GITHUB_PAGE_URL}`);
      return json;
    }
  } catch (e) {
    console.warn('⚠️ 远程获取 tools.json 失败，回退到本地文件。', e && e.message ? e.message : e);
  }
  // Fallback to local
  const toolsJsonPath = path.join(__dirname, 'tools.json');
  if (!fs.existsSync(toolsJsonPath)) {
    throw new Error(`tools.json not found at ${toolsJsonPath}. Please run scripts/generate-tools-json.mjs first.`);
  }
  const raw = fs.readFileSync(toolsJsonPath, 'utf8');
  console.log(`📄 使用本地 tools.json: ${toolsJsonPath}`);
  return JSON.parse(raw);
}

function escapeMd(text = '') {
  return String(text)
    .replace(/[\r\n]+/g, '<br/>')
    .replace(/\|/g, '\\|');
}

function typeOfSchema(schema) {
  if (!schema) return 'unknown';
  if (schema.type) {
    if (schema.type === 'array') {
      const itemType = schema.items ? typeOfSchema(schema.items) : 'any';
      return `array<${itemType}>`;
    }
    return schema.type;
  }
  if (schema.anyOf) return 'union';
  if (schema.oneOf) return 'union';
  if (schema.allOf) return 'intersection';
  return 'unknown';
}

function renderUnion(schema) {
  const variants = schema.anyOf || schema.oneOf || [];
  return variants.map(s => typeOfSchema(s)).join(' | ');
}

function renderEnum(schema) {
  if (Array.isArray(schema.enum)) {
    return schema.enum.map(v => JSON.stringify(v)).join(', ');
  }
  if (schema.const !== undefined) {
    return `const ${JSON.stringify(schema.const)}`;
  }
  return '';
}

function renderDefault(schema) {
  return schema && schema.default !== undefined ? JSON.stringify(schema.default) : '';
}

function renderPropertyRow(name, propSchema, requiredSet) {
  const isRequired = requiredSet.has(name) ? '是' : '';
  let typeText = typeOfSchema(propSchema);
  if ((propSchema.anyOf || propSchema.oneOf) && !propSchema.type) {
    typeText = renderUnion(propSchema);
  }
  const enumText = renderEnum(propSchema);
  const defaultText = renderDefault(propSchema);
  const desc = escapeMd(propSchema.description || '');
  return `| \`${name}\` | ${escapeMd(typeText)} | ${isRequired} | ${desc} | ${escapeMd(enumText)} | ${escapeMd(defaultText)} |`;
}

function hasNestedProps(propSchema) {
  return propSchema && propSchema.type === 'object' && propSchema.properties && Object.keys(propSchema.properties).length > 0;
}

function renderNestedProps(propName, propSchema) {
  const nested = propSchema.properties || {};
  const requiredSet = new Set(propSchema.required || []);
  const lines = [];
  lines.push(`- 详细字段（${propName}）:`);
  lines.push('');
  lines.push('| 字段 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |');
  lines.push('|------|------|------|------|-----------|--------|');
  for (const [k, v] of Object.entries(nested)) {
    lines.push(renderPropertyRow(`${propName}.${k}`, v, requiredSet));
  }
  lines.push('');
  return lines.join('\n');
}

function renderToolDetails(tool) {
  const lines = [];
  lines.push(`### \`${tool.name}\``);
  if (tool.description) {
    lines.push(tool.description.trim());
  }
  const schema = tool.inputSchema || {};
  if (schema && schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0) {
    const props = schema.properties;
    const requiredSet = new Set(schema.required || []);
    lines.push('');
    lines.push('参数');
    lines.push('');
    lines.push('| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |');
    lines.push('|--------|------|------|------|-----------|--------|');
    for (const [name, propSchema] of Object.entries(props)) {
      lines.push(renderPropertyRow(name, propSchema, requiredSet));
    }
    lines.push('');
    // Render nested object fields (one level)
    for (const [name, propSchema] of Object.entries(props)) {
      if (hasNestedProps(propSchema)) {
        lines.push(renderNestedProps(name, propSchema));
      }
    }
  } else {
    lines.push('');
    lines.push('参数: 无参数');
    lines.push('');
  }
  return lines.join('\n');
}

function renderDoc(toolsJson) {
  const { tools = [] } = toolsJson;
  const lines = [];
  lines.push('# MCP 工具（自动生成）');
  lines.push('');
  lines.push(`当前包含 ${tools.length} 个工具。`);
  lines.push('');
  lines.push(`源数据: [tools.json](${GITHUB_PAGE_URL})（离线回退: \`scripts/tools.json\`）`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 工具总览');
  lines.push('');
  lines.push('| 名称 | 描述 |');
  lines.push('|------|------|');
  for (const t of tools) {
    lines.push(`| \`${t.name}\` | ${escapeMd(t.description || '')} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 详细规格');
  lines.push('');
  for (const t of tools) {
    lines.push(renderToolDetails(t));
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  const toolsJson = readToolsJson();
  const markdown = renderDoc(toolsJson);
  const outputPath = path.join(__dirname, '..', 'doc', 'mcp-tools.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ 文档已生成: ${outputPath}`);
}

try {
  main();
} catch (e) {
  console.error('❌ 生成文档失败:', e && e.message ? e.message : e);
  process.exit(1);
}
