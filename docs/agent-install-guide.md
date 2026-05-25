# 让 Agent 帮你安装 StarWork

这份文档给不想自己敲命令的用户使用。你可以把下面的提示词直接发给 Codex、Claude Code 或其他能操作终端的 Agent，让它帮你完成 StarWork CLI 和系统级 Skills 的安装与验证。

## 复制给 Agent 的提示词

```text
请帮我安装并验证 StarWork。

请先阅读 StarWork 的 Agent 安装指南，再按文档执行：
https://raw.githubusercontent.com/jennie-shawn/starwork/main/docs/agent-install-guide.md

请不要覆盖我的真实项目文件；测试只使用临时目录。完成后告诉我 CLI 版本、Skills 安装结果和临时工作台验证结果。
```

## Agent 执行步骤

目标：

1. 安装或更新 StarWork CLI：`@jennie-shawn/starwork`。
2. 安装 StarWork 仓库公开发布的全部 Skills。
3. 验证 CLI、Skills 和一个临时工作台是否可用。
4. 不覆盖用户机器上已有的重要文件。如果发现已有 `starwork` 命令或旧版本，先说明来源和建议，不直接强制覆盖。

请按以下步骤执行：

1. 检查 Node.js 和 npm 是否可用：
   node --version
   npm --version

2. 检查当前是否已有 starwork 命令：
   which starwork
   starwork --version
   starwork --help

3. 如果没有 starwork，安装 CLI：
   npm install -g @jennie-shawn/starwork

   如果已经有 starwork，请判断它是否来自 @jennie-shawn/starwork。
   如果不是，请先向我说明，不要直接覆盖。
   如果是旧版 @jennie-shawn/starwork，请升级：
   npm install -g @jennie-shawn/starwork@latest

4. 验证 CLI：
   starwork --version
   starwork --help
   npx @jennie-shawn/starwork@latest --version
   npx @jennie-shawn/starwork@latest --help

5. 安装 StarWork Skills 到 Codex。必须使用这一条短命令，不要逐个安装单个 Skill：
   npx skills add jennie-shawn/starwork -g -a codex -y

6. 验证 Skills 能被发现：
   npx skills add jennie-shawn/starwork --list
   npx skills ls -g -a codex --json

7. 做一个最小 CLI 测试，使用临时目录，不要污染我的真实项目：
   rm -rf /tmp/starwork-a-test
   starwork init --type project --pack general --language zh --name "StarWork A Test" --target /tmp/starwork-a-test --yes
   starwork doctor --target /tmp/starwork-a-test

完成后请告诉我：
- StarWork CLI 安装版本。
- starwork --version 是否返回版本号；当前 npm latest 应为 0.1.0-alpha.11 或更新版本。
- starwork --help 是否可用。
- starworkInit、starworkDoctor、starworkMultiagent、starworkAudit 是否已安装。
- 临时工作台内是否有 .starwork/skills.json。
- 最小工作台 doctor 是否通过。
- 如果有任何失败，请贴出关键错误信息和建议处理方式。

## 手动安装命令

如果你想自己安装，也可以直接运行：

```bash
npm install -g @jennie-shawn/starwork
starwork --version
starwork --help
npx skills add jennie-shawn/starwork -g -a codex -y
```

## Skills 口径

系统级 Skills 是 Agent 全局可用的 StarWork 助手，目前包括：

- `starworkInit`
- `starworkDoctor`
- `starworkMultiagent`
- `starworkAudit`

Kit 随附 Skills 的主要使用入口跟着工作台走；即使短命令把它们也安装到全局，也不影响 Hub / Project 内的 Kit 分发逻辑：

- `starworkSpawn`：Hub Kit 自带，用于帮助 Hub 生成卫星项目 blueprint。
- `neat-freak`：单项目 Kit 自带，用于项目收尾、整理和归档。

## 常见情况

### 已经存在 `starwork` 命令

如果安装时报：

```text
EEXIST: file already exists ... starwork
```

说明你的机器上已经有一个 `starwork` 命令。先检查它来自哪里：

```bash
which starwork
ls -l "$(which starwork)"
npm ls -g --depth=0 | grep starwork
```

确认后再决定是否卸载旧版本或覆盖安装。

### 只想临时测试，不想全局安装

可以使用：

```bash
npx @jennie-shawn/starwork@latest --help
```

如果要在临时目录里测试全局安装，可以指定 prefix：

```bash
rm -rf /tmp/starwork-global-test
npm install -g @jennie-shawn/starwork --prefix /tmp/starwork-global-test
/tmp/starwork-global-test/bin/starwork --help
```

### 更新 StarWork 系统级 Skills

重新运行系统级 Skills 的一条安装命令即可：

```bash
npx skills add jennie-shawn/starwork -g -a codex -y
```
