# `starworkMultiagent` Skill SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Skills
- Skill 名称：`starworkMultiagent`
- 相关命令：`starwork multiagent`
- 相关 Core 能力：Agent Lanes
- 实现状态：已实现第一版
- 目标：帮助 Agent 把用户关于常用智能体、会话职责、多 Agent 分工和跨 lane 输出共享的自然语言请求，转换成安全的 `starwork multiagent` 命令组合

## 一句话定义

`starworkMultiagent` 是 StarWork 多 Agent 协作设计和命令包装 skill。

它不是 `starwork multiagent` 命令本身，而是命令执行前的 AI 判断层：

```text
用户说“把当前会话登记成负责 X 的常用智能体”
  ↓
starworkMultiagent 判断 lane、职责、写入范围和 session
  ↓
生成 init / add / bind / share 等 dry-run 命令
  ↓
用户确认后交给 starwork multiagent 执行
```

CLI 保持工程语义；Skill 提供用户语义。

## 事实源

Agent Lanes 协议事实源是：

```text
product/core/agent-lanes-spec.md
```

本 SPEC 只规定 skill 如何判断、追问和调用 CLI，避免重复维护协议。

## 设计边界

`starworkMultiagent` 应该做：

- 判断用户是在初始化协作层、登记当前会话、增加 lane、绑定会话、释放会话、查看状态，还是登记共享输出。
- 采访 lane ID、职责、写入范围、session ID、可选宿主会话显示名称、共享输出受众。
- 判断过程材料应进入 lane workspace，还是应晋升到项目正式输出目录。
- 生成可 dry-run 的 `starwork multiagent` 命令。
- 在用户确认后执行写入类命令。
- 用 `status --json` 解释当前协作状态。

`starworkMultiagent` 不应该做：

- 写死前端、后端、测试等默认职责。
- 自动创建任务系统、锁系统或 JSON manifest。
- 静默修改 `matters/registry.md`。
- 替用户决定项目一定需要多少 lane。
- 把 lane workspace 当成项目正式输出目录。
- 搬运或复制共享输出文件。

## 用户语义与 CLI 映射

| 用户语义 | Skill 判断 | CLI |
|---|---|---|
| “把当前会话创建为一个常用智能体，负责 X” | 最常见入口；必要时初始化协作层，创建 lane 并绑定 session | `init` + `add` + `bind` |
| “初始化 multiagent / Agent Lanes” | 创建协议文件和可选空 lane | `init` |
| “新增一个负责 X 的 Agent” | 创建稳定职责位，当前不一定绑定 session | `add` |
| “把当前 Codex 绑定到 review” | 将当前具体会话绑定到已有 lane | `bind` |
| “释放这个职责位” | 解除当前 session 绑定 | `release` |
| “看看当前分工” | 只读查看协作状态 | `status --json` |
| “这个输出给 writing 和 review 看” | 登记共享输出索引 | `share` |

## 常见入口：登记当前会话为常用智能体

这是 skill 的核心体验，不要求用户理解 `init`、`add` 和 `bind` 的区别。

流程：

1. 读取 `AGENTS.md` 和当前工作区状态。
2. 检查 `_系统/协作/agent-lanes.md` 是否存在。
3. 若不存在，先生成：

```bash
starwork multiagent init --target <path> --dry-run
```

4. 确认 lane ID、职责、写入范围和 session ID。
   默认过程工作区为 `_系统/协作/lanes/<lane-id>/workspace/`。
5. 若 lane 不存在，生成：

```bash
starwork multiagent add <lane> --purpose "<text>" --write "<path-globs>" --target <path> --dry-run
```

6. 生成绑定命令：

```bash
starwork multiagent bind <lane> --session <agent:session-id> --session-name "<display-name>" --target <path> --dry-run
```

7. 用户确认后用 `--yes` 执行。
8. 执行后运行：

```bash
starwork multiagent status --target <path> --json
```

并总结当前分工。

## 子命令判断边界

### `init`

`init` 初始化协议文件，不等于“创建一个智能体”。

适合：

- 用户明确要求启用 Agent Lanes。
- 用户一次性给出多个初始 lane。
- skill 发现登记当前会话前缺少协作层。

不适合：

- lane 已存在时重复初始化。
- 用作修改 lane 职责或绑定 session。

### `add`

`add` 新增稳定职责位。

必须有：

- `lane-id`
- `purpose`
- `write_scope`

如果用户只说“负责 X”，但没有写入范围，skill 应追问或给出保守建议并等待确认。

### `bind`

`bind` 将具体 session 绑定到 lane。

优先使用真实 session ID；无法识别时要求用户提供 `--session <agent:session-id>`。若目标 lane 已绑定其他 session，默认不覆盖，先确认。

如果用户希望把宿主工具中的会话标题也改成该 Agent 的职责名称，skill 可以加入 `--session-name <name>`。这只是宿主显示增强，不是 StarWork 事实源；必须在 dry-run 中让用户看到，并说明失败不会影响绑定。

推荐命名格式：

```text
<项目或产品名> <职责> Agent
```

例如：

```text
StarWork 新功能预研 Agent
StarWork CLI 维护 Agent
```

### `release`

`release` 释放绑定，不删除 lane。

执行前提醒用户更新对应 worklog，避免下一个会话接不上。

### `status`

`status` 是只读命令，可以直接执行。

skill 应解释：

- lane 是否完整。
- 哪些 lane 处于 `unbound`。
- 当前 session 是否可识别。
- shared outputs / requests 是否需要关注。

### `share`

`share` 只登记共享索引。

必须确认：

- from lane
- title
- relative path
- audience lanes
- status

不移动、不复制原文件。

## Lane Workspace 与正式输出

每个 lane 默认拥有一个过程工作区：

```text
_系统/协作/lanes/<lane-id>/workspace/
```

它用于：

- 调研笔记。
- 未确认草稿。
- 中间分析。
- 临时实验结果。
- 给同一 lane 后续会话看的上下文材料。

项目正式输出目录用于：

- 用户认可的最终交付物。
- 项目正式文档。
- 发布稿、确认稿、版本记录。
- 可被整个项目长期引用的稳定成果。

推荐流转：

```text
lane workspace 产生过程材料
  -> 如需其他 lane 读取，登记 shared.md
  -> 如被确认有项目价值，晋升到正式输出目录
  -> 晋升后以正式输出目录为准
```

skill 判断放置位置时遵循：

- 用户说“草稿、笔记、临时分析、先整理一下”，优先建议 lane workspace。
- 用户说“最终版、发布、确认稿、产品文档、正式沉淀”，优先建议项目正式输出目录。
- workspace 内容需要其他 lane 读取时，建议生成 `starwork multiagent share ... --path "_系统/协作/lanes/<lane-id>/workspace/<file>"`。

## 输出结构

讨论阶段：

```markdown
## Multiagent 建议

- 目标：
- lane：
- 职责：
- 写入范围：
- 当前会话：
- dry-run 命令：

## 待确认

- ...
```

执行阶段：

```markdown
## 已执行

- ...

## 当前分工

- ...

## 下一步

- ...
```

## 安全约束

- 写入类命令默认先 dry-run。
- 用户明确要求执行或确认后，才使用 `--yes`。
- 只读 `status` 可以直接运行。
- 不创建默认 lane 模板。
- 不静默覆盖已有绑定。
- 不在用户未确认时猜测并写入宿主会话名。
- 不绕过 StarWork 工作区边界。
- 不修改 `matters/registry.md`。
- 不把 lane workspace 当成项目正式事实源。

## 验收标准

- 给定“请把当前会话创建为一个负责资料整理的常用智能体”，skill 能解释为“登记当前会话为常用智能体”，并生成必要的 `init`、`add`、`bind` 命令。
- 给定“我想让三个 Agent 分别负责资料、写作、审校”，skill 生成项目自定义 lane 建议，不输出固定开发模板。
- 给定“把当前 Codex 绑定到 review”，skill 要求或使用 session ID，并生成 `starwork multiagent bind review ...`。
- 给定“把当前会话登记成 StarWork CLI 维护 Agent”，skill 生成包含 `--session-name "StarWork CLI 维护 Agent"` 的 dry-run，并说明这是宿主会话显示增强。
- 给定“这个输出给 writing 和 review 看”，skill 生成 `starwork multiagent share ...`，不移动原文件。
