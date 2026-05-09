# Capability: main-repo-sync v0.1

`main-repo-sync` 描述主库与卫星项目之间的 Hub + Satellite 模型。

它不只是共享身份或共享教训，而是一整套协同模型：

- Hub 是规则源、可复用知识源、项目注册表、skill 来源和消息路由层。
- Satellites 是具体执行工作区。
- 初始化时复制稳定快照。
- 部分资源以只读链接方式挂载。
- 同步元数据记录在 `.core-sync.json`。
- 项目发现依赖 Hub 的 registry。
- 可复用更新通过 inbox / review 流程回写。

## 核心模型

一句话：

> Hub 负责共享、可复用、可审计的公共机制；每个 Satellite 负责自己的项目事实和执行过程。

这意味着 Hub 可以发现、初始化、同步和联络 Satellite，但 Hub 不会变成这些项目的进度数据库。

## Hub 职责

Hub 维护跨项目可复用资源：

- `identity/`
- `lessons/`
- `.internal/` protocols
- `knowledge/`
- 共享 skills
- 项目注册表
- 跨项目消息路由
- 可复用内容回写审核队列

Hub 不应该存放项目特定的执行内容。

## Satellite 工作区职责

Satellite 工作区负责具体项目执行：

- 项目状态
- 当前工作
- 过程材料
- 项目正式事实源
- 项目专属决策和产出

Satellite 可以包含来自主库的快照或链接，但这些资源默认仍然是共享参考层。

## Satellite 必需层

一个由 Hub 管理的 Satellite 通常包含这些固定层：

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `.core-sync.json`
- 一个可见的主库同步说明，例如 `_系统/主库同步/README.md` 或 `_system/hub-sync/README.md`
- `identity/`
- `lessons/`
- `.internal/`
- `.obsidian/`
- `knowledge/` 作为只读链接
- `_系统/上下文/current-projects.md` 或 `_system/context/current-projects.md`，用于兼容当前 Hub 读取机制
- `_系统/任务/` 或 `_system/tasks/`
- `_系统/跨项目/` 或 `_system/cross-project/`
- `_系统/diary/` 或 `_system/diary/`

StarWork Core 可以引入 `project-status.md` 作为更清晰的标准角色文件名，但兼容 Hub 的 presets 必须继续支持当前的 `current-projects.md` 事实源。

## 同步语义

| 资源 | 在 Satellite 中的形态 | 默认同步语义 |
|---|---|---|
| `identity/` | 复制快照 | 初始化自主库；后续更新需要手动确认。 |
| `lessons/` | 复制快照 | 初始化自主库；项目特定教训先留在本地，确认可复用后再回写。 |
| `.internal/` | 复制指定协议文件 | 只同步稳定协议，例如回写协议和合并策略。 |
| `.obsidian/` | 复制配置 | 提供默认 Obsidian 本地行为。 |
| `knowledge/` | 只读软链接 | 主库仍然是事实源。 |
| `.core-sync.json` | 本地元数据 | 记录来源路径、版本、同步时间、挂载资源和 skills。 |
| shared skills | 软链接 | 不要把共享 skills 复制成项目内独立分叉。 |

## Registry 边界

Hub 的 `projects/registry.json` 存放项目发现与同步元数据：

- 项目 ID
- 名称
- 路径
- 状态
- 创建日期
- 最近同步时间
- Core 版本
- 同步模式
- 共享资源

它不能存放项目进度正文。

项目进度留在 Satellite 工作区内，通常位于：

- `_系统/上下文/current-projects.md`
- `_system/context/current-projects.md`
- 或 profile 声明的 Core v0.1 项目状态角色文件

## 状态读取顺序

工具和 adapters 应按以下顺序读取项目状态：

1. 工作区规则或 preset 声明的状态文件
2. `_系统/上下文/current-projects.md`
3. `_system/context/current-projects.md`
4. `_系统/上下文/project-status.md`
5. `_system/context/project-status.md`

如果多个文件同时存在，工作区规则必须明确唯一事实源。其他文件应作为别名、指针或生成副本，而不是第二份独立维护的状态文件。

## 回写边界

Satellite 工作区中出现的可复用建议，应通过主库审核流程回写，例如 `.incoming/`。

跨项目 handoff 用于项目之间的请求、依赖、通知和交接。它不能替代主库的可复用知识审核队列。

| 机制 | 用途 | 是否改变 Hub 正式内容 |
|---|---|---:|
| `.incoming/` | Satellite 向 Hub 提交候选身份、教训、报告或知识更新。 | 只有 Hub 审核后才会改变。 |
| cross-project handoff | 一个项目向另一个项目发送请求、同步、依赖或回复。 | 不会。 |

## 生命周期

| 状态 | 含义 | Hub 行为 |
|---|---|---|
| `active` | 项目正在推进。 | 纳入正常项目发现和状态读取。 |
| `paused` | 项目有意暂停，但未来可能恢复。 | 保留 registry 记录和项目事实，不把沉默视为异常。 |
| `archived` | 项目作为历史参考。 | 保留 registry 记录和项目目录；实时汇总时默认跳过。 |
