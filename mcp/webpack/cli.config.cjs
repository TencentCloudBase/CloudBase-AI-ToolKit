const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');
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
      ...cliPlugins,
      // 代码混淆插件 - 仅混淆 CLI 代码，不混淆 node_modules
      new JavaScriptObfuscator({
        rotateStringArray: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false,
        // 保留一些关键标识符，避免破坏功能
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        // 保留控制台输出，CLI 需要
        disableConsoleOutput: false
      }, [
        // 排除 node_modules 和类型定义文件
        '**/node_modules/**',
        '**/*.d.ts'
      ])
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false, // 保留 console，CLI 可能需要
              drop_debugger: true,
              pure_funcs: ['console.debug'] // 移除 debug 日志
            },
            format: {
              comments: false // 移除注释
            }
          },
          extractComments: false
        })
      ]
    }
  });

  return [cjsConfig];
}

module.exports = createCLIConfigs; 