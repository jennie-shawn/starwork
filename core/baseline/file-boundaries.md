# File Boundaries v0.1

## 必需基线文件

| 文件角色 | 应该写这里 | 不应该写这里 |
|---|---|---|
| `agent.entry_rules` | Agent 在这个工作区应该如何工作。 | 项目状态、任务历史、草稿正文。 |
| `system.context.project_status` | 目标、阶段、重点、风险、正式事实源位置。 | 单次会话笔记、草稿正文、详细事项进度。 |
| `system.tasks.current_work` | 当前任务、活跃事项、阻塞点、等待确认的问题。 | 长期背景、完整设计稿、项目历史。 |

## 可选能力文件

| 能力 | 边界 |
|---|---|
| `decisions` | 只记录会影响后续工作的高影响、已确认决策。 |
| `starter-outputs` | `references/` 是只读原始资料；`outputs/drafts/` 是未确认 AI 草稿；`outputs/final/` 是用户确认成果。 |
| `local-identity` | 项目本地身份参考，只能在用户确认后修改。 |
| `local-lessons` | 项目本地可复用教训，不是普通复盘流水。 |
| `main-repo-sync` | Hub 资源通过快照、只读链接、`.starwork/sync.json`、legacy `.core-sync.json` 和审核队列进入卫星项目；Hub registry 不存项目进度正文。 |
| `skill-mount` | 共享 skills 从主库软链接挂载，不复制成独立分叉；项目实际挂载清单写入 `.starwork/skills.json`。 |
| `agent-lanes` | Lane 的职责、共享索引、worklog 和过程材料属于项目协作内容；session binding 等机器状态可以进入 `.starwork/agent-lanes/`。 |

## 正式事实源规则

每个工作区都必须声明正式事实源放在哪里。Core 不要求该目录一定叫 `product/`。

## `.starwork/` 边界

`.starwork/` 是 StarWork 机制运行层，只存放 StarWork 机制下才需要的状态、索引、manifest、队列、安装记录、缓存和报告。

当前项目的业务事实、事项过程、正式产物、草稿、知识、身份、教训和协作内容，不因为由 StarWork 创建、检查或被 Agent 读取，就进入 `.starwork/`。

详细规则见：[StarWork Runtime Layer SPEC](../starwork-runtime-layer-spec.md)。
