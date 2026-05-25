# StarWork Core

StarWork Core 是面向 AI 协作项目的工作区协议。

先读：[StarWork Core v0.1 协议总览](./core-v0.1-protocol.md)。

Core v0.1 定义：

- Agent 开始工作前先读什么
- 项目状态和当前工作分别放在哪里
- 过程材料如何与正式事实源分离
- `.starwork/` 机制运行层与项目内容层如何分离
- `references/outputs` 工作区如何承载资料、草稿和正式成果
- 多 Agent 会话如何按职责位分工协作
- CLI、Adapters、Packs 和模板如何基于同一套协议工作
- Skill 如何被系统安装、Hub 管理、Pack 推荐，并分发到具体项目

## 仓库维护模型

Core 用“一套基线 + 可组合的 profile 和 capability”来维护：

```text
product/core/
├── baseline/       # 每个 Core 工作区都必须遵守的共同语义
├── profiles/       # 语言、路径和模板映射，例如 zh 与 en
├── capabilities/   # 可选能力，例如输出结构、决策记录、主库同步、Skill 挂载
├── presets/        # 面向用户状态的组合配方
└── kits/           # 由 preset 组装出来的可复制模板包
```

## 维护规则

- 共同规则改 `baseline/`。
- 路径、模板语言、CLI 提问和用户可见名称改 `profiles/`。
- 可选行为改 `capabilities/`。
- 面向用户的组合状态改 `presets/`。
- `kits/` 是生成或组装结果，不是协议事实源。

## Hub + Satellite 模型

多项目模式由 `main-repo-sync` 表达，不拆成 `shared-identity` 和 `shared-lessons` 这类局部开关。

在这个模型里：

- Hub 维护可复用规则、身份、教训、知识、共享 skills、项目注册元数据、跨项目联络和回写审核。
- Satellite 工作区维护自己的项目状态、当前工作、过程材料、项目决策和正式事实源。
- 快照、只读链接、`.starwork/sync.json`、legacy `.core-sync.json` 和审核队列共同定义同步边界。
- Hub 可以读取 Satellite 状态，但不会把状态正文复制进 registry。

`.starwork/` 机制运行层边界见：[StarWork Runtime Layer SPEC](./starwork-runtime-layer-spec.md)。

Agent Lanes 协作机制见：[StarWork Agent Lanes 协作机制 SPEC](./agent-lanes-spec.md)。

Skill 管理与分发机制见：[StarWork Skill 管理与分发机制 SPEC](./skill-management-spec.md)。

Kit 收敛方案见：[StarWork Two-Kit Architecture SPEC](./kits/two-kit-architecture-spec.md)。

## v0.1 范围

Core v0.1 故意保持小。它先冻结最小工作区语义，再让 CLI、Packs 和 Adapters 在其上增加自动化。

Core 不包含自媒体内容创作者的专属工作流逻辑。那部分属于 `product/packs/content-creator/`。
