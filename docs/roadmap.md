# StarWork 产品里程碑

本文用于回答一个问题：StarWork 接下来应该按什么顺序推进。

它不是具体任务清单，而是产品从“能跑起来”到“能发布、能教学、能扩展”的阶段地图。具体任务仍然放在 `matters/` 中推进，成熟结论再进入 `product/`。

## 当前判断

StarWork 现在不缺想法，缺的是一条清晰的主线。

当前已经完成了产品地基、Core v0.1 封版，以及 CLI v0.1 最小闭环：

- Core 被定义为开源 AI 工作区协议。
- Kit 被定义为 Core 协议的参考落地结构。
- CLI 被定义为稳定生成、检查、适配和安装 Pack 的工具。
- Pack 被定义为场景定制工作流包。
- `starwork init` 第一版已经可以把 Kit 和 Pack 组装成工作台。
- `starwork spawn` 第一版已经可以从多项目中枢生成并登记新项目工作台。
- `starwork doctor` 第一版已经可以检查工作台健康状态。
- `starwork adapt` 第一版已经可以生成或登记 Agent 适配入口。
- `starwork pack install` 第一版已经可以在健康工作台上补装 Pack。
- `starwork spawn --blueprint` 第一版已经可以按工作台定制单生成定制化卫星项目；`starworkSpawn` skill 第一版用于生成工作台定制单。

所以，下一步不应该继续扩张 Core 或 CLI。当前应先完成公开 A 测分发和安装反馈收集，再进入第一个场景 Pack 与 Demo 验证。

## 总路线

```text
M0 项目地基
  ↓
M1 Core v0.1 封版
  ↓
M2 CLI v0.1 最小闭环
  ↓
M2.5 公开 A 测分发与安装验证
  ↓
M3 Content Creator Pack v0.1
  ↓
M4 Demo 工作区
  ↓
M5 内测与修正
  ↓
M6 v0.1 发布
  ↓
M7 v0.2 扩展
  ↓
M8 v1.0 稳定产品
```

## M0 项目地基

状态：已完成。

目标：建立 StarWork 正式产品项目，不再混用课程项目和旧 Runtime spike。

已完成：

- 建立 `product/` 与 `matters/` 双工作区。
- 将 `product/` 初始化为独立 Git 仓库。
- 明确 StarWork 四层：Core、CLI、Packs、Course。
- 明确 Course 继续由 `珍妮丁丁GFM` 承载，本项目只承载产品本体。
- 明确旧 `/Users/shuxinding/Project/StarWork` 只作为历史参考。

验收标准：

- 产品事实源只认 `product/`。
- 推进过程只进 `matters/`。
- 当前项目状态、当前工作和事项注册表可读。

## M1 Core v0.1 封版

状态：已封版。

目标：冻结 StarWork 最小工作区协议，让不同 Agent 都知道该读什么、写什么、保护什么。

当前成果：

- `product/core/core-v0.1-protocol.md`
- `product/core/baseline/`
- `product/core/profiles/`
- `product/core/capabilities/`
- `product/core/presets/`
- `product/core/kits/`
- `product/core/kits/kit-structure-reference.md`

封版结论：

- Core v0.1 的最小协议、五类 Kit 结构和 Kit 事实依据可以作为后续 CLI 检查、适配和 Pack 安装的基础。
- 后续不再继续扩张 Core v0.1 的范围；发现问题时优先通过 `doctor` 检查、Pack 规则或 v0.2 候选项处理。

验收标准：

- 人能用中文读懂 Core 的最终形态。
- Agent 能从 Core 文档判断一个工作区是否健康。
- CLI 可以按 Core 定义生成和检查工作区。

## M2 CLI v0.1 最小闭环

状态：已完成。

目标：让普通用户不用理解 Core 内部结构，也能初始化、检查、适配和安装场景包。

当前成果：

- `starwork init` 第一版已落地。
- `init` 已支持工作区类型选择、Pack 选择、语言配置、dry-run 和冲突保护。
- `starwork spawn` 第一版已落地，可从健康 Hub 创建 `satellite-starter` / `satellite-matter` 项目工作台，并回写 Hub 项目注册表。
- `starwork doctor` 第一版已落地，可检查 workspace state、Core 必需角色、Kit 文件、正式事实源、业务工作区和 Pack 落地结果。
- `starwork adapt` 第一版已落地，可为 Codex、Claude Code、Cursor、Trae 生成或登记轻量适配入口。
- `starwork pack install` 第一版已落地，可在健康工作台上补装 Pack。

后续增强项：

- `init` 交互体验继续打磨。
- `spawn --blueprint` 增强：支持 `renames`、`removals`、更完整的 schema 校验和迁移。
- `doctor` 内容边界 warning 和 strict / verbose 增强。
- Pack 升级、卸载和迁移机制。

验收标准：

- 用户可以从空文件夹初始化一个可用工作台。
- 用户可以检查当前工作区缺什么、错什么、危险在哪里。
- 用户可以为当前 Agent 生成或更新适配文件。
- 用户可以安装或更新 Pack，并且不会覆盖已有内容。

## M2.5 公开 A 测分发与安装验证

状态：进行中。

目标：让外部 A 测用户可以通过公开 GitHub 与 npm 入口安装 StarWork，并验证 CLI 与 Skills 的最小流程。

当前成果：

- GitHub 仓库已推送到 `jennie-shawn/starwork`。
- npm 包名为 `@jennie-shawn/starwork`。
- `starworkInit`、`starworkDoctor`、`starworkUpgrade` 可通过 `npx skills add` 安装为系统 Skill；`starworkSpawn` 改为 Hub Kit 自带 Skill。
- 公开 README 已改为中文首页。
- 已新增面向 Agent 的安装指南：`product/docs/agent-install-guide.md`。
- npm `latest` 已发布到 `0.1.0-alpha.3`。

验收标准：

- A 测用户能安装 CLI 并看到 `starwork --help`。
- A 测用户能安装系统 Skills，并让 Agent 识别 `starworkInit`、`starworkDoctor`、`starworkUpgrade`。
- Hub 工作台能带出 Kit 自带的 `starworkSpawn`，单项目工作台能带出 Kit 自带的 `neat-freak`。
- `init -> doctor -> hub init -> spawn -> doctor` 的最小流程能被外部用户跑通。
- A 测反馈中暴露的安装和 skill 调用问题被记录到 matter。

## M3 Content Creator Pack v0.1

状态：下一阶段，等待 A 测安装链路稳定后启动。

目标：做出第一个真正能解决场景问题的 Pack，而不是只有目录结构。

Pack 应覆盖的最小内容闭环：

```text
灵感输入
  ↓
选题整理
  ↓
内容大纲
  ↓
正文或脚本
  ↓
发布记录
  ↓
数据复盘
  ↓
下一轮选题
```

还需要做：

- 创建内容创作者 Pack v0.1 matter。
- 确认目录结构。
- 确认每个目录下的 Agent 规则。
- 确认模板和 seed 示例。
- 确认中文和英文版本的路径与文案。

验收标准：

- 内容创作者不用懂 Core，也能看懂这个工作台。
- Agent 知道素材、选题、草稿、发布记录、数据复盘分别放哪里。
- Pack 能被 CLI 安装到一个 Core Kit 上。

## M4 Demo 工作区

状态：未开始。

目标：用一个真实例子证明 StarWork 能跑，而不是只在文档里成立。

建议 Demo：

- 中文内容创作者单项目工作台。
- 初始化方式：`starwork init` + `content-creator` Pack。
- 至少跑完一条内容链路：灵感、选题、草稿、发布、复盘。

验收标准：

- 新 Agent 进入 Demo 工作区后，能快速知道项目状态。
- 用户能看到 StarWork 对真实工作的帮助。
- Demo 能暴露 Core、CLI、Pack 的不一致之处。

## M5 内测与修正

状态：未开始。

目标：用真实使用反馈修正，而不是继续凭想象扩写。

内测对象：

- 用户本人当前工作流。
- 一到两个学员现有单项目模板。
- 一个新建空项目。

重点观察：

- 初始化流程是否顺。
- 目录命名是否直觉。
- Agent 是否会乱写、漏读或覆盖。
- Pack 是否真的减少了用户解释成本。

验收标准：

- 至少完成三次初始化和一次 Pack 安装验证。
- 形成明确的问题清单。
- 修完 v0.1 发布前必须修的问题。

## M6 v0.1 发布

状态：未开始。

目标：发布第一个可以被外部理解和试用的 StarWork 版本。

发布内容：

- Core v0.1 协议。
- CLI v0.1。
- General Pack。
- Hub Management Pack。
- Content Creator Pack v0.1。
- Demo 工作区。
- 入门文档。

验收标准：

- 用户能知道 StarWork 是什么。
- 用户能按文档初始化一个工作台。
- 用户能理解 Core、Kit、CLI、Pack 的关系。
- 用户能用 Content Creator Pack 跑一次最小内容生产闭环。

## M7 v0.2 扩展

状态：规划中。

目标：在 v0.1 验证成立后，再扩展能力。

候选方向：

- 更完整的 `adapt`，支持 Codex、Claude Code、Cursor、Trae 等适配差异。
- `doctor` 自动修复建议。
- Pack 升级、卸载和迁移机制。
- 更多 Packs。
- 更强的主库与卫星项目同步能力。
- schema 校验和版本迁移。

进入条件：

- v0.1 已经能被真实用户跑通。
- Core、CLI、Pack 的边界没有重大摇摆。

## M8 v1.0 稳定产品

状态：远期。

目标：形成可以长期维护、教学、开源传播和商业化的稳定产品。

v1.0 应具备：

- 稳定 Core 协议。
- 稳定 CLI。
- 可复用 Pack 生态。
- 清楚的 Adapter 层。
- 完整文档和 Demo。
- 与 Course 层的清晰衔接。

## 当前下一步

当前最应该做的不是重开 Core 或继续扩张 CLI，而是先完成 M2.5：

1. 继续优化 CLI 与 `starworkInit` / `starworkSpawn` skills 的体验。
2. 慢慢收集 A 测用户对 CLI 安装、Skills 安装、`init`、`doctor`、`spawn` 的反馈。
3. 等 GFM 新一期课程敲定时，再启动 Content Creator Pack v0.1 matter，把首个场景 Pack 的目录、规则、模板和 Demo 定下来。

如果只能选一个，先优化 `init` 与对应 skill 的真实用户入口体验。

原因：M2 已经提供了最小 CLI 工具链，A 测版本也已发布；现在最容易产生体验落差的是 CLI 与 Skill 之间的协同、提示和容错。
