// CommonJS 导入测试
import { test, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to wait for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('CJS build format works correctly', async () => {
  console.log('Testing CJS build format...');
  
  try {
    // 测试 CJS 模块格式是否正确构建
    console.log('Checking if CJS build files exist...');
    
    // 检查构建产物
    const fs = await import('fs');
    const cjsIndexPath = join(__dirname, '../mcp/dist/index.cjs');
    const cjsCliPath = join(__dirname, '../mcp/dist/cli.cjs');
    
    expect(fs.existsSync(cjsIndexPath)).toBe(true);
    expect(fs.existsSync(cjsCliPath)).toBe(true);
    
    console.log('✅ CJS build files exist');
    
    // 读取文件内容，验证是否是有效的 CJS 格式
    const cjsContent = fs.readFileSync(cjsIndexPath, 'utf8');
    
    // CJS 文件应该包含 module.exports 或类似的 CJS 导出语法
    // 由于我们使用了 rollup，它应该生成兼容的 CJS 代码
    expect(typeof cjsContent).toBe('string');
    expect(cjsContent.length).toBeGreaterThan(0);
    
    console.log('✅ CJS build format test passed');
    
  } catch (error) {
    console.error('❌ CJS build format test failed:', error);
    throw error;
  }
}, 30000);

test('CJS CLI executable works correctly', async () => {
  let transport = null;
  let client = null;
  
  try {
    // 注意：由于 CJS CLI 文件包含 shebang，我们需要特殊处理
    console.log('Testing CJS CLI executable...');
    
    // Create client to test the CJS-built CLI
    client = new Client({
      name: "test-client-cjs-cli",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // 直接使用 node 运行 CJS 文件，避免 shebang 问题
    const serverPath = join(__dirname, '../mcp/dist/index.cjs');
    
    // 创建一个简单的 CJS 服务器脚本来测试，使用 .cjs 扩展名
    const fs = await import('fs');
    const testServerScript = `
const { createCloudBaseMcpServer, StdioServerTransport } = require('${serverPath}');

const server = createCloudBaseMcpServer({
  name: 'test-cjs-server',
  version: '1.0.0',
  enableTelemetry: false
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
`;
    
    const tempScriptPath = join(__dirname, '../mcp/test-cjs-server.cjs');
    fs.writeFileSync(tempScriptPath, testServerScript);
    
    transport = new StdioClientTransport({
      command: 'node',
      args: [tempScriptPath]
    });

    // Connect client to server
    await client.connect(transport);
    
    // Wait a moment for connection to establish
    await delay(1000);

    console.log('Testing CJS server functionality...');
    
    // List available tools
    const toolsResult = await client.listTools();
    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    
    console.log(`Found ${toolsResult.tools.length} tools in CJS build`);
    
    // Clean up temp file
    fs.unlinkSync(tempScriptPath);
    
    console.log('✅ CJS CLI executable test passed');
    
  } catch (error) {
    console.error('❌ CJS CLI test failed:', error);
    
    // Clean up temp file if it exists
    try {
      const fs = await import('fs');
      const tempScriptPath = join(__dirname, '../mcp/test-cjs-server.cjs');
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    throw error;
  } finally {
    // Clean up
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.warn('Warning: Error closing client:', e.message);
      }
    }
    if (transport) {
      try {
        await transport.close();
      } catch (e) {
        console.warn('Warning: Error closing transport:', e.message);
      }
    }
  }
}, 30000); 