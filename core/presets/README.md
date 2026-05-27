# Presets

Presets 是组装面向用户的 Core 工作区的配方。

一个 preset 会选择：

- 一个 profile
- 零个或多个 capabilities
- 默认正式事实源
- 可选的主库同步预期

Presets 主要供 CLI 和 kit 生成使用。

## v0.1 包含

- `project.yaml`
- `hub.yaml`

`project` 和 `hub` 是正式 v0.1 主入口。

旧 `local-starter` 已从 Core 正式材料中移除；CLI 如遇到旧别名，会映射到新的 `project` 结构。`satellite-starter` 暂时只作为待讨论的卫星项目结构参考，不作为 `init` 主入口。

## 命名原则

Preset ID 不携带语言标签，只表达工作区形态。

当前 v0.1 的正式 preset 默认使用中文 profile。英文 profile 通过 CLI 语言参数映射，不再维护独立的 `local-starter` 参考 Kit。
