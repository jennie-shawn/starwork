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
starwork --help
```

不全局安装：

```bash
npx @jennie-shawn/starwork --help
```

## A 测用户安装 Skills

安装全部 StarWork skills：

```bash
npx skills add jennie-shawn/starwork --skill '*' -g -a codex -y
```

只安装 init skill：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
```

只安装 spawn skill：

```bash
npx skills add jennie-shawn/starwork --skill starworkSpawn -g -a codex -y
```

## 最小测试流程

### 1. 创建单项目工作台

```bash
starwork init \
  --type single-matter \
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
- `starworkInit` 和 `starworkSpawn` skills 是否能被 Codex 识别和调用。

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
