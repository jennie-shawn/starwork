# Presets

Presets 是组装面向用户的 Core 工作区的配方。

一个 preset 会选择：

- 一个 profile
- 零个或多个 capabilities
- 默认正式事实源
- 可选的主库同步预期

Presets 主要供 CLI 和 kit 生成使用。

## v0.1 包含

- `local-starter.yaml`
- `local-matter.yaml`
- `satellite-starter.yaml`
- `satellite-matter.yaml`
- `hub.yaml`

## 命名原则

Preset ID 不携带语言标签，只表达工作区形态。

当前 v0.1 的正式 preset 默认使用中文 profile。英文 profile 下的参考样例放在 `profiles/en/reference-presets/`，不进入正式 preset 列表。
