export default {
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 150000, // 增加到 150 秒（2.5 分钟），适合 CI 环境
    hookTimeout: 60000, // 60秒 hook 超时
    teardownTimeout: 30000, // 30秒清理超时
    include: ['../tests/**/*.test.js'], // 测试文件在上级目录
    exclude: ['node_modules', 'dist'],
    reporter: 'verbose',
    // CI 环境优化
    maxConcurrency: 1, // 在 CI 中降低并发以减少资源竞争
    bail: 0, // 不要在第一个失败测试时停止
    retry: 1, // 重试失败的测试一次
    slowTestThreshold: 30000, // 标记超过 30 秒的测试为慢测试
  }
}; 