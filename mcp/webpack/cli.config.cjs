const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const createBaseConfig = require('./base.config.cjs');
const createMinimalExternals = require('./minimal-externals.cjs');

/**
 * CLI 配置
 * 生成 ESM 和 CJS 两种格式的 CLI 文件
 */
function createCLIConfigs() {
  const baseConfig = createBaseConfig();
  
  // CLI 插件配置
  const cliPlugins = [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
      entryOnly: true
    }),
    new webpack.DefinePlugin({ 
      // 修复 import.meta.url 在编译时被替换成绝对路径的问题
      "import.meta.url": "('file://' + __filename)",
    }),
  ];

  // CJS 版本配置
  const cjsConfig = merge(baseConfig, {
    name: 'cli-bundle-cjs',
    entry: './src/cli.ts',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: 'cli.cjs',
      library: {
        type: 'commonjs2'
      }
    },
    externals: createMinimalExternals('commonjs'),
    plugins: [
      ...baseConfig.plugins,
      ...cliPlugins
    ]
  });

  return [cjsConfig];
}

module.exports = createCLIConfigs; 