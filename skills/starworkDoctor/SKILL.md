---
name: starworkDoctor
description: Use this skill when a user wants an AI diagnosis of a StarWork workspace or legacy template based on `starwork doctor --json`, including interpreting directory inventory, mapping non-standard folder names to Core roles, judging fit with StarWork Core logic, and proposing safe cleanup or upgrade advice.
---

# starworkDoctor

使用这个 skill，把 `starwork doctor --json` 暴露的探测结果解释成人能理解的诊断报告。

`starworkDoctor` 不是 `starwork doctor` 命令本身。它负责在 doctor 探测之后做理性判断：

- 当前目录是否已经具备 StarWork Core 的基本工作逻辑
- 当前目录是否有清楚的入口规则、项目状态、当前工作、资料区、草稿区、正式成果区
- 当前目录是否有事项推进、决策记录、身份、教训、跨项目同步等增强逻辑
- 哪些非标准目录可能承担“参考资料”“正式成果”“草稿”“当前推进”等 Core 角色
- 当前目录缺少哪些 Core 必需结构
- 应该如何整理、补齐或升级，且不破坏用户历史文件

Kit / Pack 不是本 skill 的主线任务。只有在需要把诊断落到 CLI 命令时，才把它们作为执行参数候选。

除非用户明确要求执行命令，否则这个 skill 只做诊断和建议，不直接修改文件。

## 参考

需要完整边界、输出格式和后续 CLI 要求时，读取：

```text
../starworkDoctor-spec.md
```

不要在 skill 内重复维护完整 schema，避免和 SPEC 漂移。

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

输出时使用“候选 + 置信度 + 理由”，不要把推断说成事实。

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

示例：

```text
可能的正式成果区：
- 成稿/：高。目录名表示最终稿。
- 交付物/：中。可能是正式成果，也可能是客户交付归档。

可能的当前推进区：
- 事项/：高。已有事项结构。
- 推进/：中。名称接近 current work，但需要用户确认。
```

### Step 4：判断 Core 逻辑贴近程度

主线判断不是像哪个 Kit / Pack，而是当前目录和 StarWork Core 的工作逻辑有多贴近。

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

建议应围绕 Core 逻辑补齐，而不是先围绕 Kit / Pack 分类。

输出建议时回答：

- 哪些现有目录应保留原名
- 哪些目录应映射为 StarWork Core 角色
- 哪些 Core 必需文件需要补齐
- 是否需要事项机制
- 是否需要先保持旧模板，只补 state 和入口规则
- 是否适合用标准 `starwork init --dry-run` 做无损补齐

只有到执行层才给出可能命令：

```bash
starwork init --target <path> --type <single-light|single-matter> --pack general --language <zh|en> --dry-run
```

命令只是落地建议，不是诊断主线。

## 报告结构

```text
## 诊断结论

## Core 逻辑贴近程度

## 目录角色映射

## 已具备的 Core 能力

## 缺失和风险

## 整理升级建议

## 建议确认的问题
```

## 约束

- 不静默修改用户文件。
- 不把低置信度判断说成事实。
- 不把 Kit / Pack 贴近度当作主线诊断。
- 不只根据一个目录名判断目录角色。
- 不鼓励用户立即执行破坏性迁移。
- 不读取大量内容文件，除非用户明确要求深入审计。
- 不把 `doctor` 的 legacy 判断当作最终结论；它只是信号。
- 用户需要落地升级时，转入 `starworkUpgrade`：由该 skill 生成升级蓝图，再交给 `starwork upgrade --blueprint` 执行。
