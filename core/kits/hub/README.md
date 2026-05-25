# 多项目管理中枢 Kit

Preset: `hub`

适合希望建立主库 / 中枢的用户。Hub 是共享资产、项目注册、跨项目路由、回写审核和通用能力草稿的管理层，不是具体项目工作台。

## 包含

- `AGENTS.md`
- `.starwork/workspace.json`
- `.starwork/skills.json`
- `.starwork/handoff/`
- `.starwork/sync.json`
- `.starwork/internal/`
- `.starwork/projects/registry.json`
- `.starwork/coordination/`
- `.starwork/incoming/`
- `identity/`
- `lessons/`
- `knowledge/`
- `skills/`
- `workspace/`

`.starwork/` 是 StarWork 机制运行层。Hub 的 `identity/`、`lessons/`、`knowledge/` 和 `skills/` 是正式共享资产，不进入 `.starwork/`。

## 不包含

- 业务项目的正式事实源
- 卫星项目初始化
- 单项目的当前项目状态和当前工作入口
- `templates/`
- 自媒体、产品经理等业务 Pack

卫星项目创建应由 `starwork spawn` 完成。
