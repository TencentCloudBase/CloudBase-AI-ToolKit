// 测试新的 storage 工具功能
// 这是一个简单的验证脚本，用于检查工具是否正确注册

const { registerStorageTools } = require('./dist/index.cjs');

// 模拟 ExtendedMcpServer
const mockServer = {
  registerTool: (name, config, handler) => {
    console.log(`✅ 工具注册成功: ${name}`);
    console.log(`   标题: ${config.title}`);
    console.log(`   描述: ${config.description}`);
    console.log(`   分类: ${config.annotations.category}`);
    console.log(`   只读: ${config.annotations.readOnlyHint}`);
    console.log(`   破坏性: ${config.annotations.destructiveHint}`);
    console.log(`   输入参数:`, Object.keys(config.inputSchema));
    console.log('---');
  },
  cloudBaseOptions: undefined
};

console.log('🚀 开始测试 storage 工具注册...\n');

try {
  registerStorageTools(mockServer);
  console.log('✅ 所有 storage 工具注册完成！');
  
  console.log('\n📋 工具功能总结:');
  console.log('1. queryStorage - 查询存储信息（只读操作）');
  console.log('   - list: 列出目录文件');
  console.log('   - info: 获取文件信息');
  console.log('   - url: 获取临时链接');
  
  console.log('\n2. manageStorage - 管理存储文件（写操作）');
  console.log('   - upload: 上传文件/目录');
  console.log('   - download: 下载文件/目录');
  console.log('   - delete: 删除文件/目录（需要 force=true 确认）');
  
} catch (error) {
  console.error('❌ 工具注册失败:', error.message);
  process.exit(1);
}
