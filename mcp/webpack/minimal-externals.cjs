const nodeExternals = require('webpack-node-externals');
const nodeModules = require('./node-modules.cjs');
const problematicDeps = require('./problematic-deps.cjs');

/**
 * 最大化依赖打包配置
 * 尝试打包所有可能的依赖
 */
function createMinimalExternals(importType = 'commonjs') {
  return [
    // 暂时注释掉 nodeExternals，让 webpack 打包所有依赖
    // nodeExternals({
    //   allowlist: [
    //     // 所有依赖都尝试打包
    //     /.*/
    //   ],
    //   importType: importType
    // }),
    
    // 只排除 Node.js 内置模块和真正有问题的依赖
    ...nodeModules,
    ...problematicDeps
  ];
}

module.exports = createMinimalExternals; 