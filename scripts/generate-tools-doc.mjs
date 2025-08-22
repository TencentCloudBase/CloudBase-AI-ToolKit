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
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function typeOfSchema(schema) {
  if (!schema) return 'unknown';
  if (schema.type) {
    if (schema.type === 'array') {
      const itemType = schema.items ? typeOfSchema(schema.items) : 'any';
      return `array of ${itemType}`;
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

function renderSchemaAsHeadings(name, schema, isRequired, depth = 0) {
  // Not used in table mode; kept for potential future use
  return [];
}

function flattenSchemaRows(name, schema, isRequired) {
  const rows = [];
  const typeText = (schema.anyOf || schema.oneOf) && !schema.type ? renderUnion(schema) : typeOfSchema(schema);
  const enumText = renderEnum(schema);
  const defText = renderDefault(schema);
  rows.push({
    name,
    type: typeText,
    required: isRequired ? '是' : '',
    desc: schema.description ? escapeMd(schema.description) : '',
    enum: enumText ? escapeMd(enumText) : '',
    def: defText ? escapeMd(defText) : ''
  });

  if (schema.type === 'array' && schema.items) {
    const item = schema.items;
    if (item.type === 'object' && item.properties) {
      const req = new Set(item.required || []);
      for (const [k, v] of Object.entries(item.properties)) {
        rows.push(...flattenSchemaRows(`${name}[].${k}`, v, req.has(k)));
      }
    }
  }

  if (schema.type === 'object' && schema.properties) {
    const req = new Set(schema.required || []);
    for (const [k, v] of Object.entries(schema.properties)) {
      rows.push(...flattenSchemaRows(`${name}.${k}`, v, req.has(k)));
    }
  }
  return rows;
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
    lines.push('#### 参数');
    lines.push('');
    lines.push('| 参数名 | 类型 | 必填 | 说明 | 枚举/常量 | 默认值 |');
    lines.push('|--------|------|------|------|-----------|--------|');
    const allRows = [];
    for (const [name, propSchema] of Object.entries(props)) {
      allRows.push(...flattenSchemaRows(name, propSchema, requiredSet.has(name)));
    }
    for (const r of allRows) {
      lines.push(`| \`${r.name}\` | ${r.type} | ${r.required} | ${r.desc} | ${r.enum} | ${r.def} |`);
    }
    lines.push('');
  } else {
    lines.push('');
    lines.push('#### 参数');
    lines.push('');
    lines.push('无');
    lines.push('');
  }
  lines.push('---');
  return lines.join('\n');
}

function renderDoc(toolsJson) {
  const { tools = [] } = toolsJson;
  const lines = [];
  lines.push('# MCP 工具');
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
