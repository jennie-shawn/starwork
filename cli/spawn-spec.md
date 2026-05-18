# `starwork spawn` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI
- 命令：`starwork spawn`
- 实现状态：v0.1 第一版已实现
- 相关对象：`hub`、`satellite-starter`、`satellite-matter`、`main-repo-sync`、`skill-mount`
- 目标：从多项目管理中枢创建并注册一个卫星项目工作台

## 一句话定义

`starwork spawn` 是从 Hub 生成一个被中枢管理的新项目工作台的命令。

它不是 `init --type hub`，也不是普通单项目初始化。它做的是：在已经存在的多项目管理中枢里，创建一个新的执行型项目工作区，并把它登记回 Hub。

```text
Hub / 多项目中枢
  ↓
spawn
  ↓
Satellite / 具体执行项目
```

## 为什么不能放进 `init`

`init` 的职责是创建当前目录的工作台：

- 轻量单项目
- 长期单项目
- 多项目管理中枢

但 `spawn` 涉及两个工作区：

1. Hub：负责项目注册、共享身份、共享教训、knowledge、skills 和联络机制。
2. Satellite：负责具体项目执行、项目状态、当前工作、事项、产物和事实源。

因此它必须是独立命令，否则 `init` 会变成“创建自己 + 修改另一个工作区”的混合动作，用户也很难理解。

## 用户故事

用户已经有一个多项目中枢：

```bash
starwork init --type hub --target ~/my-hub --yes
```

现在想从这个中枢创建一个新项目：

```bash
starwork spawn \
  --hub ~/my-hub \
  --name "内容产品官网" \
  --target ~/projects/content-site \
  --mode matter \
  --yes
```

命令完成后：

- `~/projects/content-site` 成为一个 StarWork Satellite 工作台。
- Hub 的 `项目/registry.json` 中新增该项目记录。
- Satellite 的 `.core-sync.json` 记录来源 Hub、同步资源和创建时间。
- Satellite 包含来自 Hub 的身份、教训、内部协议、知识和 skills 入口。
- 后续 Agent 可以在 Satellite 内独立工作，项目进度不写回 Hub registry。

## 命令形式

```bash
starwork spawn --hub <hub-path> --name <project-name> --target <path>
starwork spawn --hub ~/my-hub --name "新项目" --target ~/projects/new-project --mode starter
starwork spawn --hub ~/my-hub --name "长期项目" --target ~/projects/long-project --mode matter
starwork spawn --hub ~/my-hub --name "新项目" --target ~/projects/new-project --dry-run
starwork spawn --hub ~/my-hub --name "新项目" --target ~/projects/new-project --yes
```

## 参数

| 参数 | 说明 |
|---|---|
| `--hub <path>` | Hub 工作台路径。必须是 `hub` 或未来兼容 Hub Kit。 |
| `--name <name>` | 卫星项目名称。 |
| `--target <path>` | 卫星项目创建位置。 |
| `--mode <starter|matter>` | 卫星项目模式。默认 `matter`。 |
| `--id <project-id>` | 可选项目 ID；未提供时由名称生成。 |
| `--status <active|paused>` | 初始状态。默认 `active`。 |
| `--dry-run` | 只预览，不写入。 |
| `--yes` | 非交互确认执行。 |
| `--help` | 显示帮助。 |

## Kit 选择

| `--mode` | Kit | 定位 |
|---|---|---|
| `starter` | `satellite-starter` | 接入主库的轻量卫星项目，不启用事项。 |
| `matter` | `satellite-matter` | 接入主库的事项型卫星项目，启用事项和决策。 |

v0.1 默认 `matter`。

原因：卫星项目通常是长期项目，通常需要事项追踪、跨会话接力和过程沉淀。

## 执行流程

### Step 1：定位并检查 Hub

CLI 读取 `--hub`：

- 必须存在 `.starwork/workspace.json`。
- `workspace_type` 必须是 `hub`。
- `kit` 必须是 `hub` 或未来兼容 Hub Kit。
- Hub 中必须存在项目注册表：`项目/registry.json`。
- Hub 中必须存在共享资源入口：`identity/`、`lessons/`、`skills/`、`.incoming/`、`知识/`。

如果 Hub 未通过检查，中止创建。

### Step 2：检查目标目录

CLI 检查 `--target`：

- 不存在：可以创建。
- 存在但为空：可以写入。
- 已是 StarWork 工作台：中止，提示运行 `doctor`。
- 存在用户内容：需要预览冲突；v0.1 建议中止或只允许空目录，避免误伤。

v0.1 推荐保守策略：

> `spawn` 只允许写入不存在或空目录。

### Step 3：选择 Satellite Kit

根据 `--mode` 选择：

- `starter` -> `satellite-starter`
- `matter` -> `satellite-matter`

CLI 复制对应 Kit 到目标目录。

### Step 4：写入 Satellite 元数据

生成 `.starwork/workspace.json`：

```json
{
  "schema": "starwork.workspace.v0.1",
  "core": "0.1",
  "workspace_type": "satellite-matter",
  "kit": "satellite-matter",
  "packs": [],
  "language": "zh",
  "paths": {
    "formal_source": "输出/确认成果/",
    "business_work_area": "事项/"
  },
  "hub": {
    "path": "/Users/example/my-hub",
    "project_id": "content-site"
  },
  "created_by": "starwork spawn"
}
```

`doctor` 已支持：

- `satellite-starter`
- `satellite-matter`

这两类是独立工作区类型，不复用 `single-light` / `single-matter`。

### Step 5：写入 `.core-sync.json`

`.core-sync.json` 记录 Hub 与 Satellite 的同步关系。

建议结构：

```json
{
  "schema": "starwork.core_sync.v0.1",
  "hub_path": "/Users/example/my-hub",
  "project_id": "content-site",
  "project_name": "内容产品官网",
  "core": "0.1",
  "mode": "matter",
  "created_at": "2026-05-18T00:00:00.000Z",
  "last_sync_at": "2026-05-18T00:00:00.000Z",
  "resources": {
    "identity": {
      "source": "identity/",
      "target": "_系统/身份/",
      "mode": "snapshot"
    },
    "lessons": {
      "source": "lessons/",
      "target": "_系统/教训/",
      "mode": "snapshot"
    },
    "knowledge": {
      "source": "知识/",
      "target": "知识/",
      "mode": "readonly-link"
    },
    "skills": {
      "source": "skills/",
      "target": [".agents/skills/", ".claude/skills/"],
      "mode": "symlink"
    }
  }
}
```

### Step 6：同步共享资源

资源语义沿用 `main-repo-sync` capability。

| 资源 | Satellite 落地 | v0.1 行为 |
|---|---|---|
| `identity/` | `_系统/身份/` | 从 Hub 复制快照。 |
| `lessons/` | `_系统/教训/` | 从 Hub 复制快照。 |
| `.internal/` | `.internal/` | 从 Hub 复制稳定协议。 |
| `.obsidian/` | `.obsidian/` | 从 Hub 复制默认配置。 |
| `知识/` | `知识/` | 优先软链接；失败则复制 README 并提示。 |
| `skills/` | `.agents/skills/`、`.claude/skills/` | 创建软链接。 |

默认边界：

- 复制快照的内容可以作为项目参考，但不能自动回写 Hub。
- 软链接资源仍由 Hub 拥有，Satellite 不能直接修改。
- 可复用更新应走 `.incoming/` 或跨项目联络机制。

### Step 7：写入项目状态入口

Satellite 使用：

```text
_系统/上下文/当前项目.md
```

该文件应包含：

- 项目名称
- 项目定位
- Hub 路径
- 项目 ID
- 当前阶段
- 正式事实源位置
- 当前工作入口
- 主库同步说明

不能把 Hub 的 `项目/registry.json` 当成项目进度正文。

### Step 8：注册到 Hub

更新 Hub 的：

```text
项目/registry.json
```

建议新增记录：

```json
{
  "id": "content-site",
  "name": "内容产品官网",
  "path": "/Users/example/projects/content-site",
  "status": "active",
  "core": "0.1",
  "kit": "satellite-matter",
  "mode": "matter",
  "created_at": "2026-05-18T00:00:00.000Z",
  "last_sync_at": "2026-05-18T00:00:00.000Z",
  "sync": {
    "identity": "snapshot",
    "lessons": "snapshot",
    "knowledge": "readonly-link",
    "skills": "symlink"
  }
}
```

Registry 只记录发现、路径、状态和同步元数据，不记录项目进度正文。

### Step 9：生成跨项目联络入口

Satellite Kit 已包含：

```text
_系统/跨项目/
  inbox/
  outbox/
```

v0.1 可以只创建目录和 README。

后续可以扩展为：

- 创建一封 “项目已创建” handoff 给 Hub
- 写入 Hub `项目/联络/`
- 支持 queued / delivered / acknowledged / closed 生命周期

### Step 10：执行 `doctor`

创建完成后，CLI 应自动或建议运行：

```bash
starwork doctor --target <satellite-path>
```

当前实现会在创建完成后提示用户运行 `doctor` 检查新项目工作台。

## 写入安全

`spawn` 会同时写 Hub 和 Satellite，因此安全策略要比 `init` 更严格：

| 场景 | v0.1 行为 |
|---|---|
| Hub 不健康 | 中止。 |
| 目标目录不存在 | 创建。 |
| 目标目录为空 | 写入。 |
| 目标目录有用户内容 | 默认中止。 |
| Hub registry 已有同 ID | 中止，提示更换 ID 或确认复用。 |
| Hub registry 已有同 path | 中止，提示已注册。 |
| 共享资源软链接失败 | v0.1 中止并报告错误；后续再补可解释的降级策略。 |
| 任一关键写入失败 | 中止，并提示已写入内容。后续可设计 rollback。 |

v0.1 不做自动 rollback，但要尽量按顺序降低风险：

1. 先验证 Hub 和目标目录。
2. 先生成完整写入计划。
3. 用户确认后写 Satellite。
4. Satellite 写入成功后再更新 Hub registry。

## 与现有命令的关系

### 与 `init`

- `init --type hub` 创建 Hub。
- `spawn` 从 Hub 创建 Satellite。

两者不能混成一个命令。

### 与 `doctor`

- 创建前检查 Hub。
- 创建后检查 Satellite。
- `doctor` 需要新增 Satellite 工作区类型支持。

### 与 `adapt`

Satellite Kit 当前已经包含 `CLAUDE.md`，但 `adapt` 仍可用于重新生成 / 补充其他 Agent 入口。

建议流程：

```bash
starwork spawn ...
starwork doctor --target <satellite>
starwork adapt all --target <satellite> --yes
```

### 与 `pack install`

`spawn` 时先不装业务 Pack，只创建通用执行工作区。

后续用户可以：

```bash
starwork pack install content-creator --target <satellite> --yes
```

后续如果支持 `--pack`，它应复用 `pack install` 的逻辑，而不是在 `spawn` 中重写一套 Pack 安装器。

## v0.1 不做什么

- 不创建 Hub；Hub 必须已经存在。
- 不自动发现所有 Hub。
- 不处理远程仓库、GitHub、云同步。
- 不做复杂权限系统。
- 不做跨机器同步。
- 不做自动 rollback。
- 不把项目进度写入 Hub registry。
- 不让卫星项目直接改 Hub 的共享事实源。
- 不处理 Pack 卸载、升级或迁移。

## 最小实现范围

第一版实现范围：

1. 支持 `starwork spawn` 命令。
2. 支持 `--hub`、`--name`、`--target`、`--mode`、`--id`、`--dry-run`、`--yes`。
3. 检查 Hub 是否为健康 `hub` 工作台。
4. 只允许写入不存在或空目标目录。
5. 根据 mode 复制 `satellite-starter` 或 `satellite-matter` Kit。
6. 写入 Satellite `.starwork/workspace.json`。
7. 写入 `.core-sync.json`。
8. 复制 identity / lessons / .internal / .obsidian 快照。
9. 创建 knowledge 和 skills 链接；失败时中止并报告错误。
10. 更新 Hub `项目/registry.json`。
11. 补充 `doctor` 对 Satellite 工作区类型的识别。
12. 增加测试：创建 starter satellite、创建 matter satellite、registry 重复 ID 拒绝、非 Hub 拒绝。

## 验收标准

`starwork spawn` 可验收，至少满足：

- 能从 `hub` 创建 `satellite-starter`。
- 能从 `hub` 创建 `satellite-matter`。
- 创建后 Satellite 通过 `starwork doctor`。
- Hub `项目/registry.json` 出现项目记录。
- `.core-sync.json` 记录 Hub 路径、项目 ID、同步资源。
- 已存在同 ID 时拒绝创建。
- 目标目录已有用户内容时默认拒绝写入。
- 不支持从普通单项目工作台创建 Satellite。

## 后续问题

1. 是否兼容 `knowledge/` 英文路径链接。
2. skills 软链接是否默认挂载全部 skills，还是只挂载指定列表。
3. 创建项目时是否允许直接安装业务 Pack。
4. 是否需要在 Hub `项目/联络/` 自动生成项目创建 handoff。
5. 软链接失败时是否提供复制降级策略。
