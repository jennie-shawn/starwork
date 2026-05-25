# `starwork repair` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI / StarWork Skills
- 命令：`starwork repair`
- 实现状态：待实现
- 相关对象：`starwork audit`、`starworkAudit`、repair blueprint、Hub、Satellite
- 目标：按用户确认过的 repair blueprint，修复已经是 StarWork 工作台的 Hub / Satellite 结构、同步、registry 和规则问题

## 一句话定义

`starwork repair` 是 StarWork 已有工作台的修复蓝图执行器。

它不负责判断要怎么修，也不负责把历史模板升级成 StarWork。它只执行 `starworkAudit` 生成并经用户确认的修复蓝图。

```text
starwork audit --json
  ↓
starworkAudit skill 解释和生成 repair blueprint
  ↓
starwork repair --blueprint repair-blueprint.json --dry-run
  ↓
starwork repair --blueprint repair-blueprint.json --yes
  ↓
starwork audit 再巡检
```

## 和 `upgrade` 的边界

| 命令 | 面向对象 | 核心问题 | 是否要求已有 `.starwork/workspace.json` |
|---|---|---|---:|
| `upgrade` | 历史模板、非标准目录、旧工作区 | 如何进入 StarWork | 否 |
| `repair` | 已经是 StarWork 的 Hub / Satellite | 如何修复 StarWork 内部不一致 | 是 |

一句话：

> `upgrade` 处理“还不是 StarWork”；`repair` 处理“已经是 StarWork，但有些结构或同步关系坏了”。

## 命令形式

```bash
starwork repair --blueprint <repair-blueprint.json> --dry-run
starwork repair --blueprint <repair-blueprint.json> --yes
starwork repair --blueprint <repair-blueprint.json> --json --dry-run
```

## 参数

| 参数 | 说明 |
|---|---|
| `--blueprint <path>` | `starworkAudit` skill 生成的修复蓝图。v0.1 必填。 |
| `--dry-run` | 只展示执行计划，不写入。 |
| `--yes` | 按 blueprint 执行写入。非交互环境必填。 |
| `--json` | 输出机器可读计划或执行结果。 |
| `--help` | 显示帮助。 |

v0.1 不支持：

- 不带 blueprint 的自动修复。
- 删除用户文件。
- 移动用户目录。
- 覆盖正式成果。
- 自动归档项目。
- 自动合并 `.incoming/`。
- 自动改写项目正文内容。

## 修复原则

1. 只执行蓝图，不做主观判断。
2. 默认不覆盖用户文件。
3. 只允许修改 StarWork 管理文件、空缺目录、同步元数据和明确声明的规则插槽。
4. 所有路径必须经过安全校验，不允许 `..`、绝对路径逃逸或写到目标工作区之外。
5. 对 Hub 和 Satellite 的写入必须分别声明，避免误把 Hub 动作写进项目。
6. 每次执行后建议重新运行 `starwork audit`。

## `repair-blueprint.json`

### 推荐存放位置

`repair-blueprint.json` 是 StarWork 巡检 / 修复过程材料，不是 Hub 或 Satellite 的业务文档。

推荐由 `starworkAudit` 生成到 Hub 机制目录：

```text
<hub>/.starwork/audit-runs/<YYYY-MM-DD-or-run-id>/
├── audit-result.json
├── repair-blueprint.json
└── rules/
```

不应放入：

- Hub `workspace/`
- Satellite `workspace/`
- `输出/`、`outputs/`
- `知识/`、`knowledge/`
- `参考资料/`、`references/`
- 项目正式成果目录

默认不需要生成 `.mjs`、`.js`、`.sh` 等脚本型中间产物。CLI 的修复入口是 `starwork repair --blueprint`，不是执行临时脚本。

### 最小示例

```json
{
  "schema": "starwork.repair_blueprint.v0.1",
  "generated_by": "starworkAudit",
  "source": {
    "audit_schema": "starwork.audit.result.v0.1",
    "hub": "/Users/example/my-hub",
    "generated_at": "2026-05-25T00:00:00.000Z"
  },
  "scope": {
    "hub": true,
    "projects": ["content-site"]
  },
  "actions": [
    {
      "type": "ensure_dir",
      "target": "satellite",
      "project_id": "content-site",
      "path": ".starwork/handoff/inbox"
    },
    {
      "type": "write_file_if_missing",
      "target": "satellite",
      "project_id": "content-site",
      "path": ".starwork/handoff/state.json",
      "content": "{\n  \"schema\": \"starwork.handoff.state.v0.1\",\n  \"queues\": {}\n}\n"
    },
    {
      "type": "rewrite_core_sync",
      "project_id": "content-site"
    },
    {
      "type": "inject_agent_rules",
      "target": "satellite",
      "project_id": "content-site",
      "file": "AGENTS.md",
      "from": "rules/satellite-handoff.md",
      "slot": "repair.satellite_handoff"
    }
  ],
  "verification": {
    "run_audit_after": true
  },
  "notes": [
    "本蓝图只补齐 StarWork 管理结构，不移动项目内容。"
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|---|---:|---|
| `schema` | 是 | 固定为 `starwork.repair_blueprint.v0.1`。 |
| `generated_by` | 是 | 通常为 `starworkAudit`。 |
| `source.audit_schema` | 是 | 来源 audit 结果 schema。 |
| `source.hub` | 是 | Hub 根路径。 |
| `scope.hub` | 否 | 是否允许修复 Hub 本身。 |
| `scope.projects` | 否 | 允许修复的项目 ID 列表。 |
| `actions` | 是 | 修复动作列表。 |
| `verification.run_audit_after` | 否 | 执行后是否提示再次 audit。 |
| `notes` | 否 | 给用户看的解释。 |

## Action 类型

### `ensure_dir`

确保目录存在。

```json
{
  "type": "ensure_dir",
  "target": "satellite",
  "project_id": "content-site",
  "path": ".starwork/handoff/inbox"
}
```

### `write_file_if_missing`

仅在目标文件不存在时写入。

```json
{
  "type": "write_file_if_missing",
  "target": "hub",
  "path": ".starwork/handoff/state.json",
  "content": "{}\n"
}
```

如果文件已存在，默认跳过并记录。

### `update_workspace_state`

更新 `.starwork/workspace.json` 中的 StarWork 管理字段。

```json
{
  "type": "update_workspace_state",
  "target": "satellite",
  "project_id": "content-site",
  "patch": {
    "hub.project_id": "content-site"
  }
}
```

v0.1 只允许更新白名单字段：

- `hub.path`
- `hub.project_id`
- `paths.formal_source`
- `paths.business_work_area`
- `language`
- `skills`
- `repair`

### `rewrite_core_sync`

重写或补齐 Satellite 的 `.core-sync.json`。

```json
{
  "type": "rewrite_core_sync",
  "project_id": "content-site"
}
```

CLI 根据 Hub 路径、registry 记录和 Satellite language 生成同步元数据。

### `update_hub_registry`

更新 `projects/registry.json` 中指定项目的安全字段。

```json
{
  "type": "update_hub_registry",
  "project_id": "content-site",
  "patch": {
    "path": "/Users/example/projects/content-site",
    "status": "active"
  }
}
```

v0.1 允许字段：

- `path`
- `status`
- `name`
- `updated_at`
- `metadata`

不允许删除项目记录。

### `repair_symlink`

修复共享资源软链接。

```json
{
  "type": "repair_symlink",
  "target": "satellite",
  "project_id": "content-site",
  "path": "知识",
  "source": "/Users/example/my-hub/knowledge"
}
```

如果目标已存在且不是空目录或断链，v0.1 默认中止该 action。

### `inject_agent_rules`

向 `AGENTS.md` 或适配文件中的受控插槽写入规则。

```json
{
  "type": "inject_agent_rules",
  "target": "satellite",
  "project_id": "content-site",
  "file": "AGENTS.md",
  "from": "rules/satellite-handoff.md",
  "slot": "repair.satellite_handoff"
}
```

插槽格式沿用现有 upgrade / spawn 注入机制。

## Target 规则

| `target` | 写入位置 |
|---|---|
| `hub` | `source.hub` 指向的 Hub 工作台。 |
| `satellite` | `project_id` 对应的 Satellite。 |

所有 `satellite` action 必须带 `project_id`。

## 安全校验

执行前必须检查：

- blueprint schema 正确。
- `source.hub` 存在且是 Hub。
- `scope.projects` 中的项目都存在于 registry。
- Satellite 路径存在且是 StarWork 工作台。
- action path 是安全相对路径。
- action 目标没有逃逸 Hub 或 Satellite。
- 写文件 action 不覆盖用户已有内容，除非 action 类型明确允许。

## 输出

dry-run 输出：

```text
StarWork repair dry run

Hub: /Users/example/my-hub
Actions:
- ensure_dir satellite:content-site .starwork/handoff/inbox
- write_file_if_missing satellite:content-site .starwork/handoff/state.json
- rewrite_core_sync satellite:content-site

No files were written.
```

JSON 输出：

```json
{
  "schema": "starwork.repair.result.v0.1",
  "dry_run": true,
  "hub": "/Users/example/my-hub",
  "summary": {
    "actions_total": 3,
    "planned": 3,
    "applied": 0,
    "skipped": 0,
    "failed": 0
  },
  "actions": []
}
```

## 验收测试

第一版至少覆盖：

1. `repair --dry-run` 不写文件。
2. `repair` 可以补齐 Satellite `.starwork/handoff/`。
3. `repair` 可以补齐 `.core-sync.json`。
4. `repair` 可以更新 Hub registry 的 path。
5. `repair` 拒绝不存在的 Hub。
6. `repair` 拒绝不存在的 project_id。
7. `repair` 拒绝 unsafe path。
8. `repair` 不覆盖已有用户文件。
