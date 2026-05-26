# StarWork Kit Skills

这里存放 StarWork Kit 自带 skill。

这些 skill 不应该通过 `npx skills add jennie-shawn/StarWork` 安装到全局 Agent 环境，而是由 `starwork init` 按工作区类型写入具体工作台。

## 当前 Kit Skills

- `starworkSpawn/`：Hub Kit 自带，帮助已有 Hub 设计 `starwork spawn --blueprint` 工作台定制单。
- `starworkAudit/`：Hub Kit 自带，帮助 Hub 巡检旗下 Satellite 项目，并生成 `starwork repair --blueprint` 修复蓝图。
- `neat-freak/`：Project Kit 自带，帮助单项目工作台进行阶段性收尾、整理和归档。
