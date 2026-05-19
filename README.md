# StarWork

StarWork 是一套面向 AI Agent 的工作台协议和工具集，用来帮助用户把长期工作、跨会话协作、多项目管理和 Agent 工作流组织清楚。

它包含四个核心部分：

- **Core**：定义工作台应该长什么样，包括目录结构、角色边界、状态文件和健康检查规则。
- **CLI**：提供 `init`、`doctor`、`spawn`、`adapt`、`pack install` 等命令，用来创建、检查和扩展工作台。
- **Packs**：场景模板包。当前 A 测阶段默认使用通用 Pack。
- **Skills**：给 Codex 等 Agent 使用的工作流说明，让 Agent 能更可靠地帮用户设计和生成 StarWork 工作台。

当前版本处于 A 测阶段，适合测试安装流程、基础命令、工作台结构和 Agent skill 使用体验。

## 安装 CLI

全局安装：

```bash
npm install -g @jennie-shawn/starwork
starwork --help
```

不全局安装，直接运行：

```bash
npx @jennie-shawn/starwork --help
```

## 安装 Skills

StarWork skills 通过 GitHub 仓库和 `skills` CLI 分发。

给 Codex 安装全部 StarWork skills：

```bash
npx skills add jennie-shawn/starwork --skill '*' -g -a codex -y
```

单独安装某个 skill：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkSpawn -g -a codex -y
```

当前 skills：

- `starworkInit`：帮助 Agent 判断工作台类型、语言、是否需要事项，并生成友好的 `starwork init` 初始化方案。
- `starworkSpawn`：帮助 Agent 为已有 Hub 设计 `starwork spawn --blueprint` 工作台定制单。

如果你希望让 Agent 帮你完成安装，可以把 [Agent 安装指南](docs/agent-install-guide.md) 里的提示词发给你的 Agent。

## 快速开始

创建一个长期单项目工作台：

```bash
starwork init \
  --type single-matter \
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
starwork adapt
starwork pack install
```

当前能力：

- `init`：创建轻量单项目、长期事项型单项目或多项目 Hub。
- `doctor`：检查工作台健康状态、必需文件、Pack 落地结果和 blueprint 定制结果。
- `spawn`：从已有 Hub 创建并登记卫星项目。
- `adapt`：生成 Claude Code、Cursor 等 Agent 的适配文件。
- `pack install`：向兼容工作台安装支持的 Pack。

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
- `starworkInit` 和 `starworkSpawn` 是否能被 Agent 正确识别和调用。

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
