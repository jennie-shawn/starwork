# StarWork A 测安装指南

## 发布口径

- GitHub organization：`jennie-shawn`
- GitHub repository：`jennie-shawn/starwork`
- npm package：`@jennie-shawn/starwork`
- CLI command：`starwork`
- A 测 tag：`latest`

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
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkDoctor -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkUpgrade -g -a codex -y
```

只安装 init skill：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
```

说明：`starworkSpawn` 现在是 Hub Kit 自带 Skill，会在 `starwork init --type hub` 时进入 Hub 工作台；`neat-freak` 是单项目 Kit 自带 Skill，会在单项目初始化时进入项目。

## 最小测试流程

交互式测试时，`starwork init` 会先询问工作台类型和语言；默认推荐单事务项目。Hub 会自动使用 `hub-management` Pack，单项目会默认使用 `general` Pack。

### 1. 创建单事务项目工作台

```bash
starwork init \
  --type single-light \
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
  --mode matter \
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
- 系统 skills 是否能被 Codex 识别和调用。
- Hub Kit 自带的 `starworkSpawn` 与单项目 Kit 自带的 `neat-freak` 是否能在对应工作台内被发现。

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
- `skills/starworkSpawn/`
- `skills/starworkDoctor/`
- `skills/starworkUpgrade/`
- `skills/neat-freak/`
