import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';

// 只将 Node.js 内置模块设为外部依赖，npm 依赖都打包进最终产物
const external = [
  // Node.js 内置模块
  'fs', 'path', 'url', 'util', 'stream', 'events', 'crypto', 'os', 'process',
  'buffer', 'child_process', 'http', 'https', 'net', 'tls', 'zlib', 'readline',
  'worker_threads', 'module', 'assert', 'querystring', 'string_decoder',
  'timers', 'tty', 'v8', 'vm', 'cluster', 'dgram', 'dns', 'domain',
  'fs/promises', 'http2', 'inspector', 'perf_hooks', 'punycode', 'repl',
  'trace_events', 'wasi', 'constants'
];

// ESM polyfill plugin for __dirname and __filename
const esmPolyfillPlugin = () => ({
  name: 'esm-polyfill',
  renderChunk(code, chunk) {
    if (chunk.fileName.endsWith('.js')) {
      // Check if the file starts with shebang
      const hasShebang = code.startsWith('#!');
      
      if (hasShebang) {
        // Split the code into shebang line and the rest
        const lines = code.split('\n');
        const shebangLine = lines[0];
        const restOfCode = lines.slice(1).join('\n');
        
        // Add ESM polyfills after shebang using unique variable names
        const polyfill = `
import { fileURLToPath as getFileURLFromPath } from 'url';
import { dirname as getDirname } from 'path';
const __filename = getFileURLFromPath(import.meta.url);
const __dirname = getDirname(__filename);
`;
        return shebangLine + polyfill + restOfCode;
      } else {
        // Add ESM polyfills at the top of ESM files without shebang using unique variable names
        const polyfill = `
import { fileURLToPath as getFileURLFromPath } from 'url';
import { dirname as getDirname } from 'path';
const __filename = getFileURLFromPath(import.meta.url);
const __dirname = getDirname(__filename);
`;
        return polyfill + code;
      }
    }
    return code;
  }
});

// 基础配置
const baseConfig = {
  external,
  plugins: [
    resolve({
      preferBuiltins: true,
      exportConditions: ['node'],
      browser: false
    }),
    commonjs({
      ignoreDynamicRequires: false,
      transformMixedEsModules: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: false
    }),
    json()
  ]
};

export default [
  // index.js - ESM 格式
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    },
    plugins: [...baseConfig.plugins, esmPolyfillPlugin()]
  },
  
  // index.cjs - CJS 格式
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true
    }
  },
  
  // cli.js - ESM 格式
  {
    ...baseConfig,
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    },
    plugins: [...baseConfig.plugins, esmPolyfillPlugin()]
  },
  
  // cli.cjs - CJS 格式
  {
    ...baseConfig,
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.cjs',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true
    }
  },

  // 类型定义文件
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.d.ts', format: 'es' },
      { file: 'dist/index.d.cts', format: 'cjs' }
    ],
    plugins: [dts()]
  },

  // CLI 类型定义文件
  {
    input: 'src/cli.ts',
    output: { file: 'dist/cli.d.ts', format: 'es' },
    plugins: [dts()]
  }
]; 