---
name: starworkUpgrade
description: Use this skill when a user wants to upgrade a legacy or non-standard workspace into StarWork, including using `starwork doctor --json` and starworkDoctor diagnosis, interviewing the user about directory meanings, and generating a safe `starwork upgrade --blueprint` plan.
---

# starworkUpgrade

使用这个 skill，把历史模板或非标准目录整理成可执行的 StarWork 升级蓝图。

`starworkUpgrade` 不是 `starwork upgrade` 命令本身。它负责在执行前做 AI 判断：

- 读取 `starwork doctor --json` 暴露的事实和信号
- 结合 `starworkDoctor` 对 Core 逻辑贴近程度的诊断
- 采访用户确认关键目录语义
- 生成 `upgrade-blueprint.json`
- 生成配套 Markdown 规则文件
- 提醒用户用 `starwork upgrade --blueprint` 先 dry-run

除非用户明确要求执行命令，否则这个 skill 只生成 blueprint 和建议，不直接修改用户工作区。

## 参考

需要完整 schema、边界和执行要求时，读取：

```text
../starworkUpgrade-spec.md
```

不要在 skill 内重复维护完整 schema，避免和 SPEC 漂移。

## 工作流程

### Step 1：确认目标目录

确认用户要升级的是哪个目录。不要默认扫描用户主目录或过大的上级目录。

如果目标目录已经有 `.starwork/workspace.json`，停止并说明：

```text
这个目录已经是 StarWork 工作台，不应使用 upgrade；后续应使用 update 或 repair。
```

### Step 2：运行 doctor 并取得诊断

优先执行：

```bash
starwork doctor --target <path> --json --inventory-depth all
```

如果用户还没有 `starworkDoctor` 诊断，先按 `starworkDoctor` 的流程判断：

- Core 逻辑贴近程度
- 目录角色映射候选
- 已具备的 Core 能力
- 缺失和风险
- 建议确认的问题

`doctor` 输出只当作事实和信号，不把其中的 legacy 判断当最终结论。

### Step 3：采访用户确认关键语义

只问会影响升级蓝图的问题。

必须确认：

- 哪个目录是正式成果 / 确认事实源
- 哪个目录是当前工作 / 日常推进区
- 哪些目录是只读参考资料
- 是否需要事项机制
- 保留旧目录名，还是逐步标准化

推荐问法：

```text
未来你希望 Agent 把哪里当成“不能乱改的正式成果”？
```

```text
你平时真正干活的地方在哪里？比如推进事项、写草稿、放待办、记录阶段判断。
```

### Step 4：选择升级策略

默认选择：

```text
preserve-names
```

也就是保留用户已有目录名，通过 `.starwork/workspace.json` 和 Agent 规则建立 StarWork Core 映射。

除非用户明确要求，不要建议移动历史内容。

### Step 5：生成升级蓝图目录

推荐结构：

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

### Step 6：输出执行命令

先给 dry-run：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --dry-run
```

用户确认后：

```bash
starwork upgrade --target <workspace> --blueprint <workspace>-upgrade/upgrade-blueprint.json --yes
starwork doctor --target <workspace>
```

## 输出结构

```text
## 升级判断

## 用户已确认的目录语义

## 升级策略

## 生成的 blueprint 文件

## dry-run 命令

## 执行前请再次确认
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
