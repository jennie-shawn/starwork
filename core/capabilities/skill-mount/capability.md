# Capability: skill-mount v0.1

`skill-mount` 描述主库共享 skills 如何提供给卫星项目使用。

## 规则

共享 skills 应通过软链接挂载，而不是复制成项目内独立分叉。

典型挂载方式：

```text
.agents/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
.claude/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
```

## 边界

- 共享 skills 仍然由主库拥有。
- 项目专用 skill 修改必须放在项目专用 skill 路径中。
- 卫星项目不能把软链接的共享 skill 当成本地项目代码来改。

## CLI 职责

CLI 应通过创建软链接安装共享 skills，并把挂载信息记录到 `.core-sync.json`。
