// npx/纯净产物环境模拟测试
import { test, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to wait for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// MCP 连接测试函数
async function testMcpConnection(cliPath) {
  let transport = null;
  let client = null;
  
  try {
    console.log('📡 创建 MCP 客户端...');
    
    // Create client
    client = new Client({
      name: "test-client-npx",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Create stdio transport that spawns the server
    transport = new StdioClientTransport({
      command: 'node',
      args: [cliPath],
      env: { ...process.env }
    });

    // Connect client to server
    console.log('🔗 连接到 MCP 服务器...');
    await client.connect(transport);
    
    // Wait for connection to establish
    await delay(3000);

    console.log('🔍 测试服务器功能...');
    
    // List tools (this should work since we declared tools capability)
    const toolsResult = await client.listTools();
    expect(toolsResult.tools).toBeDefined();
    expect(Array.isArray(toolsResult.tools)).toBe(true);
    expect(toolsResult.tools.length).toBeGreaterThan(0);
    
    console.log(`✅ 服务器暴露了 ${toolsResult.tools.length} 个工具`);

    // Test a simple tool call (searchKnowledgeBase should always be available)
    const knowledgeTool = toolsResult.tools.find(t => t.name === 'searchKnowledgeBase');
    if (knowledgeTool) {
      console.log('🔍 测试 searchKnowledgeBase 工具...');
      
      const knowledgeResult = await client.callTool({
        name: 'searchKnowledgeBase',
        arguments: {
          id: 'cloudbase',     // 知识库范围
          content: 'test',     // 检索内容
          limit: 1             // 返回结果数量
        }
      });
      
      expect(knowledgeResult).toBeDefined();
      expect(knowledgeResult.content).toBeDefined();
      expect(Array.isArray(knowledgeResult.content)).toBe(true);
      
      console.log('✅ searchKnowledgeBase 工具执行成功');
    } else {
      console.log('⚠️ searchKnowledgeBase 工具未找到，跳过测试');
    }

    console.log('✅ MCP 连接测试通过');

  } catch (error) {
    console.error('❌ MCP 连接测试失败:', error);
    throw error;
  } finally {
    // Clean up
    if (client) {
      try {
        await client.close();
        console.log('✅ 客户端连接已关闭');
      } catch (e) {
        console.warn('⚠️ 关闭客户端连接时出错:', e.message);
      }
    }
    if (transport) {
      try {
        await transport.close();
        console.log('✅ 传输连接已关闭');
      } catch (e) {
        console.warn('⚠️ 关闭传输连接时出错:', e.message);
      }
    }
  }
}

test('npx/纯净产物环境模拟测试', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-npx-test-'));
  let tarballPath = '';
  let pkgDir = '';

  try {
    console.log('🔍 开始 npx 环境模拟测试...');
    
    // 1. 打包
    console.log('📦 执行 npm pack...');
    tarballPath = execSync('npm pack', { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '../mcp')
    })
      .split('\n')
      .find(line => line.endsWith('.tgz'))
      .trim();
    
    console.log('📦 打包文件:', tarballPath);
    
    // 2. 解包
    console.log('📂 解包到临时目录...');
    execSync(`tar -xzf ${tarballPath} -C ${tmpDir}`);
    pkgDir = path.join(tmpDir, 'package');
    
    console.log('📂 解包目录:', pkgDir);
    
    // 3. 安装依赖（只安装 dependencies）
    console.log('📥 安装生产依赖...');
    execSync('npm install --production', { 
      cwd: pkgDir, 
      stdio: 'inherit' 
    });
    
    // 4. 运行 CLI 基础测试
    console.log('🚀 测试 CLI 启动...');
    const cliPath = path.join(pkgDir, 'dist', 'cli.cjs');
    const result = spawnSync('node', [cliPath, '--help'], { 
      encoding: 'utf-8',
      timeout: 30000 // 30秒超时
    });
    
    // 5. 检查基础输出
    console.log('🔍 检查基础运行结果...');
    console.log('退出码:', result.status);
    console.log('标准输出长度:', result.stdout?.length || 0);
    console.log('错误输出长度:', result.stderr?.length || 0);
    
    // 检查是否有依赖缺失错误
    expect(result.stderr).not.toMatch(/MODULE_NOT_FOUND|Cannot find module/);
    expect(result.status).toBe(0);
    
    // 可选：检查 stdout 是否包含预期内容
    if (result.stdout) {
      console.log('✅ CLI 输出正常');
    }
    
    // 6. MCP 连接测试
    console.log('🔗 开始 MCP 连接测试...');
    await testMcpConnection(cliPath);
    
    // 7. 环境信息查询测试
    console.log('🔍 开始环境信息查询测试...');
    await testEnvironmentInfo(cliPath);
    
    console.log('✅ npx 环境模拟测试通过');
    
  } catch (error) {
    console.error('❌ npx 环境模拟测试失败:', error);
    throw error;
  } finally {
    // 清理临时目录和 tar 包
    console.log('🧹 清理临时文件...');
    try { 
      fs.rmSync(tmpDir, { recursive: true, force: true }); 
      console.log('✅ 临时目录清理完成');
    } catch (e) {
      console.warn('⚠️ 临时目录清理失败:', e.message);
    }
    
    try { 
      fs.unlinkSync(tarballPath); 
      console.log('✅ tar 包清理完成');
    } catch (e) {
      console.warn('⚠️ tar 包清理失败:', e.message);
    }
  }
}, 120000); // 增加到 120 秒

// 环境信息查询测试函数
async function testEnvironmentInfo(cliPath) {
  let transport = null;
  let client = null;
  
  try {
    console.log('📡 创建环境信息查询客户端...');
    
    // Create client
    client = new Client({
      name: "test-client-env-info",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    // Create stdio transport that spawns the server
    transport = new StdioClientTransport({
      command: 'node',
      args: [cliPath],
      env: { ...process.env }
    });

    // Connect client to server
    console.log('🔗 连接到 MCP 服务器...');
    await client.connect(transport);
    
    // Wait for connection to establish
    await delay(3000);

    console.log('🔍 查询环境信息...');
    
    // List tools to find environment-related tools
    const toolsResult = await client.listTools();
    const envTools = toolsResult.tools.filter(t => 
      t.name.includes('env') || t.name.includes('login') || t.name.includes('info')
    );
    
    console.log(`📋 找到 ${envTools.length} 个环境相关工具:`, envTools.map(t => t.name));
    
    // Test login tool if available (this is a common environment tool)
    const loginTool = toolsResult.tools.find(t => t.name === 'login');
    if (loginTool) {
      console.log('🔐 测试 login 工具...');
      
      try {
        const loginResult = await client.callTool({
          name: 'login',
          arguments: {
            secretId: 'test-secret-id',
            secretKey: 'test-secret-key',
            envId: 'test-env-id'
          }
        });
        
        expect(loginResult).toBeDefined();
        expect(loginResult.content).toBeDefined();
        expect(Array.isArray(loginResult.content)).toBe(true);
        
        console.log('✅ login 工具执行成功');
        console.log('Login 结果:', loginResult.content[0]?.text?.substring(0, 200) + '...');
      } catch (loginError) {
        // Login might fail with test credentials, which is expected
        console.log('⚠️ login 工具执行失败（使用测试凭据，这是预期的）:', loginError.message);
      }
    } else {
      console.log('⚠️ login 工具未找到，跳过测试');
    }
    
    // Test getEnvironmentInfo tool if available
    const envInfoTool = toolsResult.tools.find(t => t.name === 'getEnvironmentInfo');
    if (envInfoTool) {
      console.log('🌍 测试 getEnvironmentInfo 工具...');
      
      try {
        const envInfoResult = await client.callTool({
          name: 'getEnvironmentInfo',
          arguments: {}
        });
        
        expect(envInfoResult).toBeDefined();
        expect(envInfoResult.content).toBeDefined();
        expect(Array.isArray(envInfoResult.content)).toBe(true);
        
        console.log('✅ getEnvironmentInfo 工具执行成功');
        console.log('环境信息:', envInfoResult.content[0]?.text?.substring(0, 200) + '...');
      } catch (envInfoError) {
        console.log('⚠️ getEnvironmentInfo 工具执行失败（可能需要认证）:', envInfoError.message);
      }
    } else {
      console.log('⚠️ getEnvironmentInfo 工具未找到，跳过测试');
    }
    
    // Test listEnvironments tool if available
    const listEnvsTool = toolsResult.tools.find(t => t.name === 'listEnvironments');
    if (listEnvsTool) {
      console.log('📋 测试 listEnvironments 工具...');
      
      try {
        const listEnvsResult = await client.callTool({
          name: 'listEnvironments',
          arguments: {}
        });
        
        expect(listEnvsResult).toBeDefined();
        expect(listEnvsResult.content).toBeDefined();
        expect(Array.isArray(listEnvsResult.content)).toBe(true);
        
        console.log('✅ listEnvironments 工具执行成功');
        console.log('环境列表:', listEnvsResult.content[0]?.text?.substring(0, 200) + '...');
      } catch (listEnvsError) {
        console.log('⚠️ listEnvironments 工具执行失败（可能需要认证）:', listEnvsError.message);
      }
    } else {
      console.log('⚠️ listEnvironments 工具未找到，跳过测试');
    }

    console.log('✅ 环境信息查询测试通过');

  } catch (error) {
    console.error('❌ 环境信息查询测试失败:', error);
    throw error;
  } finally {
    // Clean up
    if (client) {
      try {
        await client.close();
        console.log('✅ 环境信息查询客户端连接已关闭');
      } catch (e) {
        console.warn('⚠️ 关闭环境信息查询客户端连接时出错:', e.message);
      }
    }
    if (transport) {
      try {
        await transport.close();
        console.log('✅ 环境信息查询传输连接已关闭');
      } catch (e) {
        console.warn('⚠️ 关闭环境信息查询传输连接时出错:', e.message);
      }
    }
  }
} 