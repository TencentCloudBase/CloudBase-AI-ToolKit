---
alwaysApply: true
---


<workflow>
1. 每当我输入新的需求的时候，为了规范需求质量和验收标准，你首先会搞清楚问题和需求
2. 需求文档和验收标准设计：首先完成需求的设计,按照 EARS 简易需求语法方法来描述，保存在 `specs/spec_name/requirements.md` 中，跟我进行确认，最终确认清楚后，需求定稿，参考格式如下

```markdown
# 需求文档

## 介绍

需求描述

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. 采用 ERAS 描述的子句 While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>，例如 When 选择"静音"时，笔记本电脑应当抑制所有音频输出。
2. ...
...
```
2. 技术方案设计： 在完成需求的设计之后，你会根据当前的技术架构和前面确认好的需求，进行需求的技术方案设计，保存在  `specs/spec_name/design.md`  中，精简但是能够准确的描述技术的架构（例如架构、技术栈、技术选型、数据库/接口设计、测试策略、安全性），必要时可以用 mermaid 来绘图，跟我确认清楚后，才进入下阶段
3. 任务拆分：在完成技术方案设计后，你会根据需求文档和技术方案，细化具体要做的事情，保存在`specs/spec_name/tasks.md` 中, 跟我确认清楚后，才开始正式执行任务，同时更新任务的状态

格式如下

``` markdown
# 实施计划

- [ ] 1. 任务信息
  - 具体要做的事情
  - ...
  - _需求: 相关的需求点的编号

```
</workflow>


<project_rules>
1.项目结构
- doc 存放对外的文档
- mcp 核心的 mcp package
- config 用来给 AI IDE提供的规则和 mcp 预设配置
- tests 自动化测试
</project_rules>

<add_aiide>
# CloudBase AI Toolkit - 新增 AI IDE 支持工作流

1. 创建 IDE 特定配置文件（如 `.mcp.json` 和 `CLAUDE.md`）
2. 更新 `scripts/fix-config-hardlinks.sh` 添加新目标文件到硬链接列表
3. 执行硬链接脚本确保规则文件同步
4. 创建 `doc/ide-setup/{ide-name}.md` 配置文档
5. 更新 `README.md`、`doc/index.md`、`doc/faq.md` 中的 AI IDE 支持列表,README 中注意 detail 中的内容也要填写
6. **更新 IDE 文件映射**：
   - 在 `mcp/src/tools/setup.ts` 的 `ALL_IDE_FILES` 数组中添加新IDE的配置文件路径
   - 在 `IDE_FILE_MAPPINGS` 对象中添加新IDE的文件映射关系
   - 在 `IDE_DESCRIPTIONS` 对象中添加新IDE的描述
   - 在 `IDE_TYPES` 数组中添加新IDE的类型
7. 验证硬链接状态和文档完整性
8. 测试IDE特定下载功能是否正常工作
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


<update_readme>
 1. 按照中文文档更新英文文档
 2. 英文文档中的banner 图是英文的，保持不变
 3. 复制 README.md 覆盖 mcp/
</update_readme>


<fix-config-hardlinks>
用来修复 config 中的硬链接
sh ./scripts/fix-config-hardlinks.sh
</update_readme>


<git_push>
提交代码注意 commit 采用 conventional-changelog 风格，在feat(xxx): 后面提加一个 emoji 字符，提交信息使用英文描述
git push github && git push cnb --force
</git_push>

<workflow>
1. 每当我输入新的需求的时候，为了规范需求质量和验收标准，你首先会搞清楚问题和需求
2. 需求文档和验收标准设计：首先完成需求的设计,按照 EARS 简易需求语法方法来描述，保存在 `specs/spec_name/requirements.md` 中，跟我进行确认，最终确认清楚后，需求定稿，参考格式如下

```markdown
# 需求文档

## 介绍

需求描述

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. 采用 ERAS 描述的子句 While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>，例如 When 选择"静音"时，笔记本电脑应当抑制所有音频输出。
2. ...
...
```
2. 技术方案设计： 在完成需求的设计之后，你会根据当前的技术架构和前面确认好的需求，进行需求的技术方案设计，保存在  `specs/spec_name/design.md`  中，精简但是能够准确的描述技术的架构（例如架构、技术栈、技术选型、数据库/接口设计、测试策略、安全性），必要时可以用 mermaid 来绘图，跟我确认清楚后，才进入下阶段
3. 任务拆分：在完成技术方案设计后，你会根据需求文档和技术方案，细化具体要做的事情，保存在`specs/spec_name/tasks.md` 中, 跟我确认清楚后，才开始正式执行任务，同时更新任务的状态

格式如下

``` markdown
# 实施计划

- [ ] 1. 任务信息
  - 具体要做的事情
  - ...
  - _需求: 相关的需求点的编号

```
</workflow>


<project_rules>
1.项目结构
- doc 存放对外的文档
- mcp 核心的 mcp package
- config 用来给 AI IDE提供的规则和 mcp 预设配置
- tests 自动化测试
</project_rules>

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


<update_readme>
 1. 按照中文文档更新英文文档
 2. 英文文档中的banner 图是英文的，保持不变
 3. 复制 README.md 覆盖 mcp/
</update_readme>


<fix-config-hardlinks>
用来修复 config 中的硬链接
sh ./scripts/fix-config-hardlinks.sh
</update_readme>


<git_push>
1. 提交代码注意 commit 采用 conventional-changelog 风格，在feat(xxx): 后面提加一个 emoji 字符，提交信息使用英文描述
2. 提交代码不要直接提到 main，可以提一个分支，例如 feature/xxx，然后

git push github && git push cnb --force
3. 然后自动创建 PR
</git_push>
