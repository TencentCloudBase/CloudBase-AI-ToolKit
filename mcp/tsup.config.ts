import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node18',
  // 尽可能多地打包依赖，只排除真正有问题的
  external: [
    // 只排除有严重问题的依赖
    '@aws-sdk/client-s3', // unzipper 的可选依赖
    '@aws-sdk/lib-storage', // 可能的额外 AWS 依赖  
    // 大型云服务 SDK 保持外部（减少体积）
    '@cloudbase/manager-node',
  ],
  // 让打包器忽略一些构建时的错误
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    }
  }
}) 