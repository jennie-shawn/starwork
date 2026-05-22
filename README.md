# StarWork

StarWork 是一套面向 AI Agent 的工作台协议和工具集，用来帮助用户把长期工作、跨会话协作、多项目管理和 Agent 工作流组织清楚。

它包含四个核心部分：

- **Core**：定义工作台应该长什么样，包括目录结构、角色边界、状态文件和健康检查规则。
- **CLI**：提供 `init`、`doctor`、`spawn`、`upgrade`、`adapt`、`pack install`、`multiagent` 等命令，用来创建、检查、升级、协作和扩展工作台。
- **Packs**：场景模板包。当前 A 测阶段默认使用通用 Pack。
- **Skills**：给 Codex 等 Agent 使用的工作流说明，让 Agent 能更可靠地帮用户设计和生成 StarWork 工作台。

当前版本处于 A 测阶段，适合测试安装流程、基础命令、工作台结构和 Agent skill 使用体验。

## 安装 CLI

全局安装：

```bash
npm install -g @jennie-shawn/starwork
starwork --version
starwork --help
```

不全局安装，直接运行：

```bash
npx @jennie-shawn/starwork --version
npx @jennie-shawn/starwork --help
```

## 安装 Skills

StarWork skills 分两类管理：

- 系统 Skill 通过 GitHub 仓库和 `skills` CLI 安装到 Agent 全局环境。
- Kit 自带 Skill 跟着工作台走，例如 Hub Kit 自带 `starworkSpawn`，单项目 Kit 自带 `neat-freak`。

给 Codex 安装 StarWork 系统 Skill：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkDoctor -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkUpgrade -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkMultiagent -g -a codex -y
```

如果你只想先安装初始化助手：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
```

当前 skills：

- `starworkInit`：帮助 Agent 判断工作台类型、语言、是否需要事项，并生成友好的 `starwork init` 初始化方案。
- `starworkDoctor`：帮助 Agent 基于 `starwork doctor --json` 做目录逻辑诊断。
- `starworkUpgrade`：帮助 Agent 生成 `starwork upgrade --blueprint` 升级蓝图。
- `starworkMultiagent`：帮助 Agent 把“登记当前会话为常用智能体”“管理多 Agent 分工”“登记共享输出”等请求转换成 `starwork multiagent` 命令组合。
- `starworkSpawn`：Hub Kit 自带 Skill，帮助已有 Hub 设计 `starwork spawn --blueprint` 工作台定制单。
- `neat-freak`：单项目 Kit 自带 Skill，帮助项目收尾、整理和归档。

如果你希望让 Agent 帮你完成安装，可以把 [Agent 安装指南](docs/agent-install-guide.md) 里的提示词发给你的 Agent。

## 快速开始

创建一个单事务项目工作台：

```bash
starwork init \
  --type single-light \
  --pack general \
  --language zh \
  --name "StarWork A Test" \
  --target ~/Desktop/starwork-a-test \
  --yes
```

检查工作台：

```bash
starwork doctor --target ~/Desktop/starwork-a-test
```

创建一个多项目中枢：

```bash
starwork init \
  --type hub \
  --language zh \
  --name "StarWork Hub A Test" \
  --target ~/Desktop/starwork-hub-a-test \
  --yes
```

从 Hub 生成一个项目：

```bash
starwork spawn \
  --hub ~/Desktop/starwork-hub-a-test \
  --name "Alpha Project" \
  --target ~/Desktop/starwork-alpha-project \
  --mode matter \
  --yes
```

检查生成的项目：

```bash
starwork doctor --target ~/Desktop/starwork-alpha-project
```

## CLI 能力

```text
starwork init
starwork doctor
starwork spawn
starwork upgrade
starwork adapt
starwork pack install
starwork multiagent
```

当前能力：

- `init`：创建单事务项目、多事务项目或多项目 Hub；交互默认推荐单事务项目。
- `doctor`：检查工作台健康状态、必需文件、Pack 落地结果和 blueprint 定制结果。
- `spawn`：从已有 Hub 创建并登记卫星项目。
- `upgrade`：按 `starworkUpgrade` skill 生成的升级蓝图，把历史模板安全升级为 StarWork 工作台。
- `adapt`：生成 Claude Code、Cursor 等 Agent 的适配文件。
- `pack install`：向兼容工作台安装支持的 Pack。
- `multiagent`：为同一项目建立自定义 Agent 职责位、绑定会话，并登记跨 lane 共享输出。

## 仓库结构

```text
.
├── core/       # StarWork Core 协议、Kit、Profile、Preset
├── cli/        # CLI 实现和命令规格
├── packs/      # 场景 Pack
├── skills/     # Agent skills
├── schemas/    # 结构化 schema
├── adapters/   # Agent 适配规则
├── examples/   # 示例
└── docs/       # 产品文档和 A 测指南
```

## A 测反馈重点

请优先反馈：

- CLI 是否能顺利安装和运行。
- `init` 创建的工作台结构是否容易理解。
- `doctor` 的检查结果是否能指导修复问题。
- Hub + Satellite 工作流是否自然。
- 系统 Skill 是否能被 Agent 正确识别和调用。
- Hub Kit 自带的 `starworkSpawn`、单项目 Kit 自带的 `neat-freak` 是否能在对应工作台内被正确发现。

更完整的测试脚本见 [A 测安装指南](docs/alpha-test-guide.md)。

## 开发

运行测试：

```bash
npm test
```

预览 npm 包内容：

```bash
npm pack --dry-run
```
