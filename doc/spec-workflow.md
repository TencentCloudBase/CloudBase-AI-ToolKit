# Spec 工作流说明

## 简介

CloudBase AI ToolKit 内置了 Kiro 风格的 Spec 工作流，旨在让 AI 编程过程更加工程化、规范化，提升需求梳理、设计、开发、验收的全流程体验。

## 工作流理念

- **工程化**：将需求、设计、任务分明，避免“拉霸式” vibe coding。
- **可追溯**：每一步都有文档记录，便于回溯和团队协作。
- **AI 协作**：AI 负责梳理需求、设计方案、拆分任务，人类专注决策与评审。
- **自动生成**：自动生成 requirements.md、design.md、tasks.md 等规范文档。

## 工作流流程

1. **需求梳理**
   - 采用 EARS（简易需求语法）方法，AI 协助用户梳理需求，生成 `requirements.md`。
2. **技术方案设计**
   - 基于需求，AI 生成技术架构、技术选型、接口/数据库设计等，形成 `design.md`。
3. **任务拆分**
   - 按照需求和设计，AI 拆分具体开发任务，生成 `tasks.md`。
4. **自动执行与追踪**
   - AI 根据任务清单自动推进开发，实时更新任务状态。

## 典型文件结构

```
specs/
  your-feature/
    requirements.md  # 需求文档
    design.md        # 技术方案设计
    tasks.md         # 任务拆分与进度
```

### requirements.md 示例

```markdown
# 需求文档

## 介绍

简要描述需求背景和目标。

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>
2. ...
```

### design.md 示例

```markdown
# 技术方案设计

- 架构图（可用 mermaid）
- 技术选型说明
- 数据库/接口设计
- 安全性与测试策略
```

### tasks.md 示例

```markdown
# 实施计划

- [ ] 1. 任务信息
  - 具体要做的事情
  - _需求: 相关的需求点编号
```

## 与 AI IDE 的集成

- 支持 Cursor、Claude Code、WindSurf、CodeBuddy 等主流 AI IDE
- 通过内置规则和 MCP 工具，AI 可自动识别并执行 Spec 工作流
- 用户只需用自然语言描述需求，AI 自动生成并维护 Spec 文档

## 优势

- 规范化开发流程，降低沟通和协作成本
- 便于团队协作和需求追溯
- 支持自动化测试与持续集成
- 让 AI 真正成为开发流程的“助理工程师”

## 典型用法

1. 用户在 AI IDE 中输入需求
2. AI 自动生成 specs/your-feature/ 下的 requirements.md、design.md、tasks.md
3. 用户确认后，AI 按 tasks.md 推进开发并持续更新任务状态
4. 开发完成后，所有文档可用于评审、归档和后续维护

---

如需进一步了解 Spec 工作流或遇到问题，欢迎查阅[官方文档](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/development)或加入技术交流群。 