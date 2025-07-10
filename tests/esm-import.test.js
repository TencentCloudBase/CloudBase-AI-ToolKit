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

test('MCP client-server integration works correctly', async () => {
  let transport = null;
  let client = null;
  
  try {
    console.log('Testing MCP client-server integration...');
    
    // Create client
    client = new Client({
      name: "test-client",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Create stdio transport that spawns the server as a child process
    // 注意：这里我们仍然需要用子进程，因为客户端需要连接到一个独立的服务器进程
    const serverPath = join(__dirname, '../mcp/dist/cli.cjs');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath]
    });

    // Connect client to server
    await client.connect(transport);
    
    // Wait longer for connection to establish in CI environment
    await delay(3000);

    console.log('Testing MCP operations...');
    
    // List available tools (this should work)
    const toolsResult = await client.listTools();
    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    
    console.log(`Found ${toolsResult.tools.length} tools`);
    
    // Look for the searchKnowledgeBase tool
    const searchTool = toolsResult.tools.find(tool => tool.name === 'searchKnowledgeBase');
    if (searchTool) {
      console.log('✅ Found searchKnowledgeBase tool');
      expect(searchTool.name).toBe('searchKnowledgeBase');
    }

    // Note: We're not testing listResources() and listPrompts() since our server 
    // only declares 'tools' capability and may not properly handle these requests
    
    console.log('✅ MCP client-server integration test passed');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
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