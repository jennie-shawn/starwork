# StarWork Project Kit

Preset: `project`

适合具体项目执行层。它既可以作为独立项目工作台，也可以由 Hub 通过 `spawn` 生成并绑定为 Satellite。

## 包含

- 默认中文路径 profile
- 轻量输出模式
- 可选主库同步模式
- 共享 skill 软链接挂载能力

## 规则

Project 是具体项目执行层。独立项目本地维护身份、教训和知识；Satellite Project 由 Hub 提供共享身份、教训、知识和 skills。

本 kit 预期包含：

- `_系统/主库同步/`：Hub 与 Satellite 关系的可见说明；独立项目可忽略
- `_系统/上下文/当前项目.md`：当前主库兼容的项目状态事实源
- `_系统/任务/当前工作.md`：当前工作入口
- `.starwork/handoff/`：跨项目联络单的本地收发记录
- `.starwork/sync.json`：记录 Hub 来源、同步时间、共享资源和 skill 挂载信息；独立项目可为空
- `.starwork/internal/`：来自 Hub 的选定协议文件快照；独立项目可为空
- `_系统/身份/`：独立项目本地身份，或 Hub 身份信息初始化快照 / 链接
- `_系统/教训/`：独立项目教训，或 Hub 跨项目教训快照和候选
- `知识/`：独立项目知识入口，或指向 Hub `knowledge/` 的只读链接
- `参考资料/`：本项目原始资料和参考材料
- `输出/`：本项目草稿和确认成果
- `.agents/skills/`、`.claude/skills/`：按需软链接主库正式 skill

## 不默认包含

- `事项/`
- `_系统/上下文/决策.md`

项目特定事实进入项目自己的正式事实源，不写回 Hub 正式目录。

`_系统/上下文/当前项目.md` 是项目状态事实源。不要同时维护另一份 `_系统/上下文/项目状态.md`。

注意：`.starwork/`、`.obsidian/` 是隐藏路径，很多文件管理器默认看不到。人类理解 Hub 关系时，优先读 `_系统/主库同步/README.md`。legacy `.core-sync.json` 和 `.internal/` 仍可作为兼容读取来源。
