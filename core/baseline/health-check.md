# Core Health Check v0.1

一个工作区满足以下条件时，可视为 Core v0.1 健康：

- `agent.entry_rules` 存在。
- `system.context.project_status` 存在。
- `system.tasks.current_work` 存在。
- 入口规则或项目状态中声明了正式事实源。
- 已启用的可选能力文件遵守自身边界。
- 使用 `main-repo-sync` 的卫星项目包含 `.starwork/sync.json`，或 legacy `.core-sync.json`。

## 警告项

检查器遇到以下情况应给出警告：

- 当前工作文件包含大段项目历史。
- 项目状态文件包含任务级流水，不论实际路径映射成 `_系统/上下文/项目状态.md`、`_系统/上下文/当前项目.md` 还是英文路径。
- 决策记录写入会议纪要或局部草稿选择。
- `references/` 被当成生成成果来改写。
- 事项机制 草稿被当成正式事实源。
- 卫星项目在未确认情况下修改主库快照或软链接 skill。

## 兼容性

`system.context.project_status` 是角色，不是强制文件名。

对当前由 Hub 管理的中文卫星项目，`_系统/上下文/当前项目.md` 是兼容事实源。中文本地单项目 Kit 使用 `_系统/上下文/项目状态.md`。检查器和 adapter 必须读取 profile / preset 声明，不能假设所有工作区都使用同一个文件名。
