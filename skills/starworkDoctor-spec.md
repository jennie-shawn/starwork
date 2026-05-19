# `starworkDoctor` Skill SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Skills
- Skill 名称：`starworkDoctor`
- 相关命令：`starwork doctor`
- 实现状态：已实现第一版
- 目标：帮助 Agent 基于 `doctor` 暴露的探测信息，判断当前目录和 StarWork Core 工作逻辑的贴近程度，并给出平滑整理和升级建议

## 一句话定义

`starworkDoctor` 是 StarWork 工作区诊断 skill。

它不是 `doctor` 命令本身，而是 `doctor` 之后的 AI 分析层：

```text
starwork doctor --json
  ↓
目录结构、关键文件、signals、checks
  ↓
starworkDoctor skill 理解 Core 逻辑
  ↓
诊断报告 / 整理建议 / 升级建议
```

## 核心修正

本 skill 的主线任务不是判断“当前目录像哪个 Kit / Pack”。

主线任务是：

> 判断当前目录和 StarWork Core 的工作逻辑有多贴近，以及应该如何整理成一个可升级、可维护、可被 Agent 接手的工作台。

Kit / Pack 只是落地执行时的候选参数，不是诊断主轴。

## 产品边界

```text
starwork doctor = 探测器
starworkDoctor skill = 诊断师
starwork init / future upgrade = 执行器
```

| 层 | 负责 | 不负责 |
|---|---|---|
| `doctor` CLI | 探测目录、列事实、输出 JSON、暴露信号和不确定性 | 做复杂语义判断、输出 next steps |
| `starworkDoctor` skill | 解释、判断 Core 贴近度、追问、建议整理路径 | 静默改文件、替用户做不可逆迁移 |
| `init` / future `upgrade` | 在用户确认后写入或迁移 | 自行判断业务语义 |

## 对 `doctor` 输出的要求

`doctor --json` 只输出事实和信号，不输出行动建议。

应包含：

```json
{
  "schema": "starwork.doctor.result.v0.1",
  "target": "/path/to/workspace",
  "workspace_root": null,
  "workspace": null,
  "inventory": {
    "directories": [
      { "path": "资料库", "depth": 1, "children_count": 8 },
      { "path": "成稿", "depth": 1, "children_count": 3 }
    ],
    "files": [
      { "path": "README.md", "size": 2048 },
      { "path": "AGENTS.md", "size": 512 }
    ]
  },
  "signals": {
    "agent_entry": ["AGENTS.md"],
    "system_dirs": ["_系统"],
    "matter_dirs": ["事项"],
    "possible_reference_dirs": ["资料库", "素材"],
    "possible_output_dirs": ["成稿", "交付物"],
    "possible_draft_dirs": ["草稿"],
    "possible_current_work_dirs": ["推进"],
    "identity_dirs": ["identity"],
    "lessons_dirs": ["lessons"]
  },
  "upgrade": {
    "candidate": true,
    "source": "legacy-template",
    "confidence": "medium",
    "inferred": {
      "language": "zh",
      "workspace_type": "single-matter",
      "references": ["资料库"],
      "outputs": ["成稿"]
    }
  },
  "checks": []
}
```

`upgrade` 中不应包含 `next_steps`，避免影响 Agent 基于 skill 做判断。

## 为什么要全量目录结构

用户当前文件夹可能存在“输出功能”的目录，但名字不叫“输出”。

例如：

| 用户目录 | 可能语义 |
|---|---|
| `成稿/` | final outputs |
| `交付物/` | formal source |
| `发布记录/` | formal source 或日志 |
| `资料库/` | references |
| `素材/` | references 或 materials |
| `草稿/` | drafts |
| `工作台/` | business work area |
| `推进/` | current work 或 matters |

这些映射不应由 CLI 硬编码决定。CLI 只应把目录结构和候选信号交给 AI；AI 再结合上下文判断。

## Skill 输入

用户可能这样触发：

- “帮我看看这个旧模板怎么升级 StarWork”
- “这个文件夹能不能用 StarWork doctor 检查一下”
- “doctor 输出我看不懂，你帮我解释一下”
- “这个目录和 StarWork Core 的逻辑接近吗”
- “我应该怎么整理这个工作区”
- “我该不该迁移”

skill 启动后应优先运行：

```bash
starwork doctor --target <path> --json --inventory-depth all
```

如果用户没有指定路径，先确认目标目录。

## Skill 工作流程

### Step 1：读取 doctor 探测结果

读取 JSON 后先判断：

- 是否已有标准 StarWork workspace
- 是否缺少 workspace state
- 是否有 inventory
- 是否有 signals
- fail 是结构缺失，还是非 StarWork 目录

把 doctor 输出当作事实和信号，不当作最终结论。

### Step 2：读取少量关键文件

在不扩大上下文的前提下，读取最能解释项目性质的文件：

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `_系统/上下文/项目状态.md`
- `_系统/上下文/当前项目.md`
- `_系统/任务/当前工作.md`
- `matters/registry.md`
- `事项/注册表.md`

如果文件不存在，只记录缺失。

### Step 3：建立 Core 角色映射

基于目录名称、父子关系、README 和少量关键文件，推断目录和 Core 角色的候选映射。

Core 角色包括：

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

输出时使用“候选 + 置信度 + 理由”。

### Step 4：判断 Core 逻辑贴近程度

按以下维度判断：

- 入口是否清楚：Agent 进来先读什么？
- 状态是否清楚：项目现在是什么状态？
- 当前工作是否清楚：下一步正在推进什么？
- 信息边界是否清楚：资料、草稿、正式成果是否分开？
- 长期记忆是否清楚：身份、教训、决策是否有稳定位置？
- 事项机制是否存在：长期项目是否有过程记录和交接结构？
- 写入风险是否可控：哪些目录应只读，哪些目录允许 Agent 写？

贴近度使用：

- 高
- 中
- 低
- 不确定

不要伪造精确分数。

### Step 5：形成整理和升级建议

建议应围绕 Core 逻辑补齐：

- 哪些现有目录应保留原名
- 哪些目录应映射为 Core 角色
- 哪些 Core 必需文件需要补齐
- 是否需要事项机制
- 是否需要先保持旧模板，只补 state 和入口规则
- 是否适合用标准 `starwork init --dry-run` 做无损补齐

只有到执行层才给出可能命令，例如：

```bash
starwork init --target <path> --type <single-light|single-matter> --pack general --language <zh|en> --dry-run
```

命令只是落地建议，不是诊断主线。

## 输出格式

```text
## 诊断结论

## Core 逻辑贴近程度

## 目录角色映射

## 已具备的 Core 能力

## 缺失和风险

## 整理升级建议

## 建议确认的问题
```

## 机器可读建议

如果需要给 CLI 或后续 skill 使用，可以附加：

```json
{
  "schema": "starwork.doctor_skill.recommendation.v0.1",
  "target": "/path/to/workspace",
  "diagnosis": "legacy-template",
  "core_fit": "medium",
  "core_role_mapping_candidates": {
    "formal_source": [
      { "path": "成稿/", "confidence": "high", "reason": "目录名表示最终稿" }
    ],
    "references": [
      { "path": "资料库/", "confidence": "high", "reason": "目录名表示资料沉淀" }
    ],
    "business_work_area": [
      { "path": "事项/", "confidence": "high", "reason": "已有事项结构" }
    ]
  },
  "questions": [
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
- 当前没有正式 `starwork upgrade` 命令时，只输出整理建议和可选 dry-run。

## 与未来 CLI 的关系

后续可以有三层演进：

1. `doctor --json` 持续增强 `inventory` 和 `signals` 输出。
2. `starworkDoctor` 基于这些信息输出诊断建议。
3. 新增 `starwork upgrade` 或 `starwork repair`，在用户确认后执行迁移计划。
