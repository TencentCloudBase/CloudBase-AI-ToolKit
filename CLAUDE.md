

<add_aiide>
# CloudBase AI Toolkit - 新增 AI IDE 支持工作流

1. 创建 IDE 特定配置文件（如 `.mcp.json` 和 `CLAUDE.md`）
2. 更新 `scripts/fix-config-hardlinks.sh` 添加新目标文件到硬链接列表
3. 执行硬链接脚本确保规则文件同步
4. 创建 `doc/ide-setup/{ide-name}.md` 配置文档
5. 更新 `README.md`、`doc/index.md`、`doc/faq.md` 中的 AI IDE 支持列表,README 中注意 detail 中的内容也要填写
6. 验证硬链接状态和文档完整性
</add_aiide>


<add_example>
# CloudBase AI Toolkit - 新增用户案例/视频/文章工作流
0. 注意标题尽量用原标题，然后适当增加一些描述
1. 更新 README.md
2. 更新 doc/tutorials.md

例如 艺术展览预约系统 - 一个完全通过AI 编程开发的艺术展览预约系统, 包含预约功能、管理后台等功能。
</add_example>

<sync_doc>
cp -r doc/* {cloudbase-docs dir}/docs/ai/cloudbase-ai-toolkit/
</sync_doc>