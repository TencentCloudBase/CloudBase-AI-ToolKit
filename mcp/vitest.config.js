import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 设置测试环境变量
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      CLOUDBASE_MCP_TELEMETRY_DISABLED: 'true'
    },
    // 使用 Node.js 环境进行测试
    environment: 'node',
    // 增加测试超时时间
    testTimeout: 120000,
    // 设置并发数
    threads: false, // 禁用多线程，避免端口冲突
    // 设置根目录
    root: process.cwd(),
    // 包含测试文件
    include: ['../tests/**/*.test.js'],
    // 显示详细输出
    reporter: 'verbose',
    // 失败时停止
    bail: 1,
    // 测试运行前的设置
    globalSetup: [],
    setupFiles: []
  }
}); 