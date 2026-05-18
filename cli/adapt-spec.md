# `starwork adapt` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI
- 命令：`starwork adapt`
- 实现状态：v0.1 最小实现已落地
- 目标：为健康的 StarWork 工作台生成或更新不同 Agent 的适配入口

## 一句话定义

`starwork adapt` 是 StarWork 的 Agent 适配命令。

它不复制一整套工作区规则，也不改变 Core 结构。它只给不同 Agent 放置一个轻量入口，让 Agent 知道：真正的规则源头是 `AGENTS.md`，开始工作前还要读取项目状态和当前工作。

## 设计原则

1. `AGENTS.md` 是跨 Agent 的规则事实源。
2. Adapter 文件只是入口，不重新定义 Core。
3. 适配前必须通过 `doctor` 的阻塞检查。
4. 不静默覆盖已有适配文件；冲突时生成旁路文件。
5. 适配结果写入 `.starwork/workspace.json` 的 `adapters` 字段。

## 命令形式

```bash
starwork adapt
starwork adapt claude
starwork adapt --agent cursor
starwork adapt all
starwork adapt --target ./my-workspace --yes
starwork adapt claude --dry-run
```

## v0.1 支持的 Agent

| Agent | 行为 |
|---|---|
| `codex` | 复用已有 `AGENTS.md`，并登记适配状态。 |
| `claude` | 生成 `CLAUDE.md`，指向 `AGENTS.md`、项目状态和当前工作。 |
| `cursor` | 生成 `.cursor/rules/starwork.mdc`。 |
| `trae` | 生成 `.trae/rules/starwork.md`。 |
| `all` | 一次生成全部适配入口。 |

默认不传 Agent 时，使用 `codex`。

## v0.1 不做什么

- 不为不同 Agent 写多套规则。
- 不覆盖用户已有适配文件。
- 不自动修复不健康工作台。
- 不处理账号、登录、插件安装或云端配置。

## 验收标准

- `starwork adapt claude` 能生成 `CLAUDE.md`。
- `starwork adapt --agent cursor` 能生成 Cursor rules。
- 适配结果写入 `.starwork/workspace.json`。
- 工作台未通过 `doctor` 阻塞检查时拒绝适配。
- 非交互环境必须传入 `--yes` 或 `--dry-run`。
