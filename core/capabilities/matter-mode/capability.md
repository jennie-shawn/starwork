# Capability: matter-mode v0.1

Matter Mode 是用于长期工作追踪的模式。

## 新增

```text
matters/registry.md
matters/<matter-id>/
```

## 事项结构

```text
matters/<matter-id>/
├── README.md
├── progress.md
├── notes.md
├── drafts/
└── handoff.md
```

## 规则

- `matters/registry.md` 是索引，不是进度日志。
- 单个 matter 目录是过程工作区，不是最终事实源。
- 成熟草稿必须晋升到项目正式事实源。
- 创建、暂停和归档 matter 应由事项维护规则或 skill 处理。

## Skill 要求

Matter Mode 应配套 `matter-workspace` 使用。

在当前主库中，参考 skill 位于：

```text
/Users/shuxinding/digital-twin-core/skills/matter-workspace/
```

当 CLI 支持 Matter Mode 时，应安装或软链接该 skill，而不是复制成一个独立分叉。
