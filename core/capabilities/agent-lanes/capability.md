# Capability: agent-lanes v0.1

Agent Lanes 是用于同一项目内多 Agent 会话分工协作的可选能力。

它追踪职责位，不追踪事项。

## 新增

中文 profile 默认映射为：

```text
_系统/协作/agent-lanes.md
_系统/协作/shared.md
_系统/协作/lanes/<lane-id>/worklog.md
```

## 规则

- Lane 是稳定职责位，具体 ID 和职责由项目场景定义。
- Session 是当前绑定到 lane 的具体 Agent 会话。
- 每个 lane 必须声明职责、当前会话、写入范围和 worklog。
- 需要其他 lane 读取的输出必须登记到 shared context。
- Agent Lanes 不写入 Matter registry，不参与 Matter lifecycle。

## SPEC

完整机制见：

```text
product/core/agent-lanes-spec.md
```
