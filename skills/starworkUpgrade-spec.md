# `starworkUpgrade` Skill SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Skills
- Skill 名称：`starworkUpgrade`
- 相关命令：`starwork doctor`、`starwork upgrade`
- 实现状态：v0.1 第一版已实现
- 目标：帮助 Agent 基于 `starworkDoctor` 的诊断结果，采访用户、确认语义映射，并生成可 dry-run、可执行的 `upgrade blueprint`

## 一句话定义

`starworkUpgrade` 是 StarWork 历史工作区升级设计 skill。

它不是 `starwork upgrade` 命令本身，而是命令执行前的 AI 规划层：

```text
用户已有旧模板或非标准目录
  ↓
starwork doctor --json
  ↓
starworkDoctor 诊断 Core 逻辑贴近程度
  ↓
starworkUpgrade 采访用户并生成升级蓝图
  ↓
starwork upgrade --blueprint upgrade-blueprint.json --dry-run
  ↓
用户确认后执行
```

## 产品边界

| 层 | 负责 | 不负责 |
|---|---|---|
| `doctor` CLI | 探测事实、输出 inventory / signals / checks | 判断升级方案 |
| `starworkDoctor` skill | 解释现状、判断 Core 逻辑贴近程度 | 生成可执行蓝图 |
| `starworkUpgrade` skill | 采访用户、确定角色映射、生成 upgrade blueprint | 直接修改用户目录 |
| `upgrade` CLI | 校验和执行 blueprint | 自行判断业务语义 |

## 与 `starworkDoctor` 的关系

`starworkDoctor` 回答：

```text
这个目录现在是什么状态？
它和 StarWork Core 工作逻辑有多接近？
哪些目录可能对应哪些 Core 角色？
```

`starworkUpgrade` 回答：

```text
基于这个诊断，用户确认后到底应该怎么升级？
升级蓝图里应该写哪些路径、规则和执行动作？
```

如果没有 `starworkDoctor` 诊断结果，`starworkUpgrade` 应先运行或要求运行：

```bash
starwork doctor --target <path> --json --inventory-depth all
```

然后先做诊断，再进入升级设计。

## 触发场景

用户可能这样触发：

- “把这个旧模板升级成 StarWork”
- “帮我生成 upgrade blueprint”
- “基于 doctor 的结果给我一个升级方案”
- “我想保留现在的目录名，但让它符合 StarWork”
- “这个目录能不能无损升级”
- “我要从历史模板迁移到 StarWork 标准结构”

## 核心原则

1. 先诊断，再设计。
2. 先保留用户历史文件，再补 StarWork 结构。
3. 目录语义必须尽量由用户确认，不把猜测写成事实。
4. 默认保留旧目录名，通过 workspace state 和 Agent 规则建立 Core 映射。
5. 不把 Kit / Pack 贴近度当作主线任务。
6. Pack 只在执行层作为候选参数；v0.1 默认 `general`。
7. 不直接写用户目录；只生成 blueprint 和配套 Markdown。

## 输入

`starworkUpgrade` 需要尽量取得以下输入：

- 目标目录路径。
- `starwork doctor --json` 输出。
- `starworkDoctor` 诊断报告。
- 用户对关键目录语义的确认。
- 用户对“保留旧目录名还是标准化目录名”的偏好。
- 用户对是否需要事项机制的确认。

## 工作流程

### Step 1：确认目标和安全边界

先确认：

- 目标目录是不是用户要升级的目录。
- 目标目录是否包含历史内容。
- 用户是否希望无损升级。

如果目标目录已经有 `.starwork/workspace.json`，停止并说明：

```text
这个目录已经是 StarWork 工作台，不应使用 upgrade；后续应使用 update 或 repair。
```

### Step 2：读取 doctor 和 starworkDoctor 结果

优先使用已有结果。没有结果时运行：

```bash
starwork doctor --target <path> --json --inventory-depth all
```

然后形成或读取 `starworkDoctor` 诊断，至少要有：

- Core 逻辑贴近程度
- 目录角色映射候选
- 已具备的 Core 能力
- 缺失和风险
- 建议确认的问题

### Step 3：采访用户确认关键语义

不要一次问长表单。只问会影响升级蓝图的问题。

必须确认：

1. 哪个目录是正式成果 / 确认事实源？
2. 哪个目录是当前工作 / 日常推进区？
3. 哪些目录是只读参考资料？
4. 是否需要事项机制？
5. 希望保留旧目录名，还是逐步标准化？

友好问法：

```text
未来你希望 Agent 把哪里当成“不能乱改的正式成果”？
```

```text
你平时真正干活的地方在哪里？比如推进事项、写草稿、放待办、记录阶段判断。
```

```text
这些旧目录你想继续保留原名，还是希望我帮你慢慢整理成 StarWork 的标准中文结构？
```

### Step 4：选择升级策略

根据诊断和用户回答选择策略。

| 策略 | 适用情况 | 默认程度 |
|---|---|---|
| `preserve-names` | 用户已有稳定目录名，且不想移动历史文件。 | 默认 |
| `add-standard-shell` | 用户想逐步学习 StarWork 标准结构，但旧文件先不动。 | 可选 |
| `standardize-empty-paths` | 一些旧目录是空目录，可以改成标准名。 | 谨慎 |
| `migrate-content` | 用户明确要求迁移内容到新结构。 | v0.1 不建议 |

如果用户不确定，默认：

```text
preserve-names
```

### Step 5：确定基础工作区

只在用户确认后写入 blueprint。

判断：

| 用户情况 | 推荐 |
|---|---|
| 只是资料、草稿、成果分区 | `single-light` + `local-starter` |
| 有长期推进、事项、交接、复盘 | `single-matter` + `local-matter` |
| 想建立多项目中枢 | 不走 upgrade，建议新建 Hub |

语言：

- 中文目录多、中文协作：`zh`
- 英文目录多、英文协作：`en`
- 不确定：问用户，不默认硬判

Pack：

- v0.1 默认 `general`
- 不主动推荐 `content-creator`
- 不询问不存在或未定稿的场景 Pack

### Step 6：生成升级蓝图目录

推荐输出：

```text
<workspace>-upgrade/
├── upgrade-blueprint.json
├── rules/
│   ├── core-boundaries.md
│   ├── file-boundaries.md
│   └── upgrade-notes.md
└── seed/
    └── ...
```

`rules/core-boundaries.md` 应说明：

- 哪些目录是正式成果
- 哪些目录是当前工作区
- 哪些目录是参考资料
- 哪些目录保留历史命名
- Agent 不能覆盖或移动哪些历史内容

`rules/upgrade-notes.md` 应说明：

- 这次升级基于哪些用户确认
- 哪些判断仍不确定
- 后续可以如何逐步整理

### Step 7：生成 `upgrade-blueprint.json`

蓝图必须符合：

```json
{
  "schema": "starwork.upgrade_blueprint.v0.1",
  "target": ".",
  "generated_by": "starworkUpgrade",
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
      "reason": "用户确认资料库是参考资料区"
    }
  ],
  "actions": [
    { "type": "ensure_dir", "path": ".starwork/" },
    { "type": "write_workspace_state" },
    { "type": "copy_kit_missing_files" },
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
    "事项/"
  ],
  "verification": {
    "run_doctor_after": true,
    "expected_workspace_type": "single-matter"
  }
}
```

## 输出格式

skill 的最终回复建议包含：

```text
## 升级判断

## 用户已确认的目录语义

## 升级策略

## 生成的 blueprint 文件

## dry-run 命令

## 执行前请再次确认
```

示例命令：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --dry-run
```

用户确认后：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --yes
starwork doctor --target <workspace>
```

## 约束

- 不直接修改用户工作区。
- 不静默移动、删除、覆盖历史文件。
- 不把 `doctor` 的候选信号当最终结论。
- 不把低置信度目录映射写成确定事实。
- 不把 Kit / Pack 贴近度当主线诊断。
- 不主动推荐未定稿业务 Pack。
- 不把已是 StarWork 的工作台交给 `upgrade`。
- 不生成包含绝对路径、`..`、`.git/`、`node_modules/` 写入动作的 blueprint。
- 不把复杂内容迁移放进 v0.1 默认方案。

## 与未来实现的关系

后续可以分三步落地：

1. 实现 `starworkUpgrade` skill：生成 blueprint，但不执行。
2. 实现 `starwork upgrade --blueprint --dry-run`：只校验和展示计划。
3. 实现 `starwork upgrade --blueprint --yes`：执行低风险动作，并用 doctor 复查。

等 `upgrade` 稳定后，再单独设计 `starwork update`。
