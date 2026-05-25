# StarWork Runtime Layer SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Core / CLI / Kits / Adapters
- 相关文件：`.starwork/`
- 目标：定义 `.starwork/` 的边界、可放内容、禁止内容，以及各 Kit 的落地方式。

## 一句话定义

`.starwork/` 是 StarWork 机制运行层。

它只存放在 StarWork Core、CLI、Pack、Skill、Adapter 等机制下才需要的状态、索引、manifest、队列、安装记录、缓存和报告。

当前项目的业务事实、事项过程、正式产物、草稿、知识、身份、教训和协作内容，不因为由 StarWork 创建、检查或被 Agent 读取，就进入 `.starwork/`。

## 判断规则

判断一个文件或目录是否应放入 `.starwork/`，先问一个问题：

> 如果这个项目不使用 StarWork，这个内容是否仍然有独立业务价值？

如果答案是“有”，它不应进入 `.starwork/`。例如项目状态、事项笔记、参考资料、正式成果和 Hub 共享知识。

如果答案是“没有，主要服务 StarWork 机制运行”，它可以进入 `.starwork/`。例如 workspace state、Skill manifest、Pack 安装记录、跨项目消息队列状态和 doctor 报告。

## 四层结构

StarWork 工作台的文件可以分为四层。

| 层级 | 说明 | 示例 | 是否进入 `.starwork/` |
|---|---|---|---:|
| StarWork 机制运行层 | StarWork 机制为了识别、检查、安装、分发、同步、投递和缓存而使用的文件。 | `workspace.json`、`skills.json`、`packs/`、`handoff/`、`sync.json`、`reports/`、`cache/` | 是 |
| 项目内容层 | 当前项目自身的事实、过程、材料、成果和协作记录。 | `_系统/上下文/`、`_系统/任务/`、`事项/`、`参考资料/`、`输出/`、`product/` | 否 |
| 工具适配入口层 | 由外部 Agent 或工具约定的入口位置。 | `AGENTS.md`、`CLAUDE.md`、`.agents/skills/`、`.claude/skills/`、`.obsidian/` | 否 |
| Hub 共享资产层 | Hub 拥有的可复用资产，而不是 StarWork 运行状态。 | `identity/`、`lessons/`、`knowledge/`、`skills/` | 否 |

## 标准 `.starwork/` 结构

所有由 StarWork CLI 初始化、生成或升级后的工作台，推荐使用以下结构。具体文件可以按 Kit 和 capability 裁剪。

```text
.starwork/
├── workspace.json
├── skills.json
├── packs/
├── handoff/
│   ├── inbox/
│   ├── outbox/
│   ├── sent/
│   ├── archived/
│   └── state.json
├── sync.json
├── internal/
├── reports/
└── cache/
```

### `workspace.json`

工作台身份状态。

应记录：

- Core schema 和版本。
- `workspace_type`。
- Kit。
- 已安装 Pack。
- 语言。
- 正式事实源路径。
- 当前业务工作区路径。
- 可选能力启用状态或对应路径。

它不记录项目状态正文、事项进度、业务草稿或正式成果。

### `skills.json`

项目实际可用 Skill manifest。

应记录：

- Skill ID。
- 来源类型，例如 system、kit-bundled、pack-bundled、hub-managed、project-local。
- 安装或挂载路径。
- 分发方式，例如 copy、symlink、manual。
- 放入原因。

它不存放 Skill 正文，也不替代 `.agents/skills/`、`.claude/skills/` 等工具入口。

### `packs/`

Pack 安装机制状态。

可以记录：

- 已安装 Pack 的版本信息。
- Pack 模板副本。
- Pack 安装时的 manifest 或 mapping。

Pack 创建出来的业务目录、业务模板实例和用户填写内容不放入 `.starwork/packs/`。

### `handoff/`

跨项目联络机制的本地队列。

可以记录：

- inbox、outbox、sent、archived 等队列。
- 消息投递状态。
- 本地队列 state。

它只承载跨项目投递机制中的消息信封、队列和状态。业务材料正文应留在项目自己的 `事项/`、`matters/`、`product/`、`输出/`、`outputs/`、`knowledge/` 或 Hub 共享资产目录中，并由 handoff 消息引用。

### `sync.json`

主库同步机制状态。

它是 `.core-sync.json` 的下一代推荐位置，用于记录：

- Hub / 主库来源。
- 同步时间。
- Core 版本。
- 同步模式。
- 快照、链接和 Skill 挂载清单。

为了兼容已有工作台，CLI 可以继续读取根目录 `.core-sync.json`，但新工作台应优先写入 `.starwork/sync.json`。

### `internal/`

StarWork 同步机制带来的内部协议快照。

它可以替代根目录 `.internal/`，存放仅供机制和 Agent 参考的稳定协议快照，例如回写协议和合并策略。

如果某个内部协议需要用户日常理解，应在可见目录中提供说明入口，例如 `_系统/主库同步/README.md`，而不是要求用户直接阅读 `.starwork/internal/`。

### `reports/`

StarWork 机制运行报告。

可以记录：

- `doctor` 检查报告。
- `upgrade --dry-run` 结果。
- `spawn --blueprint` 执行报告。
- 迁移报告。

这些报告是机制运行结果，不是项目正式成果。若报告结论需要成为项目决策，应摘录到项目可见的决策或当前工作文件。

### `cache/`

StarWork 机制缓存。

可以记录：

- inventory 缓存。
- signals 缓存。
- 临时索引。
- Adapter 探测缓存。

缓存不得成为唯一事实源。

## 禁止放入 `.starwork/` 的内容

以下内容不应放入 `.starwork/`：

- 当前项目状态正文。
- 当前工作入口。
- 高影响决策正文。
- 事项 / 事项正文、笔记、进度、草稿、交接。
- 项目参考资料。
- AI 草稿和用户确认成果。
- 正式产品、文档、源码或发布物。
- Hub 共享身份、教训、知识和正式 Skill 库。
- Agent Lanes 的工作记录和过程材料。

`.starwork/` 可以引用这些内容的路径，但不拥有这些内容。

## Kit 分类

按照 Two-Kit Architecture，v0.1 的正式 Kit 只有 `project` 和 `hub`。
旧 `local-starter`、`project`、`satellite-starter`、`project`
进入兼容期，只作为 legacy 工作区读取和诊断。

### `project`

应进入 `.starwork/`：

```text
.starwork/workspace.json
.starwork/skills.json
.starwork/packs/
.starwork/reports/
.starwork/cache/
```

不应进入 `.starwork/`：

```text
AGENTS.md
README.md
_系统/上下文/项目状态.md
_系统/任务/当前工作.md
_系统/身份/
_系统/教训/
_系统/主库同步/
知识/
参考资料/
输出/草稿/
输出/确认成果/
```

如果 Project 由 Hub 管理，应进入 `.starwork/`：

```text
.starwork/handoff/
.starwork/sync.json
.starwork/internal/
```

兼容期内，CLI 可以继续生成或读取 `.core-sync.json` 和根目录 `.internal/`；
新事实源优先是 `.starwork/sync.json` 和 `.starwork/internal/`。

### Historical Process Folders

历史项目里的过程目录仍属于项目内容层。

不应进入 `.starwork/`：

```text
_系统/上下文/决策.md
事项/注册表.md
事项/<事项-id>/
事项/<事项-id>/README.md
事项/<事项-id>/进度.md
事项/<事项-id>/笔记.md
事项/<事项-id>/草稿/
事项/<事项-id>/交接.md
```

### Legacy Satellite Kit

旧 `satellite-starter` 和 `project` 的运行层要求等同于
`project + hub binding`。Doctor / audit 应识别这些旧类型，但不再把它们作为新标准输出。

### `hub`

Hub 需要区分机制状态和共享资产。

应进入 `.starwork/`：

```text
.starwork/workspace.json
.starwork/skills.json
.starwork/packs/
.starwork/handoff/
.starwork/reports/
.starwork/cache/
```

不应进入 `.starwork/`：

```text
AGENTS.md
README.md
identity/
lessons/
knowledge/
skills/
projects/
.incoming/
workspace/
```

说明：

- Hub 的 `identity/`、`lessons/`、`knowledge/`、`skills/` 是正式共享资产，不是机制状态。
- Hub 的项目登记、跨项目路由和回写审核队列在 v0.1 仍使用可见目录 `projects/` 与 `.incoming/`；未来如迁入 `.starwork/`，需要单独迁移 SPEC。
- 如果未来需要用户可读的项目组合管理页面，可以在可见目录提供摘要、看板或说明，但机器 registry 仍应以 `.starwork/projects/registry.json` 为准。

## Agent Lanes 边界

Agent Lanes 是 StarWork capability，但 lane 的工作记录和过程材料属于项目协作内容，不应默认放入 `.starwork/`。

推荐拆分：

```text
_系统/协作/agent-lanes.md
_系统/协作/shared.md
_系统/协作/lanes/<lane-id>/worklog.md
_系统/协作/lanes/<lane-id>/workspace/

.starwork/agent-lanes/state.json
.starwork/agent-lanes/cache/
```

其中：

- 可见目录记录 lane 的职责、写入范围、共享输出、请求、工作记录和过程材料。
- `.starwork/agent-lanes/` 只记录 session binding、解析缓存和机制状态。

## 实施方案

### 第一阶段：冻结定义并补齐文档

- 建立本文作为 `.starwork/` 边界事实源。
- 在 Core README、baseline file boundaries、Kit structure reference 和相关 capability 文档中引用本文。
- 明确 `.starwork/` 是机制运行层，不是隐藏内容目录。

### 第二阶段：CLI 兼容迁移

- 新工作台写入 `.starwork/sync.json`，同时可按兼容需要写入或读取 `.core-sync.json`。
- `doctor` 同时识别 `.starwork/sync.json` 和 `.core-sync.json`，但对新结构给出更高优先级。
- `spawn` 和 `init` 生成的新 Kit 以本文结构为准。
- `upgrade` 可把旧 `.core-sync.json` 和 `.internal/` 迁移到 `.starwork/`，同时保留可见说明入口。

### 第三阶段：Hub 结构收敛

- 将 Hub 的机制 registry、coordination 和 incoming 队列收敛到 `.starwork/`。
- 保留或新增用户可见的 Hub 说明、摘要或看板，但不把机器状态散落到根目录。
- 确认 Hub 共享资产目录继续留在根层。

### 第四阶段：Agent Lanes 拆分

- 保留 `_系统/协作/` 作为项目协作事实层。
- 将 session binding 等机器状态迁入 `.starwork/agent-lanes/state.json`。
- `multiagent status` 组合读取可见 registry 与 `.starwork` 状态。

## 兼容规则

- 已存在的 `.core-sync.json` 是 legacy-compatible sync metadata。
- 已存在的 `.internal/` 是 legacy-compatible internal protocol snapshot。
- 已存在的 `_系统/跨项目/` 或 `_system/cross-project/` 是 legacy-compatible local handoff。
- CLI 和 doctor 可以继续读取这些旧路径，但新生成结构应优先使用 `.starwork/`。

## 非目标

`.starwork/` 不用于：

- 替代项目正式事实源。
- 隐藏用户应该审阅的草稿和事项。
- 存放 Pack 生成的业务内容。
- 存放 Hub 共享知识正文。
- 规避项目目录边界。
