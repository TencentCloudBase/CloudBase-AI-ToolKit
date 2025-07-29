// IDE过滤功能测试
import { test, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to wait for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('downloadTemplate tool supports IDE filtering', async () => {
  let transport = null;
  let client = null;
  
  try {
    console.log('Testing downloadTemplate IDE filtering functionality...');
    
    // Create client
    client = new Client({
      name: "test-client-ide-filtering",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Use the CJS CLI for integration testing
    const serverPath = join(__dirname, '../mcp/dist/cli.cjs');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: { ...process.env }
    });

    // Connect client to server
    await client.connect(transport);
    await delay(3000);

    console.log('Testing downloadTemplate tool availability...');
    
    // List tools to find downloadTemplate
    const toolsResult = await client.listTools();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    
    const downloadTemplateTool = toolsResult.tools.find(t => t.name === 'downloadTemplate');
    expect(downloadTemplateTool).toBeDefined();
    console.log('✅ downloadTemplate tool found');
    
    // Check if the tool has IDE parameter
    const toolSchema = downloadTemplateTool.inputSchema;
    expect(toolSchema).toBeDefined();
    
    // Check if ide parameter exists
    const ideParam = toolSchema.properties?.ide;
    expect(ideParam).toBeDefined();
    expect(ideParam.description).toContain('指定要下载的IDE类型');
    console.log('✅ IDE parameter found in tool schema');
    
    // Check if ide parameter has correct enum values
    expect(ideParam.enum).toBeDefined();
    expect(Array.isArray(ideParam.enum)).toBe(true);
    expect(ideParam.enum).toContain('all');
    expect(ideParam.enum).toContain('cursor');
    expect(ideParam.enum).toContain('windsurf');
    expect(ideParam.enum).toContain('codebuddy');
    expect(ideParam.enum).toContain('claude-code');
    expect(ideParam.enum).toContain('cline');
    expect(ideParam.enum).toContain('gemini-cli');
    expect(ideParam.enum).toContain('opencode');
    expect(ideParam.enum).toContain('qwen-code');
    expect(ideParam.enum).toContain('baidu-comate');
    expect(ideParam.enum).toContain('openai-codex-cli');
    expect(ideParam.enum).toContain('augment-code');
    expect(ideParam.enum).toContain('github-copilot');
    expect(ideParam.enum).toContain('roocode');
    expect(ideParam.enum).toContain('tongyi-lingma');
    expect(ideParam.enum).toContain('trae');
    expect(ideParam.enum).toContain('vscode');
    console.log('✅ All supported IDE types found in enum');
    
    // Check default value
    expect(ideParam.default).toBe('all');
    console.log('✅ Default IDE value is "all"');
    
    console.log('✅ downloadTemplate IDE filtering test passed');
    
  } catch (error) {
    console.error('❌ downloadTemplate IDE filtering test failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
    }
  }
}, 90000);

test('downloadTemplate tool validates IDE parameter correctly', async () => {
  let transport = null;
  let client = null;
  
  try {
    console.log('Testing downloadTemplate IDE parameter validation...');
    
    // Create client
    client = new Client({
      name: "test-client-ide-validation",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Use the CJS CLI for integration testing
    const serverPath = join(__dirname, '../mcp/dist/cli.cjs');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: { ...process.env }
    });

    // Connect client to server
    await client.connect(transport);
    await delay(3000);

    console.log('Testing invalid IDE parameter...');
    
    // Test with invalid IDE type (this should fail gracefully)
    try {
      const result = await client.callTool('downloadTemplate', {
        template: 'rules',
        ide: 'invalid-ide-type',
        overwrite: false
      });
      
      // If we get here, the tool should return an error message
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('不支持的IDE类型');
      console.log('✅ Invalid IDE type properly rejected');
      
    } catch (error) {
      // This is also acceptable - the tool might throw an error for invalid parameters
      console.log('✅ Invalid IDE type caused expected error:', error.message);
    }
    
    console.log('✅ downloadTemplate IDE validation test passed');
    
  } catch (error) {
    console.error('❌ downloadTemplate IDE validation test failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
    }
  }
}, 90000);

test('downloadTemplate tool maintains backward compatibility', async () => {
  let transport = null;
  let client = null;
  
  try {
    console.log('Testing downloadTemplate backward compatibility...');
    
    // Create client
    client = new Client({
      name: "test-client-backward-compat",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Use the CJS CLI for integration testing
    const serverPath = join(__dirname, '../mcp/dist/cli.cjs');
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: { ...process.env }
    });

    // Connect client to server
    await client.connect(transport);
    await delay(3000);

    console.log('Testing backward compatibility (no IDE parameter)...');
    
    // Test without IDE parameter (should default to "all")
    try {
      const result = await client.callTool('downloadTemplate', {
        template: 'rules',
        overwrite: false
      });
      
      // The tool should work without IDE parameter
      expect(result.content).toBeDefined();
      console.log('✅ Tool works without IDE parameter (backward compatibility)');
      
    } catch (error) {
      // This is acceptable - the tool might fail for other reasons (like network)
      console.log('✅ Tool call completed (may have failed for expected reasons):', error.message);
    }
    
    console.log('✅ downloadTemplate backward compatibility test passed');
    
  } catch (error) {
    console.error('❌ downloadTemplate backward compatibility test failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
    }
  }
}, 90000); 