# Capability: skill-mount v0.1

`skill-mount` 描述主库共享 skills 如何提供给卫星项目使用。

完整管理与分发协议见：`product/core/skill-management-spec.md`。

## 规则

共享 skills 应通过逐个软链接挂载，而不是复制成项目内独立分叉，也不应把 Hub 的整个 `skills/` 目录无差别挂载给所有卫星项目。

典型挂载方式：

```text
.agents/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
.claude/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
```

项目内应同时写入：

```text
.starwork/skills.json
```

用于记录本项目实际可用的 Skill、来源、挂载方式和放入原因。

## 边界

- 共享 skills 仍然由主库拥有。
- 项目专用 skill 修改必须放在项目专用 skill 路径中。
- 卫星项目不能把软链接的共享 skill 当成本地项目代码来改。
- Kit manifest、Pack 声明和 Hub 的 `skills/registry.json` 共同构成分发来源；Satellite 的 `.starwork/skills.json` 是项目已挂载清单。

## CLI 职责

CLI 应通过创建逐个软链接安装共享 skills，并把挂载信息记录到 `.core-sync.json` 和 `.starwork/skills.json`。
