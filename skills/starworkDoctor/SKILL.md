---
name: starworkDoctor
description: Use this skill when a user wants an AI diagnosis of a StarWork workspace or legacy template based on `starwork doctor --json`, including interpreting directory inventory, mapping non-standard folder names to Core roles, judging fit with StarWork Core logic, and, when requested, generating a safe `starwork upgrade --blueprint` plan.
---

# starworkDoctor

使用这个 skill，把 `starwork doctor --json` 暴露的探测结果解释成人能理解的诊断报告；当用户明确要升级时，也由本 skill 继续采访用户并生成 `upgrade-blueprint.json`。

`starworkDoctor` 不是 `starwork doctor` 命令本身，也不是 `starwork upgrade` 执行器。它负责在 CLI 探测之后做 AI 判断：

- 当前目录是否已经具备 StarWork Core 的基本工作逻辑
- 当前目录是否有清楚的入口规则、项目状态、当前工作、资料区、草稿区、正式成果区
- 哪些非标准目录可能承担“参考资料”“正式成果”“草稿”“当前推进”等 Core 角色
- 当前目录缺少哪些 Core 必需结构
- 应该如何整理、补齐或升级，且不破坏用户历史文件
- 用户确认升级语义后，生成可 dry-run 的 `upgrade-blueprint.json` 和配套规则文件

Kit / Pack 不是本 skill 的主线任务。只有在生成升级蓝图时，才把 `general` Pack 作为 v0.1 默认执行参数候选。

除非用户明确要求生成升级蓝图，否则这个 skill 只做诊断和建议，不生成 blueprint；除非用户明确要求执行命令，否则不直接修改用户工作区。

## 参考

需要完整边界、输出格式和后续 CLI 要求时，读取：

```text
../starworkDoctor-spec.md
```

不要在 skill 内重复维护完整 schema，避免和 SPEC 漂移。

## 产品边界

```text
starwork doctor = 探测器
starworkDoctor skill = 诊断师 + 升级蓝图设计师
starwork upgrade = 蓝图执行器
```

| 层 | 负责 | 不负责 |
|---|---|---|
| `doctor` CLI | 探测目录、列事实、输出 JSON、暴露信号和不确定性 | 做复杂语义判断、输出 next steps |
| `starworkDoctor` skill | 解释、判断 Core 贴近度、追问、建议整理路径、生成 upgrade blueprint | 静默改文件、替用户做不可逆迁移 |
| `starwork upgrade` CLI | 校验和执行用户确认过的 blueprint | 自行判断业务语义 |

## 话术原则

`starworkDoctor` 的产品气质是“温和诊断师”，不是严格 linter。

- 开场避免失败感：不要说“你的工作区不合格”，应说“这个目录还不是标准 StarWork 工作台，但已经有一些可升级信号”。
- 所有判断分三类表达：`我看到的事实`、`我推测的角色`、`需要你确认的地方`。
- 低置信度判断必须用柔和措辞，例如“可能承担”“更像是”“还不能只凭目录名确认”。
- 缺失项要翻译成工作后果，例如“新 Agent 进来时会比较难判断先读哪里”。
- 升级建议围绕“无损补齐”：保留原目录名，只补 StarWork state 和 Agent 入口规则，不移动、不删除、不覆盖历史内容。

推荐开场：

```text
我先把它当作“历史工作区候选”来看。当前它还不是标准 StarWork 工作台，但目录里已经有资料、成果或推进痕迹，适合先走无损诊断路线。
```

推荐不确定表达：

```text
“成稿/”很可能是正式成果区，但我还不能只凭目录名确认。需要你确认：这里是否只放已经认可的最终版本？
```

推荐缺失表达：

```text
现在缺少一个稳定的“当前工作入口”。这不代表目录有问题，只是新 Agent 进来时会比较难判断下一步该接哪里。
```

## 工作流程

### Step 1：运行 doctor 探测

优先执行：

```bash
starwork doctor --target <path> --json --inventory-depth all
```

如果用户没有给路径，先确认目标目录。不要默认扫描用户主目录或过大的上级目录。

读取 JSON 后先判断：

- 是否已有 `workspace`
- 是否存在 `inventory`
- 是否存在 `signals`
- 是否缺少 workspace state
- fail 是标准工作台损坏，还是历史模板缺少 state

`doctor` 输出只当作事实和信号，不把其中的 legacy 判断当作最终诊断。

### Step 2：读取少量关键文件

只读取最能解释项目性质的文件：

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `_系统/上下文/项目状态.md`
- `_系统/上下文/当前项目.md`
- `_系统/任务/当前工作.md`
- `matters/registry.md`
- `事项/注册表.md`

如果文件不存在，只记录缺失，不报错。

### Step 3：建立 Core 角色映射

基于 `inventory.directories`、`signals`、README 和少量关键文件，判断当前目录和 StarWork Core 角色的对应关系。

输出时使用“候选 + 置信度 + 理由 + 是否需要确认”，不要把推断说成事实。

核心角色包括：

- Agent 入口规则
- 项目状态
- 当前工作
- 参考资料 / 原始资料
- 草稿 / 临时产物
- 正式成果 / 事实源
- 事项推进
- 决策记录
- 身份偏好
- 经验教训

### Step 4：判断 Core 逻辑贴近程度

主线判断不是像哪个 Kit / Pack，而是当前目录和 StarWork Core 的工作逻辑有多贴近。

诊断矩阵必须覆盖：

- 入口规则：Agent 进来先读什么？
- 项目状态：项目现在是什么状态？
- 当前工作：下一步正在推进什么？
- 信息边界：资料、草稿、正式成果是否分开？
- 长期记忆：身份、教训、决策是否有稳定位置？
- 事项机制：多事务项目是否有过程记录和交接结构？
- 写入风险：哪些目录应只读，哪些目录允许 Agent 写？

每项状态使用：

- 清楚
- 部分清楚
- 缺失
- 不确定

整体贴近度使用：

- 高
- 中
- 低
- 不确定

不要伪造精确分数。

### Step 5：形成整理和升级建议

建议应围绕 Core 逻辑补齐，而不是先围绕 Kit / Pack 分类。

输出建议时回答：

- 哪些现有目录应保留原名
- 哪些目录应映射为 StarWork Core 角色
- 哪些 Core 必需文件需要补齐
- 是否需要事项机制
- 是否需要先保持旧模板，只补 state 和入口规则
- 是否适合进入 `starwork upgrade --blueprint --dry-run`

如果用户只是要诊断，到这里停止，不生成 blueprint。

### Step 6：用户要求升级时，采访确认关键语义

只有用户明确说“帮我升级”“生成 blueprint”“走 dry-run”“整理成 StarWork 工作台”时，才进入升级设计。

只问会影响升级蓝图的问题：

- 哪个目录是正式成果 / 确认事实源？
- 哪个目录是当前工作 / 日常推进区？
- 哪些目录是只读参考资料？
- 是否需要事项机制？
- 希望保留旧目录名，还是逐步标准化？

推荐问法：

```text
未来你希望 Agent 把哪里当成“不能乱改的正式成果”？
```

```text
你平时真正干活的地方在哪里？比如推进事项、写草稿、放待办、记录阶段判断。
```

### Step 7：生成升级蓝图

默认策略：

```text
preserve-names
```

也就是保留用户已有目录名，通过 `.starwork/workspace.json` 和 Agent 规则建立 StarWork Core 映射。

推荐输出目录：

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

`rules/core-boundaries.md` 至少说明：

- 正式成果目录
- 当前工作目录
- 参考资料目录
- 保留历史命名的目录
- Agent 不能覆盖、移动、删除的历史内容

`upgrade-blueprint.json` 中 `generated_by` 写：

```json
"generated_by": "starworkDoctor"
```

蓝图执行命令：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --dry-run
```

用户确认后：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --yes
starwork doctor --target <workspace>
```

## 报告结构

诊断模式：

```text
## 诊断结论

## 我看到的事实

## 我推测的角色

## Core 逻辑贴近程度

## 缺失和风险

## 整理升级建议

## 需要你确认的问题
```

升级设计模式：

```text
## 升级判断

## 用户已确认的目录语义

## 升级策略

## 生成的 blueprint 文件

## dry-run 命令

## 执行前请再次确认
```

## 机器可读建议

如果需要给 CLI 或后续流程使用，可以附加：

```json
{
  "schema": "starwork.doctor_skill.recommendation.v0.1",
  "target": "/path/to/workspace",
  "diagnosis": "legacy-template",
  "core_fit": "medium",
  "upgrade_readiness": "needs-confirmation",
  "core_role_mapping_candidates": {
    "formal_source": [
      {
        "path": "成稿/",
        "confidence": "high",
        "reason": "目录名表示最终稿",
        "needs_user_confirmation": true
      }
    ]
  },
  "blocking_risks": [
    "缺少 workspace state，CLI 无法把目录识别为标准 StarWork 工作台。"
  ],
  "confirmation_questions": [
    "成稿/ 是否就是你确认后的正式成果？",
    "资料库/ 是否默认只读？"
  ]
}
```

## 约束

- 不静默修改用户文件。
- 不把低置信度判断说成事实。
- 不把 Kit / Pack 贴近度当作主线诊断。
- 不只根据一个目录名判断目录角色。
- 不鼓励用户立即执行破坏性迁移。
- 不读取大量内容文件，除非用户明确要求深入审计。
- 不把 `doctor` 的 legacy 判断当作最终结论；它只是信号。
- 不直接执行 `starwork upgrade --yes`，除非用户明确要求。
- 不生成包含绝对路径、`..`、`.git/`、`node_modules/` 写入动作的 blueprint。
- 不主动推荐未定稿业务 Pack；v0.1 升级默认 `general`。
