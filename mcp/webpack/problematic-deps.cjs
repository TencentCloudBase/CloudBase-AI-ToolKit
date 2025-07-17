/**
 * 真正无法打包的问题依赖列表
 * 这些依赖存在严重的兼容性问题，必须排除
 */
module.exports = [
  // 大型框架和工具
  'miniprogram-ci', 'express', 'ws', 'electron', 'got', 'download', 'unzipper',
  
  // AWS SDK (体积过大，且有兼容性问题)
  /^@aws-sdk\//,
  
  // Babel 相关 (体积过大，且有兼容性问题)
  'babel-core', /^@babel\//, 'core-js-compat',
  
  // 终端相关 (有兼容性问题)
  'terminal-kit',
  
  // 其他有问题的依赖
  'fsevents', /^@swc\/core.*$/
]; 