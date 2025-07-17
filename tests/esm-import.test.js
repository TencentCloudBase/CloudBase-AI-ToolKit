// ES 模块导入测试
import { test, expect } from 'vitest';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to wait for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('ESM import and library usage works correctly', async () => {
  console.log('Testing ESM import and library usage...');
  
  try {
    // 动态导入构建后的 ES 模块
    const serverModule = await import('../mcp/dist/index.js');
    console.log('✅ ES Module imported successfully');
    console.log('Available exports:', Object.keys(serverModule));
    
    expect(serverModule).toBeDefined();
    expect(typeof serverModule.createCloudBaseMcpServer).toBe('function');
    expect(typeof serverModule.getDefaultServer).toBe('function');
    
    // 创建服务器实例
    const server = serverModule.createCloudBaseMcpServer({
      name: 'test-server',
      version: '1.0.0',
      enableTelemetry: false // 测试时关闭遥测
    });
    
    expect(server).toBeDefined();
    console.log('✅ Server instance created successfully');
    
    console.log('✅ ESM import and library usage test passed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}, 90000);

test('ESM CLI executable and client-server integration works correctly', async () => {
  let transport = null;
  let client = null;
  
  try {
    // 注意：直接用 node 执行 dist/cli.js
    console.log('Testing ESM CLI executable and integration...');
    
    client = new Client({
      name: "test-client-esm-cli",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // 直接用 node 执行 CLI ESM 文件
    const cliEsmPath = join(__dirname, '../mcp/dist/cli.js');
    transport = new StdioClientTransport({
      command: 'node',
      args: [cliEsmPath]
    });

    // Connect client to server
    await client.connect(transport);
    await delay(3000);

    console.log('Testing ESM CLI functionality...');
    // List available tools
    const toolsResult = await client.listTools();
    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    console.log(`Found ${toolsResult.tools.length} tools in ESM CLI build`);

    // Look for the searchKnowledgeBase tool
    const searchTool = toolsResult.tools.find(tool => tool.name === 'searchKnowledgeBase');
    if (searchTool) {
      console.log('✅ Found searchKnowledgeBase tool');
      expect(searchTool.name).toBe('searchKnowledgeBase');
    }

    // 新增：测试 login 工具调用，超时不算失败
    try {
      console.log('Testing login tool call (may timeout)...');
      const loginResult = await Promise.race([
        client.callTool('login', { provider: 'cloudbase' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('login timeout')), 10000))
      ]);
      console.log('login tool call result:', loginResult);
    } catch (err) {
      if (err && err.message && err.message.includes('timeout')) {
        console.warn('⚠️ login tool call timeout (acceptable)');
      } else {
        throw err;
      }
    }
    
    console.log('✅ ESM CLI executable and integration test passed');
    
  } catch (error) {
    console.error('❌ ESM CLI/integration test failed:', error);
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
}, 120000); 