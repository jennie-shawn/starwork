# StarWork CLI

这里存放 StarWork CLI 源码、命令设计和命令级文档。

## v0.1 边界

v0.1 只覆盖最小可用安装和适配能力：

- `starwork init`
- `starwork spawn`
- `starwork doctor`
- `starwork upgrade`
- `starwork adapt`
- `starwork pack install`
- `starwork multiagent`

第一阶段重点：

- 能从空文件夹初始化 StarWork 工作台
- 能从多项目中枢生成被管理的新项目工作台
- 能检查工作区结构是否完整
- 能生成或更新当前 Agent 所需适配文件
- 能为同一项目建立多 Agent 职责位、绑定会话并登记跨 lane 共享输出
- 能安装兼容 Pack，并在 A 测阶段优先验证通用工作与多项目中枢管理流程
- 安装和更新时不覆盖用户已有内容

当前 M2 CLI v0.1 最小闭环已落地：

- `starwork init` 第一版：可以初始化单事务项目、多事务项目和多项目管理中枢；交互模式默认推荐单事务项目，先确认工作台类型和语言；Hub 自动使用 `hub-management` Pack，单项目 v0.1 默认使用 `general` Pack，不主动推荐未定稿场景 Pack。
- `starwork spawn` 第一版：可以从健康 Hub 生成 `satellite-starter` / `satellite-matter` 项目工作台，支持 `--blueprint` 定制目录、路径、规则和 seed，并回写 Hub 项目注册表。
- `starwork doctor` 第一版：可以检查 workspace state、Core 必需角色、Kit 文件、正式事实源、业务工作区和 Pack 落地结果，并支持 `--json` 输出；alpha.4 开始可识别历史模板候选；alpha.5 开始输出目录 `inventory` 与语义 `signals`，供 `starworkDoctor` skill 判断。
- `starwork upgrade` 第一版：可以读取 `starworkUpgrade` skill 生成的升级蓝图，把历史模板或非标准目录安全升级为 StarWork 工作台；v0.1 只支持 `--blueprint`，不自动判断升级方案。
- `starwork adapt` 第一版：可以为 Codex、Claude Code、Cursor、Trae 生成或登记轻量适配入口。
- `starwork pack install` 第一版：可以在健康工作台上补装 Pack，并更新路径、规则、模板和 workspace state。
- `starwork multiagent` 第一版：可以初始化 Agent Lanes、按项目自定义职责新增 lane、绑定 / 释放会话、查看状态，并登记跨 lane 可读输出。
- Skill 管理与分发第一版：Kit 可以自带 Skill，Hub 可以托管用户常用 Skill；`init` 写入 `.starwork/skills.json`，`spawn` 按 Hub registry 选择性分发 Skill，`doctor` 暴露 Skill manifest / registry / mount 事实。

后续规划：

- Pack 自带 Skill 与 upgrade Skill actions：按 [`StarWork Skill 管理与分发机制 SPEC`](../core/skill-management-spec.md) 继续扩展。
- `starwork update`：面向已经是 StarWork 的工作台，处理未来 Core / Kit / Pack 版本迁移；与 `upgrade` 分开设计。

CLI 不在 v0.1 阶段处理账号、授权、消息平台 gateway 或复杂商业系统。

## 命令规格

- [`starwork init` SPEC](./init-spec.md)
- [`starwork doctor` SPEC](./doctor-spec.md)
- [`starwork adapt` SPEC](./adapt-spec.md)
- [`starwork pack install` SPEC](./pack-install-spec.md)
- [`starwork spawn` SPEC](./spawn-spec.md)
- [`starwork spawn --blueprint` SPEC](./spawn-blueprint-spec.md)
- [`starwork upgrade` SPEC](./upgrade-spec.md)
- [`starwork multiagent` SPEC](../core/agent-lanes-spec.md)

## 本地运行

```bash
node cli/bin/starwork.js --version
node cli/bin/starwork.js --help
node cli/bin/starwork.js init --type single-light --pack general --dry-run
node cli/bin/starwork.js spawn --hub ./my-hub --name "新项目" --target ./new-project --mode matter --dry-run
node cli/bin/starwork.js spawn --hub ./my-hub --target ./new-project --blueprint ./blueprint.json --dry-run
node cli/bin/starwork.js upgrade --target ./old-workspace --blueprint ./upgrade-blueprint.json --dry-run
node cli/bin/starwork.js doctor --target ./my-workspace
node cli/bin/starwork.js multiagent init --lanes research,writing,review --target ./my-workspace --yes
node cli/bin/starwork.js multiagent bind research --session codex:manual-research-1 --target ./my-workspace --yes
node cli/bin/starwork.js adapt claude --target ./my-workspace --yes
node cli/bin/starwork.js pack install content-creator --target ./my-workspace --yes
```
