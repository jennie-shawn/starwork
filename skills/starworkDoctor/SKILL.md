---
name: starworkDoctor
description: Use this skill when a user wants an AI diagnosis of a StarWork workspace or legacy template based on `starwork doctor --json`, including interpreting directory inventory, mapping non-standard folder names to likely roles, judging Kit and Pack fit, and recommending safe dry-run upgrade steps.
---

# starworkDoctor

使用这个 skill，把 `starwork doctor --json` 暴露的探测结果解释成人能理解的诊断报告。

`starworkDoctor` 不是 `starwork doctor` 命令本身。它负责在 doctor 探测之后做理性判断：

- 当前目录是否已经是标准 StarWork 工作台
- 如果不是，是否像一个可升级的历史模板
- 当前结构更接近哪个 Kit
- 当前结构更接近哪个 Pack
- 哪些非标准目录可能承担“参考资料”“输出”“草稿”“当前推进”等角色
- 是否建议升级，以及应该先跑哪条 dry-run 命令

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
- 是否存在 `upgrade`
- `fail` 是标准工作台损坏，还是历史模板缺少 state

如果当前 CLI 版本没有输出 `inventory` 或 `signals`，可以临时使用只读结构扫描补足：

```bash
find <path> -maxdepth 4 -not -path '*/.git/*' -not -path '*/node_modules/*'
```

不要读取大量正文内容。

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

### Step 3：建立目录语义映射

基于 `inventory.directories`、`signals`、README 和少量关键文件，判断目录可能承担的角色。

输出时使用“候选 + 置信度 + 理由”，不要把推断说成事实。

示例：

```text
可能的参考资料区：
- 资料库/：高。目录名直接表示资料沉淀。
- 素材/：中。可能是资料区，也可能是内容创作材料区。

可能的正式成果区：
- 成稿/：高。目录名表示最终稿。
- 发布记录/：中。可能是正式事实源，也可能只是内容发布日志。
```

### Step 4：判断 Kit 贴近程度

至少比较：

- `local-starter`
- `local-matter`
- `hub`
- `satellite-starter`
- `satellite-matter`

贴近度使用：

- 高
- 中
- 低
- 不确定

不要伪造精确分数。

### Step 5：判断 Pack 贴近程度

当前可比较：

- `general`
- `hub-management`
- `content-creator`

默认优先 `general`。只有用户明确在做内容创作，或者目录和关键文件强烈指向内容生产闭环时，才把 `content-creator` 列为高贴近度。

不要因为存在 `素材/` 就直接判断为内容创作者 Pack。

### Step 6：输出诊断报告

报告结构：

```text
## 诊断结论

## 目录语义判断

## Kit 贴近程度

## Pack 贴近程度

## 风险和不确定点

## 建议下一步
```

如果建议升级，先给 dry-run：

```bash
starwork init --target <path> --type <type> --pack general --language <zh|en> --dry-run
```

只有用户确认后，才给执行命令：

```bash
starwork init --target <path> --type <type> --pack general --language <zh|en> --yes
starwork doctor --target <path>
```

## 约束

- 不静默修改用户文件。
- 不把低置信度判断说成事实。
- 不只根据一个目录名判断 Pack。
- 不鼓励用户立即执行破坏性迁移。
- 不读取大量内容文件，除非用户明确要求深入审计。
- 不把 `doctor` 的 legacy 判断当作最终结论；它只是信号。
- 当前没有正式 `starwork upgrade` 命令时，只输出建议和 `init --dry-run`。
