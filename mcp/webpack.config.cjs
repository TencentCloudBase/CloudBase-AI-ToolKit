const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

// 基础配置
const baseConfig = {
  mode: 'production',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
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
    // 忽略有问题的 native 依赖
    new webpack.IgnorePlugin({
      resourceRegExp: /^(fsevents|@swc\/core.*)$/,
    }),
    // 定义构建时的全局变量
    new webpack.DefinePlugin({
      __MCP_VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
  optimization: {
    minimize: true, // 启用压缩来减小文件体积
  },
  stats: {
    warnings: false, // 忽略循环依赖警告
  }
};

// 导出配置
module.exports = [
  // 库文件 - ESM 版本，尽量少的外部依赖
  {
    ...baseConfig,
    name: 'library-esm',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        type: 'module'
      },
      chunkFormat: 'module',
      environment: {
        module: true,
        dynamicImport: true
      }
    },
    experiments: {
      outputModule: true
    },
    externalsType: 'module',
    externals: [
      nodeExternals({
        // 打包更多小型依赖
        allowlist: [
          'zod',
          'punycode',
          '@types/adm-zip',
          'adm-zip'
        ],
        importType: 'module'
      })
    ]
  },

  // 库文件 - CommonJS 版本，尽量少的外部依赖
  {
    ...baseConfig,
    name: 'library-cjs',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.cjs',
      library: {
        type: 'commonjs2'
      }
    },
    externals: [
      nodeExternals({
        // 打包更多小型依赖
        allowlist: [
          'zod',
          'punycode',
          '@types/adm-zip',
          'adm-zip'
        ]
      })
    ]
  },

  // CLI 全功能 bundle - ESM 版本，最大化依赖打包
  {
    ...baseConfig,
    name: 'cli-bundle-esm',
    entry: './src/cli.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'cli.js',
      library: {
        type: 'module'
      },
      chunkFormat: 'module',
      environment: {
        module: true,
        dynamicImport: true
      }
    },
    experiments: {
      outputModule: true
    },
    externalsType: 'module',
    externals: [
      nodeExternals({
        // 打包所有安全的第三方依赖（包含小型工具库）
        allowlist: [
          'zod',
          'punycode', 
          '@types/adm-zip',
          'adm-zip',
          'cors',
          '@modelcontextprotocol/sdk',
          /^@modelcontextprotocol\/sdk\//,
          'zod-to-json-schema',
          'ajv',
          /^ajv\//,
          // 安全的第三方依赖
          'fast-json-stable-stringify',
          'open',
          'uri-js',
          'fast-deep-equal',
          'json-schema-traverse',
          // 小型工具库
          'is-wsl',
          'define-lazy-prop',
          'default-browser',
          'is-inside-container',
          // 更多小型依赖
          'default-browser-id',
          'bundle-name', 
          'is-docker',
          'run-applescript',
          // CloudBase 包 - 打包到 bundle 中
          '@cloudbase/manager-node',
          /^@cloudbase\//
        ],
        importType: 'module'
      }),
      // 只排除无法打包的大型依赖和Node.js内置模块
      /^miniprogram-ci$/,
      /^express$/,
      /^ws$/,
      /^node:/,
      /^fs$/,
      /^path$/,
      /^os$/,
      /^crypto$/,
      /^url$/,
      /^http$/,
      /^https$/,
      /^net$/,
      /^dns$/,
      /^zlib$/,
      /^fs\/promises$/
    ],
    plugins: [
      ...baseConfig.plugins,
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
        entryOnly: true
      })
    ]
  },

  // CLI 全功能 bundle - CommonJS 版本，最大化依赖打包
  {
    ...baseConfig,
    name: 'cli-bundle-cjs',
    entry: './src/cli.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'cli.cjs',
      library: {
        type: 'commonjs2'
      }
    },
    externals: [
      nodeExternals({
        // 打包所有安全的第三方依赖（包含小型工具库）
        allowlist: [
          'zod',
          'punycode',
          '@types/adm-zip', 
          'adm-zip',
          'cors',
          '@modelcontextprotocol/sdk',
          /^@modelcontextprotocol\/sdk\//,
          'zod-to-json-schema',
          'ajv',
          /^ajv\//,
          // 安全的第三方依赖
          'fast-json-stable-stringify',
          'open',
          'uri-js',
          'fast-deep-equal',
          'json-schema-traverse',
          // 小型工具库
          'is-wsl',
          'define-lazy-prop',
          'default-browser',
          'is-inside-container',
          // 更多小型依赖
          'default-browser-id',
          'bundle-name', 
          'is-docker',
          'run-applescript',
          // CloudBase 包 - 打包到 bundle 中
          '@cloudbase/manager-node',
          /^@cloudbase\//
        ]
      }),
      // 只排除无法打包的大型依赖和Node.js内置模块
      /^miniprogram-ci$/,
      /^express$/,
      /^ws$/,
      /^node:/,
      /^fs$/,
      /^path$/,
      /^os$/,
      /^crypto$/,
      /^url$/,
      /^http$/,
      /^https$/,
      /^net$/,
      /^dns$/,
      /^zlib$/,
      /^fs\/promises$/
    ],
    plugins: [
      ...baseConfig.plugins,
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
        entryOnly: true
      })
    ]
  }
]; 