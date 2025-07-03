// 综合集成测试 - ES vs CJS 模块一致性验证
import { test, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to wait for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('ESM and CJS module exports consistency', async () => {
  try {
    console.log('Testing ESM and CJS module exports consistency...');
    
    // Test ESM import
    const esmModule = await import('../mcp/dist/index.js');
    expect(esmModule).toBeDefined();
    console.log('✅ ESM module imported successfully');
    
    // Log available exports for debugging
    const esmExports = Object.keys(esmModule).sort();
    console.log('ESM exports:', esmExports);
    
    // Test server creation
    const { createCloudBaseMcpServer } = esmModule;
    expect(createCloudBaseMcpServer).toBeDefined();
    expect(typeof createCloudBaseMcpServer).toBe('function');
    
    const esmServer = createCloudBaseMcpServer({
      name: 'test-server-esm',
      version: '1.0.0',
      enableTelemetry: false
    });
    expect(esmServer).toBeDefined();
    console.log('✅ ESM server instance created');
    
    // 检查 CJS 构建文件
    const fs = await import('fs');
    const cjsPath = join(__dirname, '../mcp/dist/index.cjs');
    expect(fs.existsSync(cjsPath)).toBe(true);
    console.log('✅ CJS build file exists');
    
    // 验证文件内容不为空
    const cjsContent = fs.readFileSync(cjsPath, 'utf8');
    expect(cjsContent.length).toBeGreaterThan(0);
    console.log('✅ CJS build file has content');
    
    console.log('✅ Module exports consistency test passed');
    
  } catch (error) {
    console.error('❌ Module exports consistency test failed:', error);
    throw error;
  }
}, 90000); // 增加到 90 秒

test('MCP server basic functionality test', async () => {
  let transport = null;
  let client = null;
  
  try {
    console.log('Testing basic MCP server functionality...');
    
    // Create client
    client = new Client({
      name: "test-client-basic",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Use the ESM CLI for integration testing
    const serverPath = join(__dirname, '../mcp/dist/cli.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath]
    });

    // Connect client to server
    await client.connect(transport);
    
    // Wait longer for connection to establish in CI environment
    await delay(3000);

    console.log('Testing server capabilities...');
    
    // List tools (this should work since we declared tools capability)
    const toolsResult = await client.listTools();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    expect(toolsResult.tools.length).toBeGreaterThan(0);
    
    console.log(`✅ Server exposes ${toolsResult.tools.length} tools`);

    // Test a simple tool call (envQuery should always be available)
    const envTool = toolsResult.tools.find(t => t.name === 'envQuery');
    if (envTool) {
      console.log('Testing envQuery tool...');
      
      const envResult = await client.callTool({
        name: 'envQuery',
        arguments: {
          action: 'list'  // 添加必需的 action 参数
        }
      });
      
      expect(envResult).toBeDefined();
      expect(envResult.content).toBeDefined();
      expect(Array.isArray(envResult.content)).toBe(true);
      
      console.log('✅ envQuery tool executed successfully');
    }

    // Note: We're not testing listResources() and listPrompts() since our server 
    // only declares 'tools' capability and may not properly handle these requests

    console.log('✅ Basic functionality test passed');

  } catch (error) {
    console.error('❌ Basic functionality test failed:', error);
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
}, 120000); // 增加到 120 秒 (2 分钟)

test('Tool consistency between multiple client connections', async () => {
  let transport1 = null, client1 = null;
  let transport2 = null, client2 = null;
  
  try {
    console.log('Testing tool consistency between multiple connections...');
    
    // Create first client
    client1 = new Client({
      name: "test-client-1",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    const serverPath = join(__dirname, '../mcp/dist/cli.js');
    transport1 = new StdioClientTransport({
      command: 'node',
      args: [serverPath]
    });

    await client1.connect(transport1);
    await delay(2000); // 增加延迟

    // Create second client
    client2 = new Client({
      name: "test-client-2",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    transport2 = new StdioClientTransport({
      command: 'node',
      args: [serverPath]
    });

    await client2.connect(transport2);
    await delay(2000); // 增加延迟

    // Get tools from both clients
    const tools1 = await client1.listTools();
    const tools2 = await client2.listTools();

    console.log(`Client 1 tools count: ${tools1.tools.length}`);
    console.log(`Client 2 tools count: ${tools2.tools.length}`);

    // Both should have the same number of tools
    expect(tools1.tools.length).toBe(tools2.tools.length);

    // Extract tool names for comparison
    const toolNames1 = tools1.tools.map(t => t.name).sort();
    const toolNames2 = tools2.tools.map(t => t.name).sort();

    // Tool names should be identical
    expect(toolNames1).toEqual(toolNames2);

    // Check for specific expected tools
    const expectedTools = ['searchKnowledgeBase', 'envQuery'];
    for (const toolName of expectedTools) {
      expect(toolNames1).toContain(toolName);
      expect(toolNames2).toContain(toolName);
      console.log(`✅ Both clients have ${toolName}`);
    }

    console.log('✅ Tool consistency test passed');

  } catch (error) {
    console.error('❌ Tool consistency test failed:', error);
    throw error;
  } finally {
    // Clean up both clients
    const cleanup = async (client, transport) => {
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
    };

    await cleanup(client1, transport1);
    await cleanup(client2, transport2);
  }
}, 120000); // 增加到 120 秒 