# StarWork CLI

这里存放 StarWork CLI 源码、命令设计和命令级文档。

## v0.1 边界

v0.1 只覆盖最小可用安装和适配能力：

- `starwork init`
- `starwork spawn`
- `starwork doctor`
- `starwork adapt`
- `starwork pack install content-creator`

第一阶段重点：

- 能从空文件夹初始化 StarWork 工作台
- 能从多项目中枢生成被管理的新项目工作台
- 能检查工作区结构是否完整
- 能生成或更新当前 Agent 所需适配文件
- 能安装自媒体内容创作者 Pack
- 安装和更新时不覆盖用户已有内容

当前 M2 CLI v0.1 最小闭环已落地：

- `starwork init` 第一版：可以初始化轻量单项目、长期单项目和多项目管理中枢，并通过 Pack 语言配置组装通用工作、内容创作者和中枢管理场景。
- `starwork spawn` 第一版：可以从健康 Hub 生成 `satellite-starter` / `satellite-matter` 项目工作台，支持 `--blueprint` 定制目录、路径、规则和 seed，并回写 Hub 项目注册表。
- `starwork doctor` 第一版：可以检查 workspace state、Core 必需角色、Kit 文件、正式事实源、业务工作区和 Pack 落地结果，并支持 `--json` 输出。
- `starwork adapt` 第一版：可以为 Codex、Claude Code、Cursor、Trae 生成或登记轻量适配入口。
- `starwork pack install` 第一版：可以在健康工作台上补装 Pack，并更新路径、规则、模板和 workspace state。

CLI 不在 v0.1 阶段处理账号、授权、消息平台 gateway 或复杂商业系统。

## 命令规格

- [`starwork init` SPEC](./init-spec.md)
- [`starwork doctor` SPEC](./doctor-spec.md)
- [`starwork adapt` SPEC](./adapt-spec.md)
- [`starwork pack install` SPEC](./pack-install-spec.md)
- [`starwork spawn` SPEC](./spawn-spec.md)
- [`starwork spawn --blueprint` SPEC](./spawn-blueprint-spec.md)

## 本地运行

```bash
node cli/bin/starwork.js init --type single-light --pack general --dry-run
node cli/bin/starwork.js spawn --hub ./my-hub --name "新项目" --target ./new-project --mode matter --dry-run
node cli/bin/starwork.js spawn --hub ./my-hub --target ./new-project --blueprint ./blueprint.json --dry-run
node cli/bin/starwork.js doctor --target ./my-workspace
node cli/bin/starwork.js adapt claude --target ./my-workspace --yes
node cli/bin/starwork.js pack install content-creator --target ./my-workspace --yes
```
