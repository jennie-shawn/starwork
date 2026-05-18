# StarWork Core v0.1 协议总览

本文是 StarWork Core v0.1 的第一阅读入口。

如果只读一篇文档，先读这篇。它解释 Core 是什么、不是什么、最小工作区需要什么、可选能力如何组合，以及 Core 与 CLI、Kit、Pack、Adapter 的边界。

## 一句话定义

StarWork Core 是一个开源的 AI 工作区协议。

它定义人和 AI Agent 如何在同一个项目工作区里长期协作：开始前读什么、当前工作写哪里、项目状态放哪里、过程材料和正式成果如何分开、哪些内容默认只读、哪些动作需要用户确认。

Core 不负责把这些协议自动生成出来。稳定生成、检查和升级工作区，是 StarWork CLI 的职责。

## Core 不是什么

Core 不是一个文件夹模板集合。

文件夹只是协议的可见载体。真正重要的是每个文件和目录背后的角色、边界和维护规则。

Core 也不是 CLI。

Core 说明什么是对的；CLI 负责把它稳定创建出来、检查出来、迁移出来。

Core 也不是 Pack。

Pack 是某个具体场景的工作流包，例如自媒体内容创作者 Pack。Core 只提供所有场景都能共用的工作区地基。

Core 也不是 Agent Runtime。

Core 不替代 Claude Code、Codex、Cursor、Trae 等底层 Agent。它让这些 Agent 进入同一个长期工作系统。

## 最小工作区

一个 Core v0.1 工作区至少需要三个角色：

| 角色 | 解决什么问题 |
|---|---|
| `agent.entry_rules` | Agent 进来之后先读什么规则。 |
| `system.context.project_status` | 项目目标、阶段、重点、风险、正式事实源在哪里。 |
| `system.tasks.current_work` | 当前正在推进什么，下一次 Agent 从哪里接上。 |

注意：这些是角色，不是强制文件名。

中文工作区可以把它们映射成：

```text
AGENTS.md
_系统/上下文/项目状态.md
_系统/任务/当前工作.md
```

在当前主库 + 卫星项目模式下，为兼容已有机制，项目状态也可能映射成：

```text
_系统/上下文/当前项目.md
```

关键规则是：一个工作区只能有一个项目状态事实源。不能同时维护两份互相独立的状态文件。

## 正式事实源

每个 Core 工作区都必须声明正式事实源在哪里。

正式事实源是项目最终承认的内容位置。它可能叫：

- `product/`
- `outputs/final/`
- `docs/`
- 其他项目自己声明的目录

Core 不强制正式事实源必须叫 `product/`。

过程材料不能被悄悄当成正式事实源。比如 matter 草稿、会议笔记、AI 草稿，都必须经过用户确认或明确晋升，才能进入正式事实源。

## v0.1 可选能力

Core v0.1 把额外功能做成 capabilities。能力可以组合，但不能改变最小工作区角色的含义。

| 能力 | 作用 |
|---|---|
| `starter-outputs` | 提供 `references/`、`outputs/drafts/`、`outputs/final/` 的轻量工作流。 |
| `matter-mode` | 提供事项机制，适合长期项目和跨会话接力；具体路径由语言 profile 决定。 |
| `decisions` | 提供高影响决策记录，不记录普通会议流水；具体文件名由语言 profile 决定。 |
| `local-identity` | 在项目内维护本地身份信息。 |
| `local-lessons` | 在项目内维护本地可复用教训。 |
| `main-repo-sync` | 支持主库 + 多个卫星项目的 Hub + Satellite 模型。 |
| `skill-mount` | 通过软链接挂载主库共享 skills。 |

## 五种首批形态

v0.1 先保留五种工作区形态。Kit 名称不携带语言标签；当前正式 Kit 默认以中文 profile 落地，其他语言通过 profile 扩展。

| Preset | 面向谁 | 默认特点 |
|---|---|---|
| `local-starter` | 学员、轻量单项目用户 | 本地身份/教训，轻量输入输出工作流，不启用事项。 |
| `local-matter` | 单项目长期用户 | 本地身份/教训，启用 Matter Mode 和高影响决策。 |
| `satellite-starter` | 接入主库的轻量卫星项目 | 主库分发身份、教训、知识、skills；卫星项目不默认启用事项。 |
| `satellite-matter` | 主库 + 多卫星项目用户 | 主库分发身份、教训、知识、skills；卫星项目维护自己的事项和正式事实源。 |
| `hub` | 多项目管理中枢用户 | 统一维护身份、教训、知识、skills、项目注册表和跨项目联络。 |

Preset 是配方，不是协议本身。它选择 profile、capabilities 和默认正式事实源。

## Kit 的定位

Kit 是 preset 组装出来的可复制模板包。

Kit 可以手工维护，也可以由 CLI 生成。它不是 Core 协议事实源。

事实源关系是：

```text
baseline + profiles + capabilities + presets -> kit
```

当前 v0.1 的 kit 可作为参考实现，帮助人和 Agent 理解协议落地后的样子。

未来稳定生成 kit，应由 CLI 控制，而不是要求普通用户靠阅读协议手工无误生成。

## Core 与 CLI 的边界

Core 负责定义协议：

- 角色含义
- 文件边界
- 可选能力
- 兼容规则
- 哪些内容默认只读
- 哪些动作需要确认

CLI 负责执行协议：

- `starwork init`：根据 preset 初始化工作区。
- `starwork doctor`：检查工作区是否符合 Core。
- `starwork adapt`：生成或更新 Agent 适配文件。
- `starwork pack install`：安装场景 Pack。

一句话：

> Core 定义什么是对的；CLI 保证稳定造出来。

## 单项目与多项目

Core 支持单项目工作区，也支持主库 + 多卫星项目。

单项目工作区中，身份、教训、项目状态和产物都可以在项目内维护。

多项目工作区中，采用 Hub + Satellite 模型：

- Hub 维护跨项目共享身份、教训、知识、skills、项目注册表、跨项目联络和回写审核。
- Satellite 维护自己的项目状态、当前工作、事项过程、项目决策和正式事实源。

Hub 可以读取 Satellite 的项目状态，但不能把项目进度正文复制进 registry。

Satellite 也不能把主库快照、共享知识或软链接 skills 当成本地内容随意改写。

## 事项机制

Matter Mode 是增强能力，不是所有用户必需能力。

学员或轻量用户可以只使用 `references/outputs`。

长期项目、跨会话接力、复杂推进过程更适合使用事项机制。中文 Kit 使用 `事项/`，英文 Kit 可使用 `matters/`。

启用 Matter Mode 时，应配套事项维护规则或 skill。否则目录存在了，但创建、更新、暂停、归档的动作仍然容易混乱。

## 决策记录

决策记录是可选能力，不是必需文件。中文 Kit 使用 `_系统/上下文/决策.md`，英文 Kit 可使用 `decisions.md`。

它只记录高影响、已确认、会影响未来多个工作动作的决策。

它不记录：

- 普通会议纪要
- 单个草稿的临时选择
- 每日任务流水
- 尚未确认的讨论过程

## v0.1 封版标准

Core v0.1 可以封版，至少需要满足：

- 普通人能读懂 Core 是什么、不是什么。
- Agent 能知道开始前读哪里、当前工作写哪里、正式事实源在哪里。
- 五种首批工作区形态边界清楚。
- 单项目和多项目不互相污染。
- Matter Mode 是可选增强，不强迫所有用户使用。
- Kit 被定位为参考实现或 CLI 输出，不被误认为协议事实源。
- CLI 的职责被清楚留出，但不在 Core 中实现。

## 后续进入 CLI 前要确认

进入 CLI v0.1 前，需要确认：

- `starwork init` 首批支持哪些 preset。
- `starwork doctor` 检查哪些 Core 健康项。
- `starwork adapt` 首先适配哪些 Agent。
- `starwork pack install content-creator` 与 Core 的边界在哪里。

这些问题属于 CLI 设计，不属于 Core 协议本体。
