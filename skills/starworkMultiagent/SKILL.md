---
name: starworkMultiagent
description: Use this skill when a user wants AI help designing, initializing, updating, binding, releasing, inspecting, or sharing StarWork multiagent / Agent Lanes collaboration state with `starwork multiagent`.
---

# starworkMultiagent

使用这个 skill，把用户关于“常用智能体”“当前会话职责”“多 Agent 分工”“跨 Agent 输出共享”的自然语言请求，转换成安全的 `starwork multiagent` 命令组合。

`starworkMultiagent` 不是 `starwork multiagent` 命令本身。它负责判断用户意图、确认 lane 语义和写入边界，并在写入前优先 dry-run 或请求确认。CLI 只负责稳定执行。

不要把职责写死为前端、后端、测试。lane ID、职责和写入范围必须来自当前项目语境。

## 参考

需要完整边界、验收标准和子命令映射时，读取：

```text
../starworkMultiagent-spec.md
../../core/agent-lanes-spec.md
```

不要在 skill 内重复维护 Agent Lanes 协议细节；以 Core SPEC 为事实源。

## 先读上下文

开始前优先读取当前工作区内这些文件，存在多少读多少：

```text
AGENTS.md
_系统/上下文/current-projects.md
_系统/上下文/decisions.md
_系统/上下文/product-principles.md
_系统/任务/current-work.md
_系统/协作/agent-lanes.md
_系统/协作/shared.md
```

如果用户指定了目标目录，所有命令都加 `--target <path>`。如果没有指定，默认目标是当前工作区。

## 判断用户意图

优先把用户话语归到一个入口，不要一开始讲 CLI 子命令。

| 用户意图 | Skill 解释 | CLI 组合 |
|---|---|---|
| “把当前会话创建为常用智能体，负责 X” | 登记当前会话为一个稳定职责位 | 必要时 `init`，再 `add`，再 `bind` |
| “初始化多 Agent 协作层” | 创建 Agent Lanes 协议文件 | `multiagent init` |
| “增加一个负责 X 的 Agent / lane” | 新增职责位，暂不一定绑定会话 | `multiagent add` |
| “把当前 Codex 绑定到 X” | 将具体 session 绑定到已有 lane | `multiagent bind` |
| “这个会话不再负责 X” | 释放 lane 当前绑定 | `multiagent release` |
| “看看现在有哪些 Agent 分工” | 读取协作状态 | `multiagent status --json` |
| “这个输出给其他 Agent 看” | 登记共享输出索引 | `multiagent share` |

## 常用流程：登记当前会话为常用智能体

这是最常见入口。

1. 读取当前工作区状态和 Agent Lanes 文件。
2. 如果 `_系统/协作/agent-lanes.md` 不存在，先建议或执行：

```bash
starwork multiagent init --target <path> --dry-run
```

3. 确认或从用户语义提取：
   - lane ID，例如 `research`、`writing`、`review`。这些只是示例，不是默认值。
   - 职责描述。
   - 可主动修改的路径范围。
   - 当前 session ID；无法自动识别时，请用户提供 `agent:session-id`。
4. 生成 dry-run 命令：

```bash
starwork multiagent add <lane> --purpose "<text>" --write "<path-globs>" --target <path> --dry-run
starwork multiagent bind <lane> --session <agent:session-id> --target <path> --dry-run
```

5. 用户确认后，再把写入类命令改为 `--yes` 执行。

如果 lane 已存在，不重复 `add`；只做 `bind`，并说明是否会替换已有绑定。若已有其他 session 绑定，默认先停下来确认。

## 子命令使用规则

### init

`init` 是协议初始化，不是“创建智能体”的完整用户动作。

触发：

- 用户明确要求初始化 multiagent / Agent Lanes 协作层。
- 用户要一次性创建多个空职责位。
- 登记当前会话时发现协作层不存在。

命令：

```bash
starwork multiagent init --lanes <ids> --target <path> --dry-run
```

不要要求用户一开始想清楚所有 lane。可以先创建空协作层，再按实际工作增加 lane。

### add

新增稳定职责位。

必须确认：

- `lane-id`
- `purpose`
- `write_scope`

命令：

```bash
starwork multiagent add <lane> --purpose "<text>" --write "<path-globs>" --target <path> --dry-run
```

### bind

把具体会话绑定到已有 lane。

优先使用真实 session ID。Codex 环境可尝试读取 `CODEX_THREAD_ID`；读取不到时，要求用户提供：

```text
codex:<session-id>
```

命令：

```bash
starwork multiagent bind <lane> --session <agent:session-id> --target <path> --dry-run
```

### release

释放 lane 当前绑定。

执行前提醒用户先更新该 lane 的 worklog，至少写清当前状态、输出和下一步。

命令：

```bash
starwork multiagent release <lane> --target <path> --dry-run
```

### status

只读检查，可以直接运行：

```bash
starwork multiagent status --target <path> --json
```

运行后用人话解释：

- 当前 lane 列表。
- 哪些 lane 已绑定 / 未绑定。
- 每个 lane 的写入范围。
- shared outputs 和 cross-lane requests 中需要关注的内容。

### share

登记某个 lane 的输出，供其他 lane 读取。

必须确认：

- 来源 lane。
- 标题。
- 相对路径。
- 受众 lane。
- 状态：`draft`、`ready` 或 `confirmed`。

命令：

```bash
starwork multiagent share <from-lane> --title "<title>" --path "<relative-path>" --audience "<lane-list>" --status <status> --target <path> --dry-run
```

只登记索引，不移动、不复制文件。

## 安全规则

- 写入类命令默认先 `--dry-run` 或征得用户确认。
- 用户明确要求执行后，写入类命令使用 `--yes`。
- `status` 是只读命令，可以直接运行。
- 不写入 `matters/registry.md`。
- 不创建任务系统、锁系统或 JSON manifest。
- 不自动决定项目该有哪些 lane。
- 不把示例 lane 当默认模板。
- lane 外文件修改前，先登记共享请求或取得用户明确授权。

## 输出格式

讨论阶段优先输出简短方案：

```markdown
## Multiagent 建议

- 目标：
- 需要的 lane：
- 当前会话绑定：
- 写入范围：
- 需要执行的 dry-run：

## 待确认

- ...
```

执行后建议运行：

```bash
starwork multiagent status --target <path> --json
```

然后总结当前分工和下一步。
