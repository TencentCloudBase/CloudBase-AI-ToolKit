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
    .replace(/&/g, '&amp;')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
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
  const baseDesc = schema.description ? escapeMd(schema.description) : '';
  const extras = [
    enumText ? `可填写的值: ${escapeMd(enumText)}` : '',
    defText ? `默认值: ${escapeMd(defText)}` : ''
  ].filter(Boolean).join('；');
  let mergedDesc = [baseDesc, extras].filter(Boolean).join(' ');
  // For extremely long descriptions (e.g., mermaid diagram), move to details block per-tool
  if (name === 'mermaidDiagram' && schema.description && schema.description.includes('示例：')) {
    const [head] = schema.description.split('示例：');
    mergedDesc = escapeMd(head.trim());
  }
  rows.push({ name, type: typeText, required: isRequired ? '是' : '', desc: mergedDesc });

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
    lines.push('<table>');
    lines.push('<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>');
    lines.push('<tbody>');
    const allRows = [];
    const extrasBlocks = [];
    for (const [name, propSchema] of Object.entries(props)) {
      allRows.push(...flattenSchemaRows(name, propSchema, requiredSet.has(name)));
      // Add long mermaid example block under the table
      if (name === 'mermaidDiagram' && propSchema.description && propSchema.description.includes('示例：')) {
        const example = propSchema.description.split('示例：')[1];
        if (example) {
          const code = String(example).trim();
          extrasBlocks.push('<details><summary>示例</summary>');
          extrasBlocks.push('');
          extrasBlocks.push('```text');
          extrasBlocks.push(code);
          extrasBlocks.push('```');
          extrasBlocks.push('</details>');
          extrasBlocks.push('');
        }
      }
    }
    for (const r of allRows) {
      lines.push(`<tr><td><code>${r.name}</code></td><td>${escapeMd(r.type)}</td><td>${r.required}</td><td>${r.desc}</td></tr>`);
    }
    lines.push('</tbody>');
    lines.push('</table>');
    lines.push('');
    if (extrasBlocks.length > 0) {
      lines.push(...extrasBlocks);
    }
  } else {
    lines.push('');
    lines.push('#### 参数');
    lines.push('');
    lines.push('<table>');
    lines.push('<thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>');
    lines.push('<tbody>');
    lines.push('<tr><td colspan="4">无</td></tr>');
    lines.push('</tbody>');
    lines.push('</table>');
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
  lines.push('<table>');
  lines.push('<thead><tr><th>名称</th><th>描述</th></tr></thead>');
  lines.push('<tbody>');
  for (const t of tools) {
    lines.push(`<tr><td><code>${t.name}</code></td><td>${escapeMd(t.description || '')}</td></tr>`);
  }
  lines.push('</tbody>');
  lines.push('</table>');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 云端 MCP 配置说明');
  lines.push('');
  lines.push('');
  lines.push('### 环境变量配置');
  lines.push('');
  lines.push('使用云端 MCP 需要配置以下环境变量：');
  lines.push('');
  lines.push('| 环境变量 | 说明 | 获取方式 |');
  lines.push('|---------|------|---------|');
  lines.push('| `TENCENTCLOUD_SECRETID` | 腾讯云 SecretId | [获取腾讯云 API 密钥](https://console.cloud.tencent.com/cam/capi) |');
  lines.push('| `TENCENTCLOUD_SECRETKEY` | 腾讯云 SecretKey | [获取腾讯云 API 密钥](https://console.cloud.tencent.com/cam/capi) |');
  lines.push('| `TENCENTCLOUD_SESSIONTOKEN` | 非必填，腾讯云临时密钥 Token（可选） | 仅在使用临时密钥时需要，可通过 [STS 服务](https://console.cloud.tencent.com/cam/capi) 获取 |');
  lines.push('| `CLOUDBASE_ENV_ID` | 云开发环境 ID | [获取云开发环境 ID](https://tcb.cloud.tencent.com/dev) |');
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
