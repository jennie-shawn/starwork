# 中文多项目 Matter Kit

Preset: `zh-shared-matter`

适合主库 + 多卫星项目工作台。

## 包含

- 中文路径 profile
- Starter Outputs
- Matter Mode
- Decisions
- 主库同步模式
- 共享 skill 软链接挂载能力

## 规则

主库是规则源和共享资源源，卫星项目是执行层。

本 kit 预期包含：

- `_系统/上下文/current-projects.md`：当前主库兼容的项目状态事实源
- `_系统/任务/current-work.md`：当前工作入口
- `_系统/跨项目/`：跨项目联络单的本地收发记录
- `_系统/diary/`：项目运行日记或 inbox 消化记录
- `identity/`：来自主库的初始化快照
- `lessons/`：来自主库的初始化快照
- `.internal/`：来自主库的选定协议文件快照
- `knowledge/`：指向主库 `knowledge/` 的只读链接
- `.core-sync.json`：记录主库来源、同步时间、共享资源和 skill 挂载信息
- `.agents/skills/`、`.claude/skills/`：按需软链接主库正式 skill

项目特定事实进入项目自己的正式事实源，不写回主库正式目录。

`project-status.md` 是 StarWork Core 可选的新命名；本 kit 为兼容当前主库读取机制，先把项目状态正文放在 `current-projects.md`，不要同时维护两份状态正文。
