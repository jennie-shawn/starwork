# StarWork Agent Lanes 协作机制 SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Core / CLI / Adapters
- 相关能力：`agent-lanes`
- 相关 CLI：`starwork multiagent`
- 目标：定义同一项目内多个 Agent 会话如何按稳定职责位分工协作，并保持输出可发现、边界可审计、上下文可接力。

## 一句话定义

Agent Lanes 是 StarWork 的多 Agent 分工协作机制。

它不追踪“多个事项”，而是追踪“多个职责位”：

```text
<lane-id> lane 负责一个稳定工作面
```

每个 lane 可以绑定一个当前 Agent 会话。Agent 进入项目后，应先确认自己属于哪个 lane，再按该 lane 的写入边界工作。

StarWork 不内置固定 lane 清单。开发、写作、课程、研究、运营、法务、设计或客户交付项目都可以按自己的实际职责定义 lane。

## 背景

事项能力 解决的是“一个事项如何长期推进、记录和归档”。

多 Agent 协作常常不是按事项拆分，而是按工作面拆分：

- 开发项目中可能是接口、界面、验证。
- 内容项目中可能是选题、撰稿、审校、发布。
- 研究项目中可能是资料收集、分析、报告、复核。
- 客户交付项目中可能是需求、方案、执行、验收。

如果把每个 Agent 都建成一个 事项，会把机制做重，也会混淆“事情”和“职责”。因此 Agent Lanes 独立于 事项能力：它是协作层，不是事项层。

## 设计原则

1. 少到不能再少：只保留让多会话分工真正跑起来的能力。
2. 人和 Agent 都能读：v0.1 先使用 Markdown 作为事实源，不强制 JSON manifest。
3. 职责位稳定，会话可替换：lane 是长期职责，session 是当前接手它的会话。
4. 写入边界优先：先避免互相踩文件，再谈复杂协同。
5. 输出只登记，不搬运：其他 lane 需要读取的产物进入共享索引，产物本身仍留在合理位置。
6. 不引入任务系统：Agent Lanes 不做排期、看板、锁、自动调度或冲突仲裁。
7. 不预设职责分类：lane ID、数量和职责由项目场景定义，不由 Core 写死。

## 核心概念

| 概念 | 定义 |
|---|---|
| Lane | 一个稳定职责位，例如某个项目里的 `research`、`writing`、`review`。示例不是内置分类。 |
| Session | 当前接手某个 lane 的具体 Agent 会话，例如 Codex thread。 |
| Worklog | 某个 lane 的持续工作记录。它不是离职交接，而是当前上下文、输出、请求和下一步。 |
| Lane Workspace | 某个 lane 自己的过程工作区，用于放草稿、调研笔记、中间分析和临时产物。 |
| Shared Context | 跨 lane 共享索引，记录其他 Agent 需要读取的输出、请求和已确认约定。 |
| Write Scope | 某个 lane 可以主动修改的文件范围。 |

## 必要能力

### 1. Lane Registry

项目必须有一个稳定位置登记所有 lane。

默认中文路径：

```text
_系统/协作/agent-lanes.md
```

最小字段：

| 字段 | 含义 |
|---|---|
| `lane` | lane ID，建议使用英文短名，例如 `research`。 |
| `purpose` | 该 lane 的职责。 |
| `current_session` | 当前 CLI v0.1 兼容字段；目标结构中迁移到 `.starwork/agent-lanes/state.json`。 |
| `write_scope` | 该 lane 可主动修改的路径范围。 |
| `worklog` | 该 lane 的工作记录位置。 |
| `workspace` | 该 lane 的过程工作区位置。 |

目标分层：

```text
_系统/协作/agent-lanes.md              # lane 稳定定义和写入范围
_系统/协作/shared.md                   # 跨 lane 可见索引
_系统/协作/lanes/<lane-id>/worklog.md  # 项目协作记录
_系统/协作/lanes/<lane-id>/workspace/  # 项目过程材料
.starwork/agent-lanes/state.json       # session binding 等机制状态
.starwork/agent-lanes/cache/           # 解析缓存
```

Lane 的 worklog 和 workspace 属于项目协作内容，不进入 `.starwork/`。`.starwork/agent-lanes/` 只记录 StarWork 机制运行需要的绑定状态和缓存。

示例：

以下示例使用 `research`、`writing`、`review`，只为了说明格式；真实项目应替换成自己的 lane。

```md
# Agent Lanes

## Lanes

| lane | purpose | current_session | write_scope | worklog | workspace |
|---|---|---|---|---|---|
| research | 资料收集和事实核查 | codex:019e... | knowledge/**, notes/** | lanes/research/worklog.md | lanes/research/workspace |
| writing | 草稿撰写和结构整理 | unbound | drafts/**, product/docs/** | lanes/writing/worklog.md | lanes/writing/workspace |
| review | 审校、验证和风险检查 | unbound | reviews/**, product/docs/** | lanes/review/worklog.md | lanes/review/workspace |
```

### 2. Session Binding

会话绑定只回答一个问题：

```text
当前会话属于哪个 lane？
```

最小规则：

- 一个会话同一时间只绑定一个 lane。
- 一个 lane 同一时间最多一个主 session。
- Codex 优先使用 `CODEX_THREAD_ID` 作为 session ID。
- 读取不到真实 session ID 时，可使用手写 ID，例如 `codex:manual-research-1`。
- 未绑定 lane 的 Agent 不应默认接管整个项目。

### 3. Write Scope

每个 lane 必须声明写入范围。

规则：

- lane 内文件：可以主动修改。
- lane 外文件：修改前应先在 Shared Context 记录请求或说明理由。
- 共同入口文件，例如 `AGENTS.md`、Core 协议、公共 schema，默认视为 shared scope，需要明确对齐后再改。

Write Scope 是 Agent Lanes 的核心安全边界。没有写入边界，就只是给会话贴标签。

### 4. Worklog

每个 lane 必须有一个 worklog。

默认路径：

```text
_系统/协作/lanes/<lane-id>/worklog.md
```

最小模板：

```md
# Backend Worklog

## Current

当前正在处理什么。

## Outputs

| title | path | audience | status |
|---|---|---|---|

## Requests

| to | request | status | link |
|---|---|---|---|

## Notes

过程记录、临时判断、上下文说明。

## Next

下一步建议。
```

`worklog.md` 不是日报，也不是完整过程档案。它只保留让同一 lane 下一个会话能接住工作的必要信息。

### 5. Lane Workspace

每个 lane 默认有一个过程工作区。

默认路径：

```text
_系统/协作/lanes/<lane-id>/workspace/
```

最小文件：

```text
_系统/协作/lanes/<lane-id>/workspace/README.md
```

Lane Workspace 用来放该职责位自己产生的过程材料：

- 调研笔记。
- 未确认草稿。
- 中间分析。
- 临时实验结果。
- 给同一 lane 后续会话看的上下文材料。

Lane Workspace 不是项目正式输出目录。它更像该职责位的工作桌。

### 6. Shared Context

如果某个 lane 的输出需要其他 lane 读取，必须登记到共享索引。

默认路径：

```text
_系统/协作/shared.md
```

最小模板：

```md
# Shared Agent Context

## Shared Outputs

| from | title | path | audience | status | updated |
|---|---|---|---|---|---|

## Cross-Lane Requests

| from | to | request | status | link |
|---|---|---|---|---|

## Shared Agreements

| agreement | owner | status | link |
|---|---|---|---|
```

共享索引只放“别人需要知道的东西”，不复制完整内容。

示例：

```md
| research | Source summary | product/docs/source-summary.md | writing,review | draft | 2026-05-21 |
```

## 推荐目录结构

默认中文路径：

```text
_系统/协作/
├── agent-lanes.md
├── shared.md
└── lanes/
    ├── research/
    │   ├── worklog.md
    │   └── workspace/
    │       └── README.md
    ├── writing/
    │   ├── worklog.md
    │   └── workspace/
    │       └── README.md
    └── review/
        ├── worklog.md
        └── workspace/
            └── README.md
```

v0.1 不默认创建 `notes/`、`drafts/`、`artifacts/` 子目录。

如果某个 lane 确实需要更细的过程材料分类，可以在自己的 workspace 内按需新增：

```text
_系统/协作/lanes/<lane-id>/workspace/notes/
_系统/协作/lanes/<lane-id>/workspace/drafts/
_系统/协作/lanes/<lane-id>/workspace/artifacts/
```

但这不是默认结构。

## 产物放置规则

| 内容类型 | 放置位置 |
|---|---|
| lane 当前上下文 | 对应 lane 的 `worklog.md` |
| lane 过程材料、草稿、中间分析 | 对应 lane 的 `workspace/` |
| 其他 lane 需要读取的索引 | `_系统/协作/shared.md` |
| 已确认的正式产物 | 晋升到项目正式事实源，例如 `product/` |

关键规则：

> 需要其他 Agent 读取的输出，必须在 Shared Context 登记；成熟产物仍以项目正式事实源为准。

推荐流转：

```text
lane workspace 产生过程材料
  -> 如需其他 lane 读取，登记 shared.md
  -> 如被确认有项目价值，晋升到正式输出目录
  -> 晋升后以正式输出目录为准
```

## Agent 运行规则

当项目存在 `_系统/协作/agent-lanes.md` 时，Agent 进入项目后应：

1. 读取 `AGENTS.md`。
2. 读取项目状态和当前工作。
3. 读取 `_系统/协作/agent-lanes.md`。
4. 判断当前会话是否已经绑定 lane。
5. 若已绑定，只主动修改该 lane 的 `write_scope`。
6. 若未绑定，先请用户指定 lane，或在用户明确授权后创建 lane。
7. 需要其他 lane 配合时，写入 `_系统/协作/shared.md` 的 `Cross-Lane Requests`。
8. 产出需要其他 lane 读取的内容时，写入 `Shared Outputs`。
9. 结束当前工作前更新本 lane 的 `worklog.md`。

## CLI 设计

CLI 只做确定性文件操作，不替 Agent 判断项目该如何分工。

推荐命令名：

```bash
starwork multiagent
```

不用 `starwork agents`，避免和 Codex、Claude、Cursor 这类 Agent runtime 混淆。

### `starwork multiagent init`

创建最小协作结构。

```bash
starwork multiagent init
starwork multiagent init --lanes research,writing,review
starwork multiagent init --target ./my-project
```

行为：

- 创建 `_系统/协作/agent-lanes.md`。
- 创建 `_系统/协作/shared.md`。
- 为用户指定的 lane 创建 `worklog.md` 和 `workspace/README.md`。
- 不覆盖已有文件。

### `starwork multiagent add`

新增 lane。

以下命令只是示例。CLI 不内置 `research`，也不要求项目使用这一组 lane。

```bash
starwork multiagent add research \
  --purpose "资料收集和事实核查" \
  --write "knowledge/**,notes/**"
```

行为：

- 在 `agent-lanes.md` 的 `Lanes` 表增加一行。
- 创建 `_系统/协作/lanes/<lane-id>/worklog.md`。
- 创建 `_系统/协作/lanes/<lane-id>/workspace/README.md`。
- 当前 CLI v0.1 中 `current_session` 默认为 `unbound`；后续目标结构中由 `.starwork/agent-lanes/state.json` 记录绑定状态。

### `starwork multiagent bind`

将当前会话绑定到 lane。

```bash
starwork multiagent bind research
starwork multiagent bind research --agent codex
starwork multiagent bind research --session codex:manual-research-1
```

行为：

- Codex 环境优先读取 `CODEX_THREAD_ID`。
- 当前 CLI v0.1 更新 `agent-lanes.md` 中对应 lane 的 `current_session`。
- 后续目标结构改为更新 `.starwork/agent-lanes/state.json`，可见 registry 不再承担机器绑定状态。
- 如果 lane 已绑定其他 session，必须提示冲突；非交互模式默认拒绝覆盖。

### `starwork multiagent release`

释放 lane 的当前会话绑定。

```bash
starwork multiagent release research
```

行为：

- 当前 CLI v0.1 将 `current_session` 改回 `unbound`。
- 后续目标结构改为清理 `.starwork/agent-lanes/state.json` 中的绑定。
- 提醒用户或 Agent 更新该 lane 的 `worklog.md`。
- 不删除任何记录。

### `starwork multiagent status`

查看当前分工。

```bash
starwork multiagent status
```

输出应包括：

- lane 列表。
- 当前 session 绑定状态。
- write scope 摘要。
- 最近需要关注的 shared requests。

### `starwork multiagent share`

登记一个跨 lane 可读输出。

```bash
starwork multiagent share research \
  --title "Source summary" \
  --path "product/docs/source-summary.md" \
  --audience "writing,review" \
  --status draft
```

行为：

- 在 `_系统/协作/shared.md` 的 `Shared Outputs` 中追加一行。
- 不移动、不复制目标文件。

### v0.1 CLI 不做什么

- 不自动决定 lane 划分。
- 不自动分配任务。
- 不做文件锁。
- 不做权限系统。
- 不做并发编辑仲裁。
- 不分析 git diff 来判断责任归属。
- 不把项目协作内容迁入 `.starwork/`。
- 不把 lane 写入 `matters/registry.md`。

## 与其他机制的关系

### 与 事项能力

Agent Lanes 不属于 事项能力。

- 事项机制 追踪事情。
- Lane 追踪职责。

二者可以同时存在，但互不替代。一个 lane 可以参与多个 事项，一个 事项 也可以需要多个 lane 协作。

### 与 Adapt

`starwork adapt` 负责让某个 Agent runtime 知道 StarWork 入口规则。

Agent Lanes 负责让进入项目后的会话知道自己在项目中的职责位。

### 与 Skills

未来可以新增 `starworkLanes` skill，帮助 Agent 判断是否需要 lane、如何采访用户、如何生成 lane 初始分工。

v0.1 不要求先有 skill；CLI 和 Markdown 结构已可手动运行。

## 验收标准

一套 Agent Lanes 机制成立，至少需要满足：

- 用户能在一个文件里看到当前所有 lane、会话绑定和写入范围。
- 一个新 Agent 会话能判断自己是否已绑定 lane。
- 多个由项目自定义的 lane 能在同一项目中并行工作而不默认互相修改文件。
- 一个 lane 的输出能通过 Shared Context 被其他 lane 发现。
- 任一 lane 结束工作前能通过 worklog 留下足够上下文。
- 不启用 事项能力 的单事务项目也能使用 Agent Lanes。

## 后续问题

这些问题暂不进入 v0.1：

- 是否需要 lane 级别的默认验证命令。
- 是否需要从 git diff 自动生成 worklog 摘要。
- 是否需要跨 lane 依赖图。
- 是否需要 Hub 统一管理多个项目的 lane 模板。
- 是否需要为不同场景提供可选 lane 模板，例如开发、写作、研究、客户交付；模板只能作为建议，不能成为 Core 内置固定职责。
