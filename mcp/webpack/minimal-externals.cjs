const nodeExternals = require('webpack-node-externals');
const nodeModules = require('./node-modules.cjs');
const problematicDeps = require('./problematic-deps.cjs');

/**
 * 最小化外部依赖配置
 * 只排除真正无法打包的依赖，最大化 bundle 覆盖率
 */
function createMinimalExternals(importType = 'commonjs') {
  return [
    nodeExternals({
      // 不设置 allowlist，默认打包所有依赖
      // 只排除有问题的依赖
      allowlist: undefined,
      importType: importType
    }),
    // 排除 Node.js 内置模块
    ...nodeModules,
    // 排除有问题的依赖
    ...problematicDeps
  ];
}

module.exports = createMinimalExternals; 