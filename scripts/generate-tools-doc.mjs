#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_PAGE_URL = 'https://github.com/TencentCloudBase/CloudBase-AI-ToolKit/blob/main/scripts/tools.json';

function readToolsJson() {
  const toolsJsonPath = path.join(__dirname, 'tools.json');
  if (!fs.existsSync(toolsJsonPath)) {
    throw new Error(`tools.json not found at ${toolsJsonPath}. Please run scripts/generate-tools-json.mjs first.`);
  }
  const raw = fs.readFileSync(toolsJsonPath, 'utf8');
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

function hasNestedProps(propSchema) {
  return propSchema && propSchema.type === 'object' && propSchema.properties && Object.keys(propSchema.properties).length > 0;
}

function renderSchemaAsBullets(name, schema, isRequired, indent = 0, isTopLevel = false) {
  const lines = [];
  const maxIndent = 2; // cap visual nesting to avoid overly deep indentation
  const cappedIndent = Math.min(indent, maxIndent);
  const pad = '    '.repeat(cappedIndent); // 4 spaces for clearer nesting
  const t = (schema.anyOf || schema.oneOf) && !schema.type ? renderUnion(schema) : typeOfSchema(schema);
  const enumText = renderEnum(schema);
  const defText = renderDefault(schema);
  const hasMeta = isRequired || schema.description || enumText || defText;

  // Field title line
  lines.push(`${pad}- \`${name}\``);

  // Meta sub-bullets
  const subPad = '    '.repeat(Math.min(cappedIndent + 1, maxIndent));
  lines.push(`${subPad}- type: ${escapeMd(t)}`);
  if (isRequired) lines.push(`${subPad}- required: true`);
  if (schema.description) lines.push(`${subPad}- desc: ${escapeMd(schema.description)}`);
  if (enumText) lines.push(`${subPad}- enum: ${escapeMd(enumText)}`);
  if (defText) lines.push(`${subPad}- default: ${escapeMd(defText)}`);

  // Array items
  if (schema.type === 'array') {
    const itemType = schema.items ? ((schema.items.anyOf || schema.items.oneOf) && !schema.items.type ? renderUnion(schema.items) : typeOfSchema(schema.items)) : 'any';
    lines.push(`${subPad}- items: ${escapeMd(itemType)}`);
    if (schema.items && schema.items.type === 'object' && schema.items.properties) {
      const itemReq = new Set(schema.items.required || []);
      for (const [childName, childSchema] of Object.entries(schema.items.properties)) {
        // keep child visuals at capped indent
        lines.push(...renderSchemaAsBullets(`${name}[].${childName}`, childSchema, itemReq.has(childName), maxIndent));
      }
    }
  }

  // Object properties
  if (schema.type === 'object' && schema.properties) {
    lines.push(`${subPad}- properties:`);
    const requiredSet = new Set(schema.required || []);
    for (const [childName, childSchema] of Object.entries(schema.properties)) {
      // keep child visuals at capped indent
      lines.push(...renderSchemaAsBullets(`${name}.${childName}`, childSchema, requiredSet.has(childName), maxIndent));
    }
  }

  // Add blank line after each top-level field for readability
  if (isTopLevel) lines.push('');

  return lines;
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
    for (const [name, propSchema] of Object.entries(props)) {
      lines.push(...renderSchemaAsBullets(name, propSchema, requiredSet.has(name), 0, true));
    }
    lines.push('');
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
  lines.push(`源数据: [tools.json](${GITHUB_PAGE_URL})`);
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
