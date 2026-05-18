# StarWork Kit Structure Reference

## 状态

- 版本：v0.1 draft
- 日期：2026-05-15
- 范围：记录当前 `product/core/kits/` 下所有 Kit 的实际结构
- 用途：作为后续梳理 Kit 边界、目录命名、语言一致性和 CLI 生成逻辑的事实依据

本文件记录当前已确认的 Kit 结构快照。后续如果调整 Kit，必须同步更新本文件。

## Kit 列表

| Kit | 定位 |
|---|---|
| `local-starter` | 轻量单项目 Kit。 |
| `local-matter` | 单项目事项型 Kit。 |
| `hub` | 多项目管理中枢 Kit。 |
| `satellite-starter` | 轻量卫星项目 Kit，不启用事项。 |
| `satellite-matter` | 事项型卫星项目 Kit，启用事项。 |

命名原则：Kit 名称不携带语言标签，只表达工作区形态。当前 `product/core/kits/` 下的结构默认以中文 profile 落地。英文 profile 的参考样例放在 `product/core/profiles/en/reference-kits/`，不进入正式 Kit 列表。

## `local-starter`

定位：轻量单项目 Kit。适合单项目、无事项机制、使用参考资料和输出目录的轻量工作区。

```text
.
├── AGENTS.md
├── README.md
├── _系统/
│   ├── 上下文/
│   │   └── 项目状态.md
│   ├── 任务/
│   │   └── 当前工作.md
│   ├── 身份/
│   │   └── README.md
│   └── 教训/
│       └── README.md
├── 参考资料/
│   └── README.md
└── 输出/
    ├── 草稿/
    │   └── README.md
    └── 确认成果/
        └── README.md
```

不包含：

```text
事项/
_系统/上下文/决策.md
```

## `local-matter`

定位：单项目事项型 Kit。适合需要长期事项追踪、跨会话接力和过程沉淀的单项目工作区。

```text
.
├── AGENTS.md
├── README.md
├── _系统/
│   ├── 上下文/
│   │   ├── 项目状态.md
│   │   └── 决策.md
│   ├── 任务/
│   │   └── 当前工作.md
│   ├── 身份/
│   │   └── README.md
│   └── 教训/
│       └── README.md
├── 参考资料/
│   └── README.md
├── 输出/
│   ├── 草稿/
│   │   └── README.md
│   └── 确认成果/
│       └── README.md
└── 事项/
    ├── 注册表.md
    └── _事项模板/
        ├── README.md
        ├── 进度.md
        ├── 笔记.md
        ├── 交接.md
        └── 草稿/
            └── .gitkeep
```

## `hub`

定位：多项目管理中枢 Kit。用于建立主库 / 中枢，不直接创建卫星项目。

```text
.
├── AGENTS.md
├── README.md
├── .incoming/
│   └── README.md
├── _系统/
│   ├── 上下文/
│   │   └── 项目状态.md
│   └── 任务/
│       └── 当前工作.md
├── identity/
│   └── README.md
├── lessons/
│   └── README.md
├── 知识/
│   └── README.md
├── skills/
│   └── README.md
└── 项目/
    ├── README.md
    ├── registry.json
    └── 联络/
        └── README.md
```

说明：

- `identity/`、`lessons/` 保留在中枢根目录，因为它们是主库重点维护的项目。
- `项目/` 使用当前默认中文 profile 的目录名。
- `skills/` 和 `.incoming/` 暂保留英文名，因为它们更像工具 / 协议入口。

## `satellite-starter`

定位：轻量卫星项目 Kit。适合接入主库，但不启用事项机制的项目。

```text
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .core-sync.json
├── .internal/
│   └── README.md
├── .obsidian/
│   └── README.md
├── .agents/
│   └── skills/
│       └── README.md
├── .claude/
│   └── skills/
│       └── README.md
├── _系统/
│   ├── 上下文/
│   │   └── 当前项目.md
│   ├── 任务/
│   │   └── 当前工作.md
│   ├── 身份/
│   │   └── README.md
│   ├── 教训/
│   │   └── README.md
│   ├── 主库同步/
│   │   └── README.md
│   └── 跨项目/
│       ├── README.md
│       ├── inbox/
│       │   └── README.md
│       └── outbox/
│           └── README.md
├── 知识/
│   └── README.md
├── 参考资料/
│   └── README.md
└── 输出/
    ├── 草稿/
    │   └── README.md
    └── 确认成果/
        └── README.md
```

不包含：

```text
事项/
_系统/上下文/决策.md
```

## `satellite-matter`

定位：事项型卫星项目 Kit。适合接入主库，并启用事项机制的项目。

```text
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .core-sync.json
├── .internal/
│   └── README.md
├── .obsidian/
│   └── README.md
├── .agents/
│   └── skills/
│       └── README.md
├── .claude/
│   └── skills/
│       └── README.md
├── _系统/
│   ├── 上下文/
│   │   ├── 当前项目.md
│   │   └── 决策.md
│   ├── 任务/
│   │   └── 当前工作.md
│   ├── 身份/
│   │   └── README.md
│   ├── 教训/
│   │   └── README.md
│   ├── 主库同步/
│   │   └── README.md
│   └── 跨项目/
│       ├── README.md
│       ├── inbox/
│       │   └── README.md
│       └── outbox/
│           └── README.md
├── 知识/
│   └── README.md
├── 参考资料/
│   └── README.md
├── 输出/
│   ├── 草稿/
│   │   └── README.md
│   └── 确认成果/
│       └── README.md
└── 事项/
    ├── 注册表.md
    └── _事项模板/
        ├── README.md
        ├── 进度.md
        ├── 笔记.md
        ├── 交接.md
        └── 草稿/
            └── .gitkeep
```

## 已确认的结构原则

1. 当前正式 Kit 的结构描述默认使用中文 profile。
2. `AGENTS.md`、`README.md`、`CLAUDE.md` 暂保留工具生态约定文件名。
3. 单项目 Kit 中，`身份/` 和 `教训/` 属于 `_系统/`。
4. 卫星项目 Kit 中，`身份/` 和 `教训/` 也放在 `_系统/`，表示它们是主库快照或项目内候选沉淀，不是主库本体。
5. Hub Kit 中，`identity/`、`lessons/` 保留在根目录，因为它们是中枢重点维护对象。
6. `日记/` 不进入 v0.1 Kit。
7. 通用卫星项目不默认包含 `product/`；默认确认成果位置是 `输出/确认成果/`。
8. `knowledge/` 在默认中文 profile 中落地为 `知识/`。
9. 卫星项目分为 no-matter 与 matter 两类：`satellite-starter` 和 `satellite-matter`。
10. 默认中文 profile 的决策文件使用 `_系统/上下文/决策.md`，当前工作文件使用 `_系统/任务/当前工作.md`。
