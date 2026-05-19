# `starworkDoctor` Skill SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Skills
- Skill 名称：`starworkDoctor`
- 相关命令：`starwork doctor`
- 实现状态：未实现
- 目标：帮助 Agent 基于 `doctor` 暴露的探测信息，对当前目录进行理性诊断，判断它和 StarWork Kit / Pack 的贴近程度，并给出平滑升级建议

## 一句话定义

`starworkDoctor` 是 StarWork 工作区诊断 skill。

它不是 `doctor` 命令本身，而是 `doctor` 之后的 AI 分析层：

```text
starwork doctor --json
  ↓
全量结构探测结果
  ↓
starworkDoctor skill 读取和判断
  ↓
诊断报告 / 升级建议 / 后续执行命令
```

## 为什么需要 skill

`doctor` 是 CLI，适合做稳定、确定、可重复的探测：

- 当前目录有哪些文件夹和文件
- 是否存在 `.starwork/workspace.json`
- 是否存在 `AGENTS.md`、`CLAUDE.md`
- 是否存在常见历史模板信号
- 已安装的 Kit / Pack 是否完整
- 哪些检查项 pass、info、warn、fail

但以下判断不适合硬编码在 CLI 里：

- 当前项目本质上是轻量项目、长期项目、中枢还是卫星项目
- 某个不叫“输出”的目录是否承担了输出功能
- 某个不叫“参考资料”的目录是否其实是资料区
- 当前结构和哪个 Kit 最贴近
- 当前结构和哪个 Pack 或未来 Pack 最贴近
- 哪些目录应该保留、补齐、别名映射或后续迁移
- 用户是否应该立即升级，还是先保持旧模板继续使用

这些判断需要结合目录名称、README、现有规则文件、项目状态、用户表达和上下文推理，所以应由 Agent + skill 完成。

## 产品边界

```text
starwork doctor = 探测器
starworkDoctor skill = 诊断师
starwork init / future upgrade = 执行器
```

| 层 | 负责 | 不负责 |
|---|---|---|
| `doctor` CLI | 探测、列事实、输出 JSON、暴露不确定性 | 做复杂语义判断、决定迁移方案 |
| `starworkDoctor` skill | 解释、判断、追问、建议升级路径 | 静默改文件、替用户做不可逆迁移 |
| `init` / future `upgrade` | 在用户确认后写入或迁移 | 自行判断业务语义 |

## 对 `doctor` 输出的要求

为了让 skill 做判断，`doctor --json` 不能只输出硬编码检查项。它需要尽可能暴露“原始事实”和“候选信号”。

### 必须输出的结构探测信息

后续 `doctor` JSON 应新增或保留类似字段：

```json
{
  "schema": "starwork.doctor.result.v0.1",
  "target": "/path/to/workspace",
  "workspace_root": null,
  "workspace": null,
  "inventory": {
    "max_depth": 3,
    "directories": [
      { "path": "资料库", "depth": 1, "children_count": 8 },
      { "path": "成稿", "depth": 1, "children_count": 3 },
      { "path": "_系统/任务", "depth": 2, "children_count": 2 }
    ],
    "files": [
      { "path": "README.md", "size": 2048 },
      { "path": "AGENTS.md", "size": 512 },
      { "path": "_系统/任务/当前工作.md", "size": 1200 }
    ],
    "omitted": {
      "directories": 12,
      "files": 84,
      "reason": "depth_or_count_limit"
    }
  },
  "signals": {
    "agent_entry": ["AGENTS.md"],
    "system_dirs": ["_系统"],
    "matter_dirs": ["事项"],
    "possible_reference_dirs": ["资料库", "素材", "reference"],
    "possible_output_dirs": ["成稿", "交付物", "outputs"],
    "possible_draft_dirs": ["草稿", "drafts"],
    "identity_dirs": ["identity"],
    "lessons_dirs": ["lessons"]
  },
  "checks": []
}
```

### 为什么要全量目录结构

用户当前文件夹可能存在“输出功能”的目录，但名字不叫“输出”。

例如：

| 用户目录 | 可能语义 |
|---|---|
| `成稿/` | final outputs |
| `交付物/` | formal source |
| `发布记录/` | formal source 或 content Pack 输出 |
| `资料库/` | references |
| `素材/` | references 或 content materials |
| `草稿/` | drafts |
| `工作台/` | business work area |
| `推进/` | matters 或 current work |

这些映射不应由 CLI 硬编码决定。CLI 只应把目录结构和候选信号交给 AI；AI 再结合上下文判断。

## Skill 输入

用户可能这样触发：

- “帮我看看这个旧模板怎么升级 StarWork”
- “这个文件夹能不能用 StarWork doctor 检查一下”
- “我这个项目应该用哪个 Kit”
- “这个目录结构和 StarWork 的 local-matter 接近吗”
- “帮我判断该不该迁移”
- “doctor 输出我看不懂，你帮我解释一下”

skill 启动后应优先运行：

```bash
starwork doctor --target <path> --json
```

如果用户没有指定路径，使用当前工作目录，但先向用户确认目标目录。

## Skill 工作流程

### Step 1：运行 doctor 探测

执行：

```bash
starwork doctor --target <target> --json
```

读取 JSON 后先判断：

- 是否已有标准 StarWork workspace
- 是否缺少 workspace state
- 是否有 inventory
- 是否有 legacy / signals
- fail 是结构缺失，还是非 StarWork 目录

如果当前 `doctor` 版本还没有输出全量 `inventory`，skill 可以临时通过只读命令补充：

```bash
find <target> -maxdepth 3 -not -path '*/.git/*'
```

补充探测只能读取结构，不应读取大量正文。

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

如果文件不存在，不报错，只记录为缺失。

不要一开始读取全部内容文件、草稿、素材或成果。

### Step 3：建立目录语义映射

基于目录名称、父子关系、README 和少量关键文件，推断目录角色。

输出一个候选映射：

```text
possible references:
- 资料库/：高置信度，名称和 README 都指向资料沉淀
- 素材/：中置信度，可能是内容 Pack 的 materials，不一定是通用 references

possible outputs:
- 成稿/：高置信度，疑似最终成果
- 发布记录/：中置信度，可能是正式事实源，也可能只是内容发布日志

possible current work:
- 事项/：高置信度，已有事项结构
- 推进/：低置信度，需要问用户
```

### Step 4：判断和 Kit 的贴近程度

至少比较以下 Kit：

| Kit | 判断依据 |
|---|---|
| `local-starter` | 有资料区、草稿区、成果区，但没有事项机制。 |
| `local-matter` | 有事项 / registry / 当前工作，适合长期单项目。 |
| `hub` | 有项目注册、共享 identity / lessons / knowledge / skills，多项目管理意味明显。 |
| `satellite-starter` | 有主库同步痕迹，轻量项目，通常由 Hub 派生。 |
| `satellite-matter` | 有主库同步痕迹，也有事项机制。 |

输出贴近度时不要伪装成精确分数，可以使用：

- 高
- 中
- 低
- 不确定

示例：

```text
Kit 贴近度：
- local-matter：高。已有事项、当前工作和资料/成果分区。
- local-starter：中。资料/输出结构接近，但事项机制说明它不只是轻量项目。
- hub：低。没有项目 registry、共享 skills 和中枢目录。
```

### Step 5：判断和 Pack 的贴近程度

当前可比较的 Pack：

- `general`
- `hub-management`
- `content-creator`

判断原则：

- 默认优先 `general`，除非目录和文本强烈表明是某个场景 Pack。
- `content-creator` 仍不是当前 A 测优先引导对象，除非用户明确在做内容创作。
- 不要因为存在 `素材/` 就直接判断为 content creator；素材也可能是任何项目的 references。
- `hub-management` 只适合多项目中枢，不适合普通项目。

### Step 6：形成诊断结论

输出结构：

```text
诊断结论：
这个目录不是标准 StarWork 工作台，但它是一个可升级的历史模板。

我判断它更接近：
- Kit：local-matter（高）
- Pack：general（高）
- language：zh（高）

主要依据：
- 有 事项/
- 有 资料库/ 和 成稿/
- 有 _系统/
- 没有 .starwork/workspace.json

不确定点：
- 成稿/ 是否就是正式事实源，需要用户确认。
- 资料库/ 是否默认只读，需要用户确认。
```

### Step 7：给出行动建议

建议必须分层，不要直接要求用户迁移。

建议顺序：

1. 不改文件的检查建议
2. dry-run 预览建议
3. 用户确认后的执行建议
4. 后续可能的定制 / blueprint / future upgrade 建议

示例：

```bash
starwork init --target <path> --type single-matter --pack general --language zh --dry-run
```

如果用户确认：

```bash
starwork init --target <path> --type single-matter --pack general --language zh --yes
starwork doctor --target <path>
```

## 输出格式

### 人类可读诊断报告

```text
## 诊断结论

这个目录更像一个中文长期单项目模板，不是多项目中枢。

## 贴近程度

- Kit：local-matter，高
- Pack：general，高
- language：zh，高

## 目录语义判断

- 资料库/：疑似参考资料区
- 成稿/：疑似正式成果区
- 事项/：疑似事项推进区

## 风险和不确定点

- 成稿/ 是否可以作为正式事实源，需要你确认。
- 当前没有 .starwork/workspace.json，所以 CLI 暂时不能把它当作标准 StarWork 工作台。

## 建议下一步

先运行 dry-run，不移动历史文件：

starwork init --target <path> --type single-matter --pack general --language zh --dry-run
```

### 机器可读建议

如果需要给 CLI 或后续 skill 使用，可以附加：

```json
{
  "schema": "starwork.doctor_skill.recommendation.v0.1",
  "target": "/path/to/workspace",
  "diagnosis": "legacy-template",
  "recommended": {
    "workspace_type": "single-matter",
    "kit": "local-matter",
    "pack": "general",
    "language": "zh"
  },
  "path_mapping_candidates": {
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
- 不只根据一个目录名判断 Pack。
- 不鼓励用户立即执行破坏性迁移。
- 不读取大量内容文件，除非用户明确要求深入审计。
- 不把 `doctor` 的硬编码 legacy 判断当作最终结论；它只是信号。
- 当前没有正式 `starwork upgrade` 命令时，只输出建议和 `init --dry-run`。

## 与未来 CLI 的关系

后续可以有三层演进：

1. `doctor --json` 增强 `inventory` 和 `signals` 输出。
2. `starworkDoctor` 基于这些信息输出诊断建议。
3. 新增 `starwork upgrade` 或 `starwork repair`，在用户确认后执行迁移计划。

在第 3 步完成前，本 skill 的行动建议应以 dry-run 和人工确认优先。
