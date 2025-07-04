import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import ignore from 'rollup-plugin-ignore';
import { readFileSync } from 'fs';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

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

// Terser 配置 - 积极的压缩设置
const terserConfig = {
  compress: {
    drop_console: false, // 保留 console，因为这是一个开发工具
    drop_debugger: true,
    pure_funcs: ['console.debug'], // 移除 debug 调用
    passes: 2, // 多次压缩以获得更好的结果
    unsafe: false, // 保持安全的压缩
    unsafe_comps: false,
    unsafe_math: false,
    unsafe_proto: false,
    unsafe_regexp: false,
    unsafe_undefined: false,
    // 移除无用的代码
    dead_code: true,
    unused: true,
    // 优化条件表达式
    conditionals: true,
    // 优化比较操作
    comparisons: true,
    // 优化布尔值
    booleans: true,
    // 优化 if 语句
    if_return: true,
    // 内联函数
    inline: 1,
    // 合并变量
    join_vars: true,
    // 优化循环
    loops: true,
    // 减少变量名长度
    reduce_vars: true,
    // 压缩序列
    sequences: true,
    // 消除无用的代码块
    side_effects: true
  },
  mangle: {
    // 不混淆的标识符
    reserved: ['__dirname', '__filename'],
    // 混淆属性名（谨慎使用）
    properties: false,
    // 保持类名
    keep_classnames: true,
    // 保持函数名（对于调试有用）
    keep_fnames: false
  },
  format: {
    // 移除注释
    comments: false,
    // 压缩输出
    beautify: false,
    // 保持 shebang
    preserve_annotations: false
  }
};

// 基础配置
const baseConfig = {
  external,
  // 启用 tree shaking
  treeshake: {
    preset: 'recommended',
    // 更积极的 tree shaking
    moduleSideEffects: false,
    // 纯净的外部模块（可以被 tree shake）
    pureExternalModules: true,
    // 不要保留未使用的导入
    tryCatchDeoptimization: false,
    // 分析函数副作用
    propertyReadSideEffects: false,
    // 未知的全局变量处理
    unknownGlobalSideEffects: false
  },
  plugins: [
    // 忽略可选的 AWS SDK 依赖
    ignore(['@aws-sdk/client-s3']),
    // 版本号注入，需要在 typescript 插件之前
    replace({
      preventAssignment: true,
      values: {
        '__MCP_VERSION__': JSON.stringify(version)
      }
    }),
    resolve({
      preferBuiltins: true,
      exportConditions: ['node'],
      browser: false,
      // 优化依赖解析
      dedupe: ['zod', 'axios'], // 去重常见的重复依赖
    }),
    commonjs({
      ignoreDynamicRequires: false,
      transformMixedEsModules: true,
      // 优化 CommonJS 转换
      strictRequires: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false, // 生产环境关闭 sourcemap 以减小体积
      inlineSources: false,
      // TypeScript 编译优化
      declaration: false,
      declarationMap: false
    }),
    json(),
    // 添加代码压缩
    terser(terserConfig)
  ]
};

export default [
  // index.js - ESM 格式（压缩版）
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: false, // 生产环境关闭 sourcemap
      inlineDynamicImports: true,
      // 输出优化
      compact: true,
      minifyInternalExports: true
    },
    plugins: [...baseConfig.plugins, esmPolyfillPlugin()]
  },
  
  // index.cjs - CJS 格式（压缩版）
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: false,
      inlineDynamicImports: true,
      compact: true,
      minifyInternalExports: true
    }
  },
  
  // cli.js - ESM 格式（压缩版）
  {
    ...baseConfig,
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'es',
      sourcemap: false,
      inlineDynamicImports: true,
      compact: true,
      minifyInternalExports: true
    },
    plugins: [...baseConfig.plugins, esmPolyfillPlugin()]
  },
  
  // cli.cjs - CJS 格式（压缩版）
  {
    ...baseConfig,
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.cjs',
      format: 'cjs',
      sourcemap: false,
      inlineDynamicImports: true,
      compact: true,
      minifyInternalExports: true
    }
  },

  // 类型定义文件（不需要压缩）
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.d.ts', format: 'es' },
      { file: 'dist/index.d.cts', format: 'cjs' }
    ],
    plugins: [dts()],
    external
  },

  // CLI 类型定义文件
  {
    input: 'src/cli.ts',
    output: { file: 'dist/cli.d.ts', format: 'es' },
    plugins: [dts()],
    external
  }
]; 