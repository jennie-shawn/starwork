# Core Baseline v0.1

## 定义

StarWork Core Baseline 是人和 AI Agent 共同使用一个工作区时的最小语义契约。

它定义角色、边界和健康检查。它不定义具体业务领域、不绑定某个 Agent Runtime，也不强制唯一的语言路径结构。

## 必需角色

一个 Core v0.1 工作区必须提供这些角色：

| 角色 | 用途 |
|---|---|
| `agent.entry_rules` | 跨 Agent 的工作规则入口。 |
| `system.context.project_status` | 稳定的项目状态和正式事实源指针。 |
| `system.tasks.current_work` | 下一次 Agent 会话进入当前工作的入口。 |

## 必需行为

- Agent 修改工作区前必须先读入口规则。
- 当前工作必须有稳定入口文件。
- 项目必须声明正式事实源在哪里。
- 过程材料不能被悄悄当成正式事实源。
- 只读参考层不能在没有用户明确确认的情况下被改写。

## 可选能力

Capabilities 可以增加文件和行为，但不能重新定义 baseline 的含义：

- `starter-outputs`
- `matter-mode`
- `decisions`
- `local-identity`
- `local-lessons`
- `main-repo-sync`
- `skill-mount`

## 不做什么

Core v0.1 不定义：

- Pack 专属工作流
- CLI 命令实现
- 特定 Agent Runtime 行为
- 强制性的机器可读 manifest
- 所有用户都必须拥有的 `matters/` 目录
