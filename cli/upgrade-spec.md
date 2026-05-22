# `starwork upgrade` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI / StarWork Skills
- 命令：`starwork upgrade`
- 实现状态：v0.1 第一版已实现
- 相关对象：`starwork doctor`、`starworkDoctor`、升级蓝图、Core v0.1 Kit
- 目标：把历史模板或非标准目录，在不破坏用户历史文件的前提下，升级为 StarWork 可接管的标准工作台

## 一句话定义

`starwork upgrade` 是升级蓝图执行器。

它不负责判断当前目录应该怎么升级，也不负责替用户做语义决策。它只负责读取已经确认过的 `upgrade blueprint`，把蓝图中的确定性动作安全执行出来。

```text
starwork doctor --json
  ↓
starworkDoctor skill 诊断 Core 逻辑贴近程度
  ↓
starworkDoctor skill 采访用户并生成 upgrade blueprint
  ↓
starwork upgrade --blueprint upgrade-blueprint.json --dry-run
  ↓
starwork upgrade --blueprint upgrade-blueprint.json --yes
  ↓
starwork doctor 再检查
```

## 和 `update` 的边界

| 命令 | 面向对象 | 核心问题 | 是否需要 AI 生成蓝图 |
|---|---|---|---:|
| `upgrade` | 历史模板、非标准目录、缺少 `.starwork/workspace.json` 的旧工作区 | 如何进入 StarWork | 是 |
| `update` | 已经是 StarWork 的工作台 | 如何跟上新版本 | 否，通常应由版本迁移脚本处理 |

一句话：

> `upgrade` 处理“你还不是 StarWork，怎么进入 StarWork”；`update` 处理“你已经是 StarWork，怎么跟上 StarWork 新版本”。

如果目标目录已经有 `.starwork/workspace.json`，`starwork upgrade` 默认拒绝执行，并提示改用未来的 `starwork update` 或 `starwork repair`。

## 为什么必须通过 blueprint

历史模板升级不是一个纯代码判断问题。

例如：

- `成稿/` 可能是正式成果，也可能只是草稿出口。
- `资料库/` 可能是只读参考资料，也可能是仍在编辑的知识库。
- `推进/` 可能是当前工作，也可能是事项机制。
- 用户可能想保留旧目录名，也可能想标准化成 StarWork 中文结构。
- 有些旧 `outputs/` 只能保留归档，不能继续作为正式事实源。

这些判断应由 `starworkDoctor` skill 结合 `doctor` 探测、诊断结论和用户回答生成蓝图。CLI 只执行蓝图，不硬猜。

## 命令形式

v0.1 只支持 blueprint 模式。

```bash
starwork upgrade --target <path> --blueprint <upgrade-blueprint.json> --dry-run
starwork upgrade --target <path> --blueprint <upgrade-blueprint.json> --yes
starwork upgrade --target <path> --blueprint <upgrade-blueprint.json> --json --dry-run
```

参数：

| 参数 | 说明 |
|---|---|
| `--target <path>` | 要升级的历史工作区，默认当前目录。 |
| `--blueprint <path>` | `starworkDoctor` skill 生成的升级蓝图。v0.1 必填。 |
| `--dry-run` | 只展示执行计划，不写入文件。 |
| `--yes` | 按 blueprint 执行写入。非交互环境必填。 |
| `--json` | 输出机器可读执行计划或执行结果。 |
| `--help` | 显示帮助。 |

v0.1 不支持：

- 不带 blueprint 的自动升级。
- 自动移动大量用户内容。
- 自动删除旧目录。
- 自动安装未确认的业务 Pack。
- 对已经是 StarWork 的工作台做版本更新。

## 升级策略

`upgrade blueprint` 必须声明升级策略。

| 策略 | 说明 | v0.1 建议 |
|---|---|---|
| `preserve-names` | 保留用户现有目录名，只写入 state 和规则映射。 | 默认推荐 |
| `add-standard-shell` | 保留旧目录，同时补 StarWork 标准目录壳。 | 可支持 |
| `standardize-empty-paths` | 只对空目录做标准化改名。 | 谨慎支持 |
| `migrate-content` | 移动或复制已有内容到新结构。 | v0.1 不默认支持，必须显式声明和备份 |

第一版应优先支持 `preserve-names`：

```text
资料库/ 继续叫资料库/
成稿/ 继续叫成稿/
推进/ 继续叫推进/
```

但 `.starwork/workspace.json` 会把它们映射成 Core 角色。

## 推荐文件结构

`starworkDoctor` skill 生成的蓝图建议放在独立目录：

```text
my-workspace-upgrade/
├── upgrade-blueprint.json
├── rules/
│   ├── core-boundaries.md
│   ├── file-boundaries.md
│   └── upgrade-notes.md
└── seed/
    └── ...
```

## `upgrade-blueprint.json`

### 最小示例

```json
{
  "schema": "starwork.upgrade_blueprint.v0.1",
  "target": ".",
  "generated_by": "starworkDoctor",
  "source": {
    "doctor_schema": "starwork.doctor.result.v0.1",
    "diagnosis": "legacy-template",
    "core_fit": "medium"
  },
  "base": {
    "workspace_type": "single-matter",
    "kit": "local-matter",
    "language": "zh",
    "pack": "general"
  },
  "strategy": "preserve-names",
  "paths": {
    "formal_source": "成稿/",
    "business_work_area": "事项/"
  },
  "core_role_mapping": [
    {
      "role": "references",
      "path": "资料库/",
      "confidence": "high",
      "reason": "用户确认资料库用于沉淀参考资料"
    },
    {
      "role": "formal_source",
      "path": "成稿/",
      "confidence": "high",
      "reason": "用户确认成稿是最终确认成果"
    },
    {
      "role": "current_work",
      "path": "事项/",
      "confidence": "high",
      "reason": "已有事项推进结构"
    }
  ],
  "actions": [
    {
      "type": "ensure_dir",
      "path": ".starwork/"
    },
    {
      "type": "write_workspace_state"
    },
    {
      "type": "copy_kit_missing_files"
    },
    {
      "type": "inject_agent_rules",
      "target": "AGENTS.md",
      "from": "rules/core-boundaries.md",
      "slot": "upgrade.core_boundaries"
    }
  ],
  "preserve": [
    "资料库/",
    "成稿/",
    "事项/",
    "输出/",
    "references/",
    "outputs/"
  ],
  "verification": {
    "run_doctor_after": true,
    "expected_workspace_type": "single-matter"
  },
  "notes": [
    "v0.1 不移动旧内容，只建立 StarWork state 和入口规则。"
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|---|---:|---|
| `schema` | 是 | 固定为 `starwork.upgrade_blueprint.v0.1`。 |
| `target` | 否 | 仅作说明；真实目标仍以 CLI `--target` 为准。 |
| `generated_by` | 是 | 通常为 `starworkDoctor`。 |
| `source` | 是 | 记录 doctor / starworkDoctor 的诊断来源。 |
| `base.workspace_type` | 是 | `single-light`、`single-matter`。v0.1 不支持把旧目录升级为 Hub。 |
| `base.kit` | 是 | `local-starter` 或 `local-matter`。 |
| `base.language` | 是 | `zh` 或 `en`。 |
| `base.pack` | 否 | v0.1 默认 `general`，不主动使用未定稿场景 Pack。 |
| `strategy` | 是 | 升级策略。v0.1 推荐 `preserve-names`。 |
| `paths.formal_source` | 是 | 写入 workspace state 的正式事实源。 |
| `paths.business_work_area` | 是 | 写入 workspace state 的当前工作区。 |
| `core_role_mapping` | 是 | AI 与用户确认后的目录角色映射。CLI 可写入备注或 rules，但不把它当作硬编码判断来源。 |
| `actions` | 是 | CLI 可执行动作列表。 |
| `preserve` | 否 | 明确要求不移动、不删除、不覆盖的历史路径。 |
| `verification` | 否 | 执行后的检查要求。 |
| `notes` | 否 | 给用户和 Agent 看的说明，不参与执行。 |

## 动作类型

v0.1 建议只实现低风险动作。

### `ensure_dir`

确保目录存在。

```json
{ "type": "ensure_dir", "path": ".starwork/" }
```

### `write_workspace_state`

根据 `base` 和 `paths` 写入 `.starwork/workspace.json`。

CLI 应自动补充：

- `schema`
- `core`
- `created_by`
- `created_at`
- `upgraded_from`
- `packs`

如果 `.starwork/workspace.json` 已存在，v0.1 默认中止。

### `copy_kit_missing_files`

从 `base.kit` 复制缺失的 Core 必需文件。

规则：

- 只复制目标不存在的文件。
- 目标存在时不覆盖。
- 对 `AGENTS.md` 这类入口文件，如果已存在，走 `inject_agent_rules`，不整文件覆盖。
- 对空目录可确保存在。

### `inject_agent_rules`

向 Agent 入口文件注入规则段。

```json
{
  "type": "inject_agent_rules",
  "target": "AGENTS.md",
  "from": "rules/core-boundaries.md",
  "slot": "upgrade.core_boundaries"
}
```

注入格式：

```markdown
## StarWork 升级规则

<!-- StarWork Upgrade: upgrade.core_boundaries -->

...
```

如果目标文件不存在，CLI 可以从 Kit 创建基础 `AGENTS.md` 后再注入。

### `write_file`

写入一个新文件。

```json
{
  "type": "write_file",
  "path": "_系统/上下文/项目状态.md",
  "content": "# 项目状态\n\n..."
}
```

规则：

- 只允许创建新文件。
- 目标已存在时默认中止。
- 不支持覆盖用户文件。

### `copy_seed`

从 blueprint 目录复制 seed 文件。

```json
{
  "type": "copy_seed",
  "from": "seed/升级说明.md",
  "to": "_系统/上下文/升级说明.md",
  "on_conflict": "error"
}
```

`on_conflict` 可选：

| 值 | 行为 |
|---|---|
| `error` | 目标存在则中止。默认值。 |
| `skip` | 目标存在则跳过。 |

### `move_path`

v0.1 默认不实现，或只允许空目录改名。

如果未来支持，必须要求：

- `requires_explicit_confirmation: true`
- 执行前创建备份 manifest
- dry-run 明确列出 source、target、文件数量
- 不允许跨出 target workspace

## 安全规则

`starwork upgrade` 必须保守。

1. 不覆盖用户已有文件。
2. 不删除用户目录。
3. 不移动内容，除非 action 显式声明且 CLI 支持。
4. 所有路径必须是 target 内相对路径。
5. 禁止 `..`、绝对路径、`~`、空路径。
6. 禁止写入 `.git/`、`node_modules/`。
7. 如果目标已经是 StarWork 工作台，默认拒绝。
8. 如果 blueprint 与 target 的 doctor 结果明显不一致，提示重新生成 blueprint。
9. `--dry-run` 必须展示所有将写入、跳过、中止的动作。
10. `--yes` 执行后必须提示重新运行 `starwork doctor`。

## 执行流程

### Step 1：读取并校验 blueprint

检查：

- schema 是否支持。
- target 是否存在。
- target 是否没有 `.starwork/workspace.json`。
- `base.workspace_type` 与 `base.kit` 是否匹配。
- `paths.formal_source` 和 `paths.business_work_area` 是否安全。
- actions 是否只包含支持类型。

### Step 2：重新探测 target

执行前应轻量读取 target：

- 当前是否已经成为 StarWork 工作台。
- blueprint 中 `preserve` 的路径是否存在。
- `paths` 指向的目录是否存在或可创建。
- Agent 入口文件是否存在。

不需要重新做复杂语义判断。

### Step 3：生成执行计划

dry-run 输出：

```text
StarWork upgrade plan

Target: /path/to/workspace
Strategy: preserve-names
Workspace type: single-matter
Kit: local-matter
Language: zh

Will create:
- .starwork/workspace.json
- _系统/上下文/项目状态.md

Will ensure:
- .starwork/
- 事项/

Will inject:
- AGENTS.md <- rules/core-boundaries.md

Will preserve:
- 资料库/
- 成稿/
- 输出/
```

### Step 4：执行

执行顺序：

1. 创建缺失目录。
2. 复制缺失 Kit 文件。
3. 写入 workspace state。
4. 写入 seed 文件。
5. 注入 Agent 规则。
6. 输出执行摘要。
7. 提示运行 `starwork doctor --target <path>`。

### Step 5：验证

如果 `verification.run_doctor_after` 为 true，CLI 可以自动运行 doctor，或提示用户运行。

v0.1 建议先提示，不自动嵌套执行，避免输出过长。

## JSON 输出

`--json --dry-run` 输出：

```json
{
  "schema": "starwork.upgrade.plan_result.v0.1",
  "target": "/path/to/workspace",
  "dry_run": true,
  "ok": true,
  "strategy": "preserve-names",
  "actions": [
    { "type": "ensure_dir", "path": ".starwork/", "status": "planned" },
    { "type": "write_workspace_state", "path": ".starwork/workspace.json", "status": "planned" }
  ],
  "blocked": [],
  "warnings": []
}
```

执行后输出：

```json
{
  "schema": "starwork.upgrade.execution_result.v0.1",
  "target": "/path/to/workspace",
  "ok": true,
  "executed": [
    { "type": "ensure_dir", "path": ".starwork/", "status": "done" }
  ],
  "skipped": [],
  "next_check": "starwork doctor --target /path/to/workspace"
}
```

## 退出码

| 退出码 | 含义 |
|---|---|
| `0` | dry-run 或执行成功。 |
| `1` | blueprint 可读但计划被安全规则阻止。 |
| `2` | 参数错误、文件不可读、JSON 无效、schema 不支持。 |

## 验收标准

第一版可验收，至少满足：

- 没有 blueprint 时拒绝执行，并说明必须先通过 skill 生成。
- 对已有 `.starwork/workspace.json` 的目录拒绝执行。
- `--dry-run` 不写文件。
- `--yes` 可以在历史模板中创建 `.starwork/workspace.json`。
- 不覆盖已有 `AGENTS.md`，只注入有标记的规则段。
- 目标已有文件冲突时中止或跳过，不覆盖。
- 路径安全校验覆盖绝对路径、`..`、`.git/`、`node_modules/`。
- 执行后 `starwork doctor --target <path>` 可以识别为 StarWork 工作台。

## 后续问题

- 是否需要 `starwork upgrade init-blueprint` 之类的辅助命令生成空蓝图模板？
- 是否允许 `upgrade` 自动运行 `doctor` 做前后对比？
- 是否需要 `backup` 子系统支持未来内容迁移？
- `update` 命令何时启动，是否复用部分 plan/action 执行器？
- 是否需要把升级蓝图 schema 移入 `product/schemas/`？
