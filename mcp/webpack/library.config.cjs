const path = require('path');
const { merge } = require('webpack-merge');
const createBaseConfig = require('./base.config.cjs');
const createMinimalExternals = require('./minimal-externals.cjs');

/**
 * 库文件配置
 * 生成 ESM 和 CJS 两种格式的库文件
 */
function createLibraryConfigs() {
  const baseConfig = createBaseConfig();
  
  // ESM 版本配置
  const esmConfig = merge(baseConfig, {
    name: 'library-esm',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, '../dist'),
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
    externals: createMinimalExternals('module')
  });

  // CJS 版本配置
  const cjsConfig = merge(baseConfig, {
    name: 'library-cjs',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: 'index.cjs',
      library: {
        type: 'commonjs2'
      }
    },
    externals: createMinimalExternals('commonjs')
  });

  return [esmConfig, cjsConfig];
}

module.exports = createLibraryConfigs; 