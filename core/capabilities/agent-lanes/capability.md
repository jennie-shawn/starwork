# Capability: agent-lanes v0.1

Agent Lanes 是用于同一项目内多 Agent 会话分工协作的可选能力。

它追踪职责位，不追踪事项。

## 新增

中文 profile 默认映射为：

```text
_系统/协作/agent-lanes.md
_系统/协作/shared.md
_系统/协作/lanes/<lane-id>/worklog.md
_系统/协作/lanes/<lane-id>/workspace/README.md
.starwork/agent-lanes/state.json
.starwork/agent-lanes/cache/
```

## 规则

- Lane 是稳定职责位，具体 ID 和职责由项目场景定义。
- Session 是当前绑定到 lane 的具体 Agent 会话。
- 每个 lane 必须声明职责、当前会话、写入范围、worklog 和 workspace。
- Lane workspace 是过程区，用于放草稿、调研笔记、中间分析和临时产物；不是项目正式输出目录。
- 需要其他 lane 读取的输出必须登记到 shared context。
- 成熟产物应晋升到项目正式事实源；晋升后以正式事实源为准。
- Agent Lanes 不写入 事项索引，不参与 事项生命周期。
- Lane 的职责、共享索引、worklog 和 workspace 是项目协作内容，不进入 `.starwork/`。
- `.starwork/agent-lanes/` 只存放 session binding、解析缓存和机制状态。

当前 CLI v0.1 仍把 `current_session` 写在 `_系统/协作/agent-lanes.md`；后续可迁移为可见 registry + `.starwork/agent-lanes/state.json` 的拆分结构。

## SPEC

完整机制见：

```text
product/core/agent-lanes-spec.md
```
