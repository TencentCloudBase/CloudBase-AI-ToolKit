const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const nodeExternals = require('webpack-node-externals');

// 基础配置
const baseConfig = {
  mode: 'production',
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      // 处理 TypeScript ESM 导入中的 .js 扩展名
      '.js': ['.ts', '.js'],
    },
    fallback: {
      // 在 Node.js 环境中我们不需要这些 polyfills
      "buffer": false,
      "process": false,
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // 类型检查由 ForkTsCheckerWebpackPlugin 处理
              configFile: 'tsconfig.json'
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      }
    }),
    // ProvidePlugin 不需要了，因为我们在 Node.js 环境中运行
    // 忽略有问题的 native 依赖
    new webpack.IgnorePlugin({
      resourceRegExp: /^(fsevents|@swc\/core.*)$/,
    }),
    // 定义构建时的全局变量
    new webpack.DefinePlugin({
      __MCP_VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
  externals: [
    // 排除所有 node_modules 依赖
    nodeExternals({
      // 只打包特定的依赖
      allowlist: ['zod']
    }),
    // 手动排除可能有问题的模块
    /^@modelcontextprotocol\/sdk\//,
    /^@cloudbase\//,
    /^miniprogram-ci$/,
    /^open$/
  ],
  optimization: {
    minimize: false, // 保持代码可读性，特别是对于 MCP 服务器
  },
  stats: {
    warnings: false, // 忽略循环依赖警告
  }
};

// 导出多个配置
module.exports = [
  // ESM build for index.js
  {
    ...baseConfig,
    name: 'esm',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        type: 'module'
      },
      chunkFormat: 'module'
    },
    experiments: {
      outputModule: true
    }
  },

  // CommonJS build for index.cjs  
  {
    ...baseConfig,
    name: 'cjs',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.cjs',
      library: {
        type: 'commonjs2'
      }
    }
  },

  // CLI build for cli.js
  {
    ...baseConfig,
    name: 'cli-esm',
    entry: './src/cli.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'cli.js',
      library: {
        type: 'module'
      },
      chunkFormat: 'module'
    },
    experiments: {
      outputModule: true
    },
    plugins: [
      ...baseConfig.plugins,
      // 添加 shebang 到 CLI 文件
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
        entryOnly: true
      })
    ]
  },

  // CLI build for cli.cjs
  {
    ...baseConfig,
    name: 'cli-cjs',
    entry: './src/cli.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'cli.cjs',
      library: {
        type: 'commonjs2'
      }
    },
    plugins: [
      ...baseConfig.plugins,
      // 添加 shebang 到 CLI 文件
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
        entryOnly: true
      })
    ]
  }
]; 