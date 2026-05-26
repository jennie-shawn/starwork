# StarWork Project Rules Optimization SPEC

## 状态

- 版本：v0.1 draft
- 日期：2026-05-26
- 所属模块：Core / CLI / Skills / Packs / Adapters
- 触发问题：A 测用户使用 `starworkDoctor` 生成升级方案后，升级项目里的 `AGENTS.md` 内容混乱、冗长、边界不清
- 目标：建立 StarWork 的项目规则文档机制，让 `AGENTS.md`、`CLAUDE.md`、Pack 规则、Blueprint 规则和 Upgrade 规则都可生成、可检查、可升级

## 一句话定义

StarWork 的规则文档不应是“把所有背景和判断塞进 `AGENTS.md`”，而应是一套分层的 Agent 规则系统：

```text
薄入口
  + 强路由
  + 结构化状态
  + 受控规则槽
  + 局部覆盖规则
  + 可检查健康度
```

其中：

- `AGENTS.md` 是 Agent 进入项目后的导航牌和行为契约。
- `.starwork/workspace.json` 是 CLI 可检查、可执行的机器事实。
- Pack / Blueprint / Upgrade 只写入受控规则槽。
- `CLAUDE.md`、Cursor rules、Trae rules 是适配入口，不是第二套规则事实源。
- 用户原有规则文档需要被保留，并提炼出仍有效的项目规则融入 StarWork 规则槽。

## 当前问题

### 1. `AGENTS.md` 容易变成混杂大文档

当前 `init`、`pack install`、`spawn --blueprint`、`upgrade --blueprint` 都可能向 `AGENTS.md` 追加规则。

问题是：

- 缺少统一规则槽 schema。
- 缺少规则片段长度和结构约束。
- 缺少重复注入治理。
- 缺少“入口文件只做路由”的硬边界。
- Skill 生成规则时容易把背景、判断、解释和执行规则混写。

### 2. `starworkDoctor` 没有明确约束升级规则质量

当前 `starworkDoctor` 会指导 Agent 生成：

```text
<workspace>-upgrade/
├── upgrade-blueprint.json
└── rules/
    └── core-boundaries.md
```

但它没有强制：

- `rules/*.md` 必须是短规则片段。
- 规则片段必须按固定结构输出。
- 原有规则应如何提炼。
- 不能把完整项目背景写进入口文件。
- 不能把低置信度推断写成硬规则。

### 3. CLI 规则管理曾直接污染入口文档

当前 `inject_agent_rules` 的行为是：

```markdown
## StarWork 升级规则

这里直接追加升级规则正文。
```

它能避免整文件覆盖，但仍存在：

- 同类规则多次追加后结构膨胀。
- 不同来源规则标题不统一。
- 无法区分 Core / Pack / Blueprint / Upgrade / User preserved rule。
- doctor 很难判断规则是否健康。
- 如果把机器 marker 写进 `AGENTS.md`，用户在原始 Markdown 中会直接看到类似 `<!-- StarWork Rule Slot: xxx -->` 的技术占位符，入口文档会显得很脏。

### 4. 原有规则文档只被“保留”，没有被“吸收”

当前实现会保留已有 `AGENTS.md` 原文，然后追加 StarWork 升级规则。

这能避免破坏用户内容，但不等于完成规则迁移。

缺口：

- 如果用户原来有 `CLAUDE.md`、`.cursorrules`、`.cursor/rules/*` 或旧 `AGENTS.md`，其中有效规则没有被提炼成 StarWork 规则槽。
- 如果原有规则冗长、冲突、过时，StarWork 只是保留它，不能帮助用户变清楚。
- 如果原有规则和 `.starwork/workspace.json` 冲突，目前缺少诊断和处理策略。

因此本优化必须新增“原有规则提炼与融入”机制。

## 目标模型

### 规则分层

| 层级 | 文件 / 位置 | 职责 | 是否机器可检查 |
|---|---|---|---|
| 全局个人记忆 | Agent memory / 全局 AGENTS | 用户长期偏好、通用工作习惯 | 否 |
| 项目入口规则 | `AGENTS.md` | 先读什么、项目边界、写入边界、确认门槛 | 部分 |
| Agent 适配入口 | `CLAUDE.md`、Cursor rules、Trae rules | 引导特定 Agent 回到 `AGENTS.md` 和 StarWork 状态 | 部分 |
| 机器事实 | `.starwork/workspace.json` | workspace type、kit、paths、packs、skills、customization | 是 |
| 受控规则片段 | `.starwork/rules/` | Core / Pack / Blueprint / Upgrade / User extracted rules | 是 |
| 局部规则 | 子目录 `AGENTS.md` | 子目录内局部覆盖和禁区 | 部分 |
| 过程和背景 | `matters/`、lane worklog、knowledge、lessons | 背景、过程、经验、知识 | 否 |

### `AGENTS.md` 目标结构

根 `AGENTS.md` 应尽量保持薄入口：

```markdown
# StarWork Entry Rules

## Read First

## Workspace Role

## Write Boundaries

## Confirm Before

## StarWork 扩展规则

执行任务前请同时读取 `.starwork/rules/index.md`。
```

允许保留用户原文，但应尽量逐步迁移为 `.starwork/rules/` 中的受控规则片段和明确路由。

## 规则片段标准

### 存放格式

机器可管理信息不写进 `AGENTS.md` 正文，而是存放到：

```text
.starwork/rules/
├── index.md
├── manifest.json
├── pack.general.workflow.md
└── upgrade.core_boundaries.md
```

`slot-id` 命名：

```text
core.entry
core.write_boundaries
pack.<pack-id>.<rule-id>
blueprint.<project-id>.<rule-id>
upgrade.core_boundaries
upgrade.hub_boundaries
user.preserved.<source-id>
adapter.<agent>
```

### Slot metadata

v0.1 使用 `.starwork/rules/manifest.json` 作为机器索引，不在 `AGENTS.md` 写入 HTML comment marker。

v0.2 可考虑在 `.starwork/workspace.json` 增加：

```json
{
  "rules": {
    "slots": [
      {
        "id": "upgrade.core_boundaries",
        "source": "upgrade",
        "target": "AGENTS.md",
        "managed": true,
        "updated_at": "2026-05-26T00:00:00.000Z"
      }
    ]
  }
}
```

### Slot 内容约束

每个规则槽必须：

- 只写行为规则，不写长背景。
- 优先使用短列表。
- 明确路径边界。
- 明确是否只读。
- 明确需要用户确认的动作。
- 不重复 `.starwork/workspace.json` 中已有的机器事实，除非用于人类可读解释。

每个规则槽禁止：

- 写项目完整历史。
- 写会议纪要。
- 写大段架构说明。
- 写低置信度推断。
- 写和 workspace state 冲突的路径。
- 写“可能”“大概”这类不适合作为硬规则的判断。

## 原有规则提炼与融入

### 目标

升级历史工作区时，用户原有规则文档不能简单丢弃，也不能原封不动堆在入口文件里。

StarWork 应采用：

```text
保留原文
  + 提炼有效规则
  + 标记来源
  + 融入受控规则槽
  + 标出冲突和待确认项
```

### 输入来源

`starworkDoctor` 生成 upgrade blueprint 前，应读取并分析：

```text
AGENTS.md
CLAUDE.md
.cursorrules
.cursor/rules/**
.trae/rules/**
README.md 中明显的 Agent 工作规则段
```

只读取规则相关文件，不扩大到全量业务内容。

### 提炼分类

将原有规则分成五类：

| 类型 | 处理方式 |
|---|---|
| 可直接保留 | 写入 `user.preserved.<source-id>` 规则槽 |
| 可转为 StarWork 边界 | 合并到 `upgrade.core_boundaries` |
| 已被 Core / Pack 覆盖 | 不重复写入，写入 upgrade notes |
| 冲突或过时 | 不写入硬规则，列为待确认问题 |
| 背景说明 | 不写入 `AGENTS.md`，建议放到 README、knowledge 或 matters |

### 输出文件

推荐 upgrade blueprint 目录增加：

```text
<workspace>-upgrade/
├── upgrade-blueprint.json
├── rules/
│   ├── core-boundaries.md
│   ├── user-preserved-rules.md
│   └── rule-conflicts.md
└── notes/
    └── original-rules-summary.md
```

其中：

- `user-preserved-rules.md`：从旧规则文档中提炼出的仍有效规则。
- `rule-conflicts.md`：冲突、过时或需要用户确认的规则，不直接注入。
- `original-rules-summary.md`：给人看的来源摘要，不进入 `AGENTS.md`。

### Blueprint action

新增或复用 `inject_agent_rules`：

```json
{
  "type": "inject_agent_rules",
  "target": "AGENTS.md",
  "from": "rules/user-preserved-rules.md",
  "slot": "user.preserved.original_rules"
}
```

如果原 `AGENTS.md` 已存在，CLI 仍保留原文；但 `starworkDoctor` 应建议用户后续逐步将旧规则迁移到受控 slot，避免长期双轨。

## 各模块优化要求

### Core

新增正式规格：

```text
product/core/project-rules-mechanism-spec.md
```

内容来自本 SPEC 和预研结论，定义：

- 规则分层。
- `AGENTS.md` 目标结构。
- `.starwork/rules/` 规则片段索引。
- 原有规则提炼策略。
- 子目录 `AGENTS.md` 使用原则。
- `.starwork/workspace.json` 与 Markdown 规则的边界。

### Kit

重写 Kit 入口规则模板：

```text
product/core/kits/project/AGENTS.md
product/core/kits/hub/AGENTS.md
product/core/kits/*/CLAUDE.md
```

要求：

- 更薄。
- 更像导航牌。
- 不承载长背景。
- 明确指向状态文件和当前工作入口。
- 预留统一 `Rule Slots` 区域。

### Packs

Pack 规则片段必须变短，并绑定 slot。

Pack 不提供完整 `AGENTS.md`。

Pack `languages/<language>.json` 中的 rules 应明确：

```json
{
  "slot": "pack.general.workflow",
  "from": "rules/zh/workflow.md",
  "kind": "workflow",
  "max_lines": 20
}
```

### CLI

需要升级这些函数：

- `renderInstalledPackRules`
- `buildUpgradeAgentRuleAction`
- `buildBlueprintRuleSlotActions`

目标：

1. 从“追加 Markdown”改成“写入 / 更新 `.starwork/rules/<slot-id>.md`”。
2. `AGENTS.md` 只保留干净的索引提示，不出现 HTML comment marker。
3. slot 已存在时更新同名规则文件，不重复追加。
4. `manifest.json` 记录 slot、标题、分组和文件路径。
5. 对规则片段做基础质量检查：
   - 空内容拒绝。
   - 内容过长提示或失败。
   - source 不允许跳出 blueprint / pack 目录。
   - target 默认只能是 `AGENTS.md` 或受支持的 adapter rule。

### Doctor CLI

新增规则健康检查：

| 检查 | 说明 |
|---|---|
| `rules.entry.exists` | `AGENTS.md` 存在 |
| `rules.entry.read_first` | 入口规则有 Read First 或等价段落 |
| `rules.entry.write_boundaries` | 有写入边界 |
| `rules.entry.confirm_before` | 有确认门槛 |
| `rules.index.exists` | `.starwork/rules/index.md` 存在 |
| `rules.manifest.valid` | `.starwork/rules/manifest.json` 可解析 |
| `rules.slots.no_duplicates` | 同一 slot 不重复 |
| `rules.slots.length` | 规则槽不过长 |
| `rules.state.consistency` | 规则中的关键路径与 workspace state 不冲突 |
| `rules.legacy.detected` | 检测到旧规则文档，提示可提炼 |

doctor 仍只暴露事实，不自动判断如何改。

### starworkDoctor

必须优先优化。

新增要求：

1. 诊断时读取旧规则文档。
2. 把旧规则分为可保留、可合并、冲突、背景四类。
3. 生成 upgrade blueprint 时，必须输出 `user-preserved-rules.md` 或明确说明“未发现可提炼规则”。
4. 不能生成完整 `AGENTS.md`。
5. 规则片段必须遵守固定模板。
6. 低置信度规则不得进入硬规则槽。

### starworkSpawn

`agent_rules` 必须遵守短规则片段原则。

禁止让用户把完整工作说明塞进 blueprint 规则。

### starworkInit

初始化时只生成基础入口规则。

不要在 init 阶段要求用户预设大量规则；规则应来自真实使用摩擦。

### starworkAudit

repair blueprint 只能补规则槽，不重写入口文件。

修复规则时必须说明：

- 修哪个 slot。
- 为什么修。
- 是否覆盖已有 slot。

### Adapters

`CLAUDE.md`、Cursor rules、Trae rules 应保持轻量：

```text
Read AGENTS.md.
Read workspace state.
Follow StarWork rule slots.
If conflict, AGENTS.md wins.
```

不要为不同 Agent 维护多套独立规则。

## 实施优先级

### P0：止血

1. 修改 `starworkDoctor`：
   - 明确禁止生成完整 `AGENTS.md`。
   - 明确规则片段模板。
   - 增加原有规则提炼要求。
2. 修改 `starworkDoctor` references：
   - 增加 `rules-extraction-guide.md`。
   - 增加 `agent-rules-template.md`。

### P1：机制定稿

1. 新增 `product/core/project-rules-mechanism-spec.md`。
2. 更新 `upgrade-spec.md` 和 `spawn-blueprint-spec.md`，统一 `.starwork/rules/` 规则片段机制。
3. 更新 Pack structure spec，增加规则片段质量要求。

### P1：CLI slot 注入

1. 实现 `.starwork/rules/<slot-id>.md` 写入和 `manifest.json` 更新。
2. 替换 Pack / Upgrade / Blueprint 的追加逻辑。
3. 补测试：
   - slot 首次写入规则文件。
   - slot 重复时更新同名文件，不重复追加。
   - `AGENTS.md` 不出现技术 marker。
   - 旧 `AGENTS.md` 保留。

### P2：doctor 规则健康检查

1. 检查 `.starwork/rules/index.md` 和 `manifest.json`。
2. 检查重复 slot。
3. 检查关键路径一致性。
4. 检查规则过长。
5. 检查旧规则文档候选。

### P2：Kit / Pack 模板收敛

1. 重写 project / hub Kit 的 `AGENTS.md`。
2. 重写 Pack rules，让它们只做短规则片段。
3. 更新 adapter 文案。

### P3：文档和示例

1. 更新 CLI / Skill registry。
2. 更新 doctor capabilities。
3. 增加一个历史规则文档升级样例。

## 验收标准

### 用户体验验收

- 使用 `starworkDoctor` 升级旧项目时，生成的 `AGENTS.md` 是短入口，不再混乱堆叠。
- 用户原有规则不会丢失。
- 用户原有规则中仍有效的部分会被提炼到 `user.preserved.*` slot。
- 冲突或过时规则不会被写成硬规则。
- 用户能看懂哪些规则来自 Core、Pack、Blueprint、Upgrade、原有规则。

### CLI 验收

- 重复执行 upgrade / pack install 不会重复追加同一规则。
- `doctor` 能发现重复 slot、缺失规则文件和 manifest 破损。
- `AGENTS.md` 与 `.starwork/workspace.json` 路径冲突时，doctor 能暴露事实。
- `CLAUDE.md` 和 Cursor rules 不会成为第二套事实源。

### Skill 验收

- `starworkDoctor` 问题不超过 3 个。
- `starworkDoctor` 不把推断写成事实。
- `starworkDoctor` 生成的规则片段符合模板。
- `starworkSpawn` / `starworkAudit` / `starworkInit` 均遵守同一套规则文档机制。

## 非目标

v0.1 不做：

- 完整自然语言规则冲突自动解决。
- 自动删除用户旧规则。
- 自动迁移所有子目录规则。
- 多 Agent runtime 的专属复杂规则生成器。
- 把 `AGENTS.md` 变成数据库。

## 待确认问题

1. v0.1 是否把 `rules.slots` 继续独立放在 `.starwork/rules/manifest.json`，还是同步摘要到 `.starwork/workspace.json`？
2. 规则槽过长的阈值是多少？初步建议单 slot 不超过 30 行。
3. 用户原有 `AGENTS.md` 是否长期保留原文，还是在用户确认后迁移为 `AGENTS.legacy.md`？
4. 子目录 `AGENTS.md` 的生成是否进入 v0.1，还是先作为 v0.2 能力？
5. `doctor` 是否应输出规则健康的 JSON 结构，供 `starworkDoctor` 直接读取？
