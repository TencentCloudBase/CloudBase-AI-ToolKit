export default {
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000, // 60秒超时，适合网络请求
    hookTimeout: 30000, // 30秒 hook 超时
    teardownTimeout: 10000,
    include: ['../tests/**/*.test.js'], // 测试文件在上级目录
    exclude: ['node_modules', 'dist'],
    reporter: 'verbose'
  }
}; 