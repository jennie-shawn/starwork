# StarWork Kit Structure Reference

## 状态

- 版本：v0.1 draft
- 日期：2026-05-25
- 范围：记录 `product/core/kits/` 下正式 Kit 的目标结构和 `.starwork/` 分层边界

## 正式 Kit

v0.1 只保留两类正式 Kit：

| Kit | 定位 |
|---|---|
| `project` | 具体项目工作台；可独立使用，也可由 Hub 管理。 |
| `hub` | 多项目管理中枢；维护共享身份、教训、知识、skills、项目注册和联络路由。 |

旧事项分叉不再作为 Kit、Preset 或 CLI 兼容入口保留。历史项目里如果已经有 `事项/` 或 `matters/`，Doctor 只把它暴露为历史内容信号，后续由 AI 判断如何无损整理。

## 分层原则

| 层级 | 放什么 | 不放什么 |
|---|---|---|
| `.starwork/` | StarWork 机制运行状态、manifest、队列、安装记录、缓存和报告。 | 项目业务事实、草稿、正式成果、Hub 共享资产正文。 |
| `_系统/` 或 `_system/` | 项目协作事实，例如项目状态、当前工作、主库同步说明、决策和协作索引。 | StarWork 机制缓存、投递队列、安装 manifest。 |
| `参考资料/` / `references/` | 当前项目输入资料。 | Pack 安装记录或 CLI 缓存。 |
| `输出/` / `outputs/` | 当前项目草稿和用户确认成果。 | StarWork 机制报告，除非用户确认晋升为项目成果。 |
| `identity/`、`lessons/`、`knowledge/`、`skills/` | Hub 共享资产或项目本地上下文资产。 | 机制队列和缓存。 |
| `.agents/`、`.claude/`、`.obsidian/` | 外部工具入口和配置。 | StarWork 自有机制事实源。 |

## 通用 `.starwork/`

所有由 StarWork CLI 初始化、生成或升级后的工作台推荐包含：

```text
.starwork/
├── workspace.json
├── skills.json
├── packs/
├── reports/
└── cache/
```

接入 Hub 的 Project 额外包含：

```text
.starwork/
├── handoff/
├── sync.json
└── internal/
```

其中：

- `handoff/` 是本地跨项目收发队列。
- `sync.json` 是主库同步元数据，替代 legacy `.core-sync.json`。
- `internal/` 是主库内部协议快照，替代 legacy `.internal/`。

## `project`

中文目标结构：

```text
.
├── AGENTS.md
├── README.md
├── CLAUDE.md
├── .starwork/
├── .internal/
├── .obsidian/
├── .agents/skills/
├── .claude/skills/
├── _系统/
│   ├── 上下文/
│   │   └── 当前项目.md
│   ├── 任务/
│   │   └── 当前工作.md
│   ├── 身份/
│   ├── 教训/
│   └── 主库同步/
├── 知识/
├── 参考资料/
└── 输出/
    ├── 草稿/
    └── 确认成果/
```

英文镜像结构：

```text
.
├── AGENTS.md
├── README.md
├── CLAUDE.md
├── .starwork/
├── .internal/
├── .obsidian/
├── .agents/skills/
├── .claude/skills/
├── _system/
│   ├── context/
│   │   └── current-project.md
│   ├── tasks/
│   │   └── current-work.md
│   ├── identity/
│   ├── lessons/
│   └── main-repo-sync/
├── knowledge/
├── references/
└── outputs/
    ├── drafts/
    └── final/
```

Project 不默认创建事项目录。需要多推进线时，先通过 Pack、Skill 或用户自定义目录表达，不再切 Kit。

## `hub`

Hub Kit 统一使用英文协议路径，中文用户通过中文 README、AGENTS 和规则文案理解。

```text
.
├── AGENTS.md
├── README.md
├── .starwork/
│   ├── workspace.json
│   ├── skills.json
│   └── handoff/
├── .incoming/
├── .internal/
├── identity/
├── lessons/
├── knowledge/
├── projects/
│   ├── README.md
│   ├── registry.json
│   └── coordination/
├── skills/
│   ├── README.md
│   └── registry.json
└── workspace/
    └── README.md
```

Hub 不维护项目状态和当前工作入口。Hub 只记录项目在哪里、共享资源在哪里、跨项目联络如何路由。
