# Core Roles v0.1

## 标准角色

| 标准角色 | 是否必需 | 说明 |
|---|---:|---|
| `agent.entry_rules` | 是 | 所有 Agent 进入项目时必须读取的工作规则。 |
| `system.context.project_status` | 是 | 变化较慢的项目状态。 |
| `system.tasks.current_work` | 是 | 当前工作、阻塞点和下一次交接入口。 |
| `system.context.decisions` | 否 | 高影响决策记录。 |
| `work.starter.references` | 否 | Starter Mode 中默认只读的原始资料。 |
| `work.starter.outputs_drafts` | 否 | 等待用户审阅的 AI 草稿。 |
| `work.starter.outputs_final` | 否 | 用户确认后的成果。 |
| `work.matters.registry` | 否 | Matter Mode 的事项索引。 |
| `identity.local` | 否 | 项目本地身份参考。 |
| `lessons.local` | 否 | 项目本地可复用教训。 |
| `main_repo.sync_metadata` | 否 | 卫星项目与主库同步的元数据。 |
| `main_repo.knowledge_link` | 否 | 只读共享知识链接。 |
| `main_repo.internal_protocols` | 否 | 从主库复制的内部协议快照。 |
| `main_repo.skill_mounts` | 否 | 通过软链接挂载的共享 skills。 |

## 规则

Profiles 负责把标准角色映射到具体路径。Capabilities 可以要求或推荐额外角色，但不能改变 baseline 角色的含义。

`system.context.project_status` 刻意使用角色名，而不是绑定单一文件名。Preset 可以把它映射到 `project-status.md`、`current-projects.md` 或其他声明文件，但一个工作区只能有一个项目状态事实源。
