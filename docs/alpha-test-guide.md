# StarWork A 测安装指南

## 发布口径

- GitHub organization：`jennie-shawn`
- GitHub repository：`jennie-shawn/StarWork`
- npm package：`@jennie-shawn/starwork`
- CLI command：`starwork`
- A 测 tag：`latest`
- 当前 `latest`：`0.1.0-alpha.12`

## A 测用户安装 CLI

全局安装：

```bash
npm install -g @jennie-shawn/starwork
starwork --version
starwork --help
```

不全局安装：

```bash
npx @jennie-shawn/starwork --version
npx @jennie-shawn/starwork --help
```

## A 测用户安装系统 Skills

安装 StarWork 系统 skills：

```bash
npx skills add jennie-shawn/StarWork -g -a codex -y
```

说明：这是一条短命令，只安装 StarWork 系统级 Skills。`starworkSpawn`、`starworkAudit` 和 `neat-freak` 不应被全局安装；前两个会在 `starwork init --type hub` 时进入 Hub 工作台，`neat-freak` 会在单项目初始化时进入项目。

说明：历史模板诊断和升级蓝图生成统一由 `starworkDoctor` 负责；`starwork upgrade` CLI 只执行已经确认过的 blueprint。

说明：Hub-like 旧主库接入也走 `starworkDoctor -> starwork upgrade` 链路；默认保留 `projects/`、`knowledge/`、`skills/` 等原目录名，不创建重复标准目录。

## 最小测试流程

交互式测试时，`starwork init` 会先询问工作台类型和语言；默认推荐单事务项目。Hub 会自动使用 `hub-management` Pack，单项目会默认使用 `general` Pack。

### 1. 创建单事务项目工作台

```bash
starwork init \
  --type project \
  --pack general \
  --language zh \
  --name "StarWork A Test" \
  --target ~/Desktop/starwork-a-test \
  --yes
```

检查：

```bash
starwork doctor --target ~/Desktop/starwork-a-test
```

### 2. 创建多项目中枢

```bash
starwork init \
  --type hub \
  --language zh \
  --name "StarWork Hub A Test" \
  --target ~/Desktop/starwork-hub-a-test \
  --yes
```

检查：

```bash
starwork doctor --target ~/Desktop/starwork-hub-a-test
```

### 3. 从 Hub 生成项目

```bash
starwork spawn \
  --hub ~/Desktop/starwork-hub-a-test \
  --name "Alpha Project" \
  --target ~/Desktop/starwork-alpha-project \
  --mode project \
  --language zh \
  --yes
```

检查：

```bash
starwork doctor --target ~/Desktop/starwork-alpha-project
```

## 反馈重点

请 A 测用户重点反馈：

- CLI 是否能顺利安装和运行。
- `init` 创建的工作台结构是否容易理解。
- `doctor` 的检查结果是否能指导修复问题。
- `spawn` 从 Hub 创建项目的过程是否清楚。
- `doctor` / `starworkDoctor` 对历史模板或 Hub-like 旧主库的说明是否能看懂。
- 系统 skills 是否能被 Codex 识别和调用：`starworkInit`、`starworkDoctor`、`starworkMultiagent`。
- `starworkMultiagent` 是否能把“登记当前会话为常用智能体”正确转换成 `starwork multiagent init/add/bind` 建议。
- Hub Kit 自带的 `starworkSpawn`、`starworkAudit` 与单项目 Kit 自带的 `neat-freak` 是否能在对应工作台内被发现。

## 发布前检查

发布前在产品仓库根目录运行：

```bash
npm test
npm pack --dry-run
```

确认 npm 包里至少包含：

- `cli/`
- `core/`
- `packs/`
- `schemas/`
- `skills/starworkInit/`
- `skills/starworkDoctor/`
- `skills/starworkMultiagent/`
- `kit-skills/starworkSpawn/`
- `kit-skills/starworkAudit/`
- `kit-skills/neat-freak/`
