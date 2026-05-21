# 让 Agent 帮你安装 StarWork

这份文档给不想自己敲命令的用户使用。你可以把下面的提示词直接发给 Codex、Claude Code 或其他能操作终端的 Agent，让它帮你完成 StarWork CLI 和 Skills 的安装与验证。

## 复制给 Agent 的提示词

```text
请帮我安装并验证 StarWork。

目标：
1. 安装 StarWork CLI。
2. 安装 StarWork 的 Agent skills。
3. 验证 CLI 和 skills 是否可用。
4. 不要覆盖我机器上已有的重要文件。如果发现已有 starwork 命令或旧版本，请先告诉我原因和建议，不要直接强制覆盖。

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

4. 验证 CLI：
   starwork --version
   starwork --help
   npx @jennie-shawn/starwork --version
   npx @jennie-shawn/starwork --help

5. 安装 StarWork 系统 skills 到 Codex：
   npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
   npx skills add jennie-shawn/starwork --skill starworkDoctor -g -a codex -y
   npx skills add jennie-shawn/starwork --skill starworkUpgrade -g -a codex -y

6. 验证 skills 能被发现：
   npx skills add jennie-shawn/starwork --list
   npx skills ls -g -a codex --json

7. 做一个最小 CLI 测试，使用临时目录，不要污染我的真实项目：
   rm -rf /tmp/starwork-a-test
   starwork init --type single-light --pack general --language zh --name "StarWork A Test" --target /tmp/starwork-a-test --yes
   starwork doctor --target /tmp/starwork-a-test

完成后请告诉我：
- StarWork CLI 安装版本。
- starwork --version 是否返回版本号。
- starwork --help 是否可用。
- starworkInit、starworkDoctor、starworkUpgrade 是否已安装。
- 单项目工作台内是否有 `.starwork/skills.json` 和 `neat-freak`。
- 最小工作台 doctor 是否通过。
- 如果有任何失败，请贴出关键错误信息和建议处理方式。
```

## 手动安装命令

如果你想自己安装，也可以直接运行：

```bash
npm install -g @jennie-shawn/starwork
starwork --version
starwork --help
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkDoctor -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkUpgrade -g -a codex -y
```

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
npx @jennie-shawn/starwork --help
```

如果要在临时目录里测试全局安装，可以指定 prefix：

```bash
rm -rf /tmp/starwork-global-test
npm install -g @jennie-shawn/starwork --prefix /tmp/starwork-global-test
/tmp/starwork-global-test/bin/starwork --help
```

### 更新 StarWork skills

```bash
npx skills update starworkInit -g
npx skills update starworkDoctor -g
npx skills update starworkUpgrade -g
```

也可以重新安装：

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkDoctor -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkUpgrade -g -a codex -y
```
