# StarWork Skill 管理与分发机制 SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Core / CLI / Skills
- 相关能力：`skill-mount`、`main-repo-sync`、Pack 安装、Hub + Satellite
- 相关 CLI：`init`、`spawn`、`doctor`、`upgrade`、`pack install`、`adapt`
- 目标：定义 StarWork 如何管理 Agent Skill 的来源、安装位置、分发关系、项目挂载和健康检查。

## 一句话定义

StarWork 的 Skill 机制不是一个简单的安装动作，而是一套 Agent 能力分发协议。

它回答五个问题：

1. 这个 Skill 从哪里来？
2. 它应该放在哪里？
3. 谁拥有它，谁只能使用它？
4. 初始化、生成卫星项目、升级旧项目时要不要带上它？
5. 后续如何检查、同步和更新？

## 背景

当前 StarWork 已经有几类不同性质的 Skill：

- `starworkInit`、`starworkDoctor`、`starworkUpgrade`：帮助 Agent 理解并调用 StarWork CLI。
- `starworkSpawn`：帮助 Hub 生成卫星项目定制单。
- `matter-workspace`、`neat-freak`：用户可能长期使用的通用工作流 Skill。
- 未来内容创作者 Pack、课程 Pack、客户交付 Pack 可能会附带自己的业务 Skill。

如果只用一个笼统的“安装 Skill”概念，会出现混乱：

- 系统 Skill 不应该被复制到每个项目。
- Hub 管理 Skill 不一定要全局安装。
- Hub 的共享 Skill 不应该无差别挂载给所有卫星项目。
- Pack 推荐 Skill 不能静默安装到用户项目里。
- 旧项目升级时，需要由 AI 判断哪些 Skill 适合补入，而不是 CLI 硬编码猜测。

因此 v0.1 需要先冻结管理模型，再逐步改 CLI。

## 核心原则

1. Skill 分发必须可解释：用户能知道某个 Skill 为什么在这里。
2. Skill 所有权必须清楚：Hub 拥有的 Skill，Satellite 默认只挂载使用，不直接修改。
3. CLI 只做确定性动作：选择、判断、定制方案由 Skill + 用户确认完成。
4. Hub 不默认把全部 Skill 分发给全部项目。
5. Pack 可以推荐 Skill，但不能强制静默安装非必需 Skill。
6. `doctor --json` 只暴露事实，不输出建议，避免影响 AI 判断。
7. 全局安装、Hub 挂载、项目本地复制要分开记录。

## Skill 分类

| 类型 | 示例 | 主要位置 | 作用 | 是否默认进项目 |
|---|---|---|---|---|
| 系统 Skill | `starworkInit`、`starworkDoctor`、`starworkUpgrade` | 用户全局 Agent Skill 环境 | 让 Agent 会操作 StarWork | 否 |
| Hub 管理 Skill | `starworkSpawn`、未来 Hub 分发助手 | Hub `skills/` | 管理 Hub、生成卫星项目、维护注册表 | 只在 Hub 中默认可用 |
| Hub 常用 Skill | `neat-freak`、用户自定义整理 Skill | Hub `skills/` | 用户跨项目复用的能力库 | 按规则或用户选择分发 |
| Pack 业务 Skill | 内容创作者审稿、发布检查等 | Pack 或 Hub | 配合某个场景 Pack 使用 | 用户确认后分发 |
| 项目本地 Skill | 某项目专用工作流 | Satellite 或单项目 `.agents/skills/` | 只服务当前项目 | 是，本项目拥有 |

## 存放位置

### 1. 全局 Agent Skill 环境

用于安装 StarWork 系统 Skill。

典型安装方式：

```bash
npx skills add ...
```

StarWork 只把它视为“Agent 已学会 StarWork 操作方式”，不把这些 Skill 复制进工作区。

### 2. Hub Skill 库

Hub 使用固定目录：

```text
skills/
  registry.json
  starworkSpawn/
  neat-freak/
  user-custom-skill/
```

`skills/registry.json` 是 Hub 的 Skill 注册表。

Hub registry 负责记录：

- Hub 拥有哪些 Skill。
- 每个 Skill 的来源、版本和所有权。
- 适用场景和标签。
- 是否默认推荐给新卫星项目。
- 分发方式是 symlink、copy 还是 manual。

### 3. Satellite / 单项目 Skill 挂载区

项目内使用 Agent 约定路径：

```text
.agents/skills/
.claude/skills/
.starwork/skills.json
```

其中：

- `.agents/skills/`：通用 Agent Skill 挂载入口。
- `.claude/skills/`：Claude Code Skill 挂载入口。
- `.starwork/skills.json`：本项目实际可用 Skill 清单。

Satellite 从 Hub 分发 Skill 时，默认使用逐个 Skill 软链接：

```text
.agents/skills/neat-freak -> /path/to/hub/skills/neat-freak
.claude/skills/neat-freak -> /path/to/hub/skills/neat-freak
```

不推荐再把整个 Hub `skills/` 目录整体挂载到项目里，因为那会让项目获得过多无关能力，也无法解释每个 Skill 为什么出现。

### 4. Pack Skill 声明

Pack 可以在 `pack.json` 中声明推荐 Skill。

建议结构：

```json
{
  "skills": {
    "recommended": [
      {
        "id": "content-draft-review",
        "reason": "用于审阅内容草稿和发布前检查",
        "default": false,
        "distribution": "copy",
        "source": "skills/content-draft-review"
      }
    ],
    "required": []
  }
}
```

v0.1 不建议引入真正的 required Skill。除非没有该 Skill，Pack 就无法工作，否则都应作为 recommended。

## Hub `skills/registry.json`

### 最小示例

```json
{
  "schema": "starwork.skill_registry.v0.1",
  "owner": "hub",
  "updated_at": "2026-05-20T00:00:00.000Z",
  "skills": [
    {
      "id": "starworkSpawn",
      "name": "StarWork Spawn",
      "type": "hub-management",
      "source": {
        "kind": "starwork-package",
        "package": "@jennie-shawn/starwork",
        "path": "product/skills/starworkSpawn"
      },
      "version": "0.1.0-alpha.6",
      "ownership": "hub-owned",
      "distribution": {
        "mode": "hub-only",
        "default_for_spawn": false
      },
      "tags": ["hub", "spawn", "blueprint"],
      "description": "帮助 Hub 为卫星项目生成定制化创建蓝图。"
    },
    {
      "id": "neat-freak",
      "name": "Neat Freak",
      "type": "common",
      "source": {
        "kind": "external",
        "path": "/Users/example/.skillshub/neat-freak"
      },
      "version": null,
      "ownership": "hub-owned",
      "distribution": {
        "mode": "symlink",
        "default_for_spawn": false
      },
      "tags": ["cleanup", "review", "archive"],
      "description": "用于项目收尾、知识整理和文档一致性检查。"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|---|---:|---|
| `schema` | 是 | 固定为 `starwork.skill_registry.v0.1`。 |
| `owner` | 是 | v0.1 主要为 `hub`。 |
| `updated_at` | 是 | 注册表最后更新时间。 |
| `skills[].id` | 是 | Skill 稳定 ID。 |
| `skills[].type` | 是 | `system`、`hub-management`、`common`、`pack-business`、`project-local`。 |
| `skills[].source.kind` | 是 | `starwork-package`、`external`、`local`、`pack`、`generated`。 |
| `skills[].ownership` | 是 | `hub-owned`、`project-owned`、`global-reference`、`pack-owned`。 |
| `skills[].distribution.mode` | 是 | `hub-only`、`symlink`、`copy`、`manual`。 |
| `skills[].distribution.default_for_spawn` | 否 | 创建卫星项目时是否默认推荐。 |
| `skills[].tags` | 否 | 用于 spawn / upgrade 时按场景筛选。 |

## 项目 `.starwork/skills.json`

### 最小示例

```json
{
  "schema": "starwork.project_skills.v0.1",
  "updated_at": "2026-05-20T00:00:00.000Z",
  "skills": [
    {
      "id": "neat-freak",
      "type": "common",
      "source": {
        "kind": "hub",
        "hub_path": "/Users/example/my-hub",
        "registry_id": "neat-freak"
      },
      "mounts": [
        {
          "agent": "codex",
          "path": ".agents/skills/neat-freak",
          "mode": "symlink"
        },
        {
          "agent": "claude",
          "path": ".claude/skills/neat-freak",
          "mode": "symlink"
        }
      ],
      "reason": "用户在 spawn 时选择：该项目需要定期整理和归档。",
      "installed_by": "starwork spawn",
      "installed_at": "2026-05-20T00:00:00.000Z"
    }
  ]
}
```

项目清单回答的是：

> 当前项目到底有哪些 Skill 可用，它们为什么在这里。

它不替代 Hub registry。

## 分发模式

| 模式 | 适用对象 | 行为 |
|---|---|---|
| `global-reference` | 系统 Skill | 只提示用户全局安装，不写入项目。 |
| `hub-only` | Hub 管理 Skill | 放在 Hub `skills/`，不分发到 Satellite。 |
| `symlink` | Hub 常用 Skill | Satellite 中逐个创建软链接。 |
| `copy` | Pack 业务 Skill、项目专用 Skill | 复制到项目本地，项目拥有副本。 |
| `manual` | 外部或未标准化 Skill | 只记录建议，由用户或 Agent 手动处理。 |

默认推荐：

- Hub 到 Satellite：优先 `symlink`。
- Pack 到项目：优先 `copy`。
- 系统 Skill：优先 `global-reference`。

## CLI 配合修改

### `starwork init`

`init` 需要新增 Skill 初始化阶段。

#### 创建 Hub 时

执行流程应调整为：

1. 创建 Hub Kit。
2. 安装 `hub-management` Pack。
3. 初始化 `skills/registry.json`。
4. 将 Hub 必需管理 Skill 写入 Hub registry。
5. 将 `starworkSpawn` 放入 Hub `skills/`，或记录为可安装的 Hub 管理 Skill。
6. 询问用户是否导入常用 Skill，例如 `neat-freak`。

Hub 创建完成后，至少应存在：

```text
skills/
  README.md
  registry.json
```

是否默认放入 `starworkSpawn/`，取决于发布包是否能稳定提供该 Skill 源文件。

#### 创建单项目时

执行流程应调整为：

1. 选择工作区类型。
2. 选择语言。
3. 选择 Pack。
4. 询问是否需要放入推荐 Skill。
5. 写入 `.starwork/skills.json`。
6. 按用户确认挂载或复制 Skill。

v0.1 可以先只支持：

- `--no-skills`：跳过 Skill 安装。
- `--skills <id,id>`：显式安装指定 Skill。

交互模式下，应把 Skill 步骤放在 Pack 之后，因为 Pack 会影响推荐 Skill。

### `starwork spawn`

`spawn` 是 Skill 分发机制的核心命令，需要调整最大。

当前逻辑是把 Hub `skills/` 整体软链接到 Satellite：

```text
.agents/skills -> hub/skills
.claude/skills -> hub/skills
```

后续应改为：

1. 读取 Hub `skills/registry.json`。
2. 根据 blueprint / Pack / 用户选择确定本项目 Skill 列表。
3. 创建 `.agents/skills/` 和 `.claude/skills/` 目录。
4. 对每个被选择的 Skill 单独创建链接或复制。
5. 写入 Satellite `.starwork/skills.json`。
6. 在 `.core-sync.json` 中记录被挂载的 Skill 清单。

`spawn blueprint` 需要新增字段：

```json
{
  "skills": [
    {
      "id": "neat-freak",
      "source": "hub",
      "distribution": "symlink",
      "reason": "长期项目，需要阶段性清理和归档。"
    }
  ]
}
```

如果 blueprint 没有声明 `skills`，CLI 可以使用 Hub registry 中 `default_for_spawn=true` 的 Skill 作为候选，但仍应在 dry-run 中展示。

### `starwork doctor`

`doctor` 需要增加 Skill 事实探测，但不能给建议。

新增检查：

- Hub 是否存在 `skills/registry.json`。
- Hub registry schema 是否正确。
- registry 中声明的 Skill 路径是否存在。
- Satellite 是否存在 `.starwork/skills.json`。
- `.starwork/skills.json` 中的挂载路径是否存在。
- 软链接是否指向 Hub 中对应 Skill。
- `.core-sync.json` 中的 skills 记录是否和项目 skill manifest 一致。

JSON 输出建议新增：

```json
{
  "skills": {
    "registry": {
      "exists": true,
      "path": "skills/registry.json",
      "count": 3
    },
    "project_manifest": {
      "exists": true,
      "path": ".starwork/skills.json",
      "count": 2
    },
    "mounts": [
      {
        "id": "neat-freak",
        "path": ".agents/skills/neat-freak",
        "mode": "symlink",
        "status": "ok"
      }
    ]
  }
}
```

注意：这里仍然只输出事实，不输出“你应该安装某 Skill”。

### `starwork upgrade`

`upgrade` 需要支持由 `starworkUpgrade` 生成的 Skill 安装动作。

`upgrade blueprint` 可新增 actions：

```json
{
  "type": "write_project_skills_manifest"
}
```

```json
{
  "type": "mount_skill",
  "id": "neat-freak",
  "from": "/Users/example/my-hub/skills/neat-freak",
  "targets": [".agents/skills/neat-freak", ".claude/skills/neat-freak"],
  "mode": "symlink",
  "reason": "用户确认该旧项目需要整理归档能力。"
}
```

```json
{
  "type": "copy_skill",
  "id": "content-draft-review",
  "from": "skills/content-draft-review",
  "to": ".agents/skills/content-draft-review",
  "reason": "来自内容创作者 Pack 的项目本地业务 Skill。"
}
```

CLI 仍不判断该不该安装某个 Skill，只执行已确认 blueprint。

### `starwork pack install`

Pack 安装需要读取 Pack 的 `skills` 声明。

执行逻辑：

1. 读取 `pack.json`。
2. 如果 Pack 声明 recommended Skill，展示给用户。
3. 用户确认后复制或挂载对应 Skill。
4. 更新 `.starwork/skills.json`。
5. 更新 `.starwork/workspace.json` 的 Pack 记录。

v0.1 可以先只实现“声明和 dry-run 展示”，实际安装放到后续版本。

### `starwork adapt`

`adapt` 不决定安装哪些 Skill，但需要确保目标 Agent 的 Skill 入口可用。

例如：

- Codex：`.agents/skills/`
- Claude Code：`.claude/skills/`

如果项目已经有 `.starwork/skills.json`，`adapt` 可以检查对应 agent 的 mount 是否缺失，并在 dry-run 中展示会补哪些入口。

### 未来候选：`starwork skill`

当 Skill 机制稳定后，可以新增独立命令：

```bash
starwork skill list --target ./workspace
starwork skill add neat-freak --target ./workspace --from-hub ./hub
starwork skill remove neat-freak --target ./workspace
starwork skill sync --target ./workspace
```

v0.1 不必立即实现。当前更重要的是让 `init`、`spawn`、`doctor`、`upgrade`、`pack install` 的数据结构先统一。

## Skill 与 Pack 的边界

Pack 是场景结构和规则包。

Skill 是 Agent 工作流能力。

Pack 可以声明推荐 Skill，但不应该把所有业务逻辑都塞进 Skill。判断方式：

| 问题 | 应放 Pack | 应放 Skill |
|---|---:|---:|
| 目录结构、模板、路径默认值 | 是 | 否 |
| Agent 需要如何采访用户 | 否 | 是 |
| Agent 如何生成 blueprint | 否 | 是 |
| 场景规则和边界 | 是 | 可辅助 |
| 自动检查、审稿、归档、复盘流程 | 否 | 是 |

## Skill 与 CLI 的边界

Skill 负责判断和生成方案。

CLI 负责执行和校验。

| 阶段 | Skill | CLI |
|---|---|---|
| 理解用户需求 | 是 | 否 |
| 判断当前目录语义 | 是，基于 doctor 事实 | 否 |
| 生成 blueprint | 是 | 否 |
| 校验 schema | 可辅助 | 是 |
| 写入文件 / 创建软链接 | 否 | 是 |
| dry-run 展示 | 否 | 是 |
| 维护 manifest | 否 | 是 |

## 安全规则

1. 不允许 Skill 分发路径逃出目标工作区，除非是明确的 symlink source。
2. 不允许覆盖已有本地 Skill，除非用户显式确认。
3. 不允许 Satellite 修改 Hub 软链接指向的 Skill。
4. 不允许 Pack 静默安装外部 Skill。
5. 不允许 `doctor` 输出建议性 next step。
6. 所有分发动作必须写入 `.starwork/skills.json`。
7. 所有 Hub 到 Satellite 的分发必须能追溯到 Hub registry。

## 最小落地顺序

建议分四步落地：

1. 冻结文档和 schema：本 SPEC、`skill-mount` capability、CLI SPEC 更新。
2. 改 `init --type hub`：创建 `skills/registry.json`，登记 Hub 管理 Skill。
3. 改 `spawn`：从整体挂载 Hub `skills/` 改为按 registry 逐个分发。
4. 改 `doctor`：输出 Skill registry、manifest、mount 的事实检查。

之后再扩展：

5. `upgrade` 支持 Skill actions。
6. `pack install` 支持 Pack recommended Skill。
7. 新增 `starwork skill` 子命令。

## 待确认问题

1. `starworkSpawn` 是否在创建 Hub 时直接复制进 Hub `skills/`，还是只写入 registry 并提示用户安装？
2. Hub registry 是否允许登记全局 Skill 的引用路径，还是必须先复制进 Hub？
3. Pack 业务 Skill 初期是否随 npm 包发布，还是允许用户从 GitHub / 本地路径导入？
4. `.agents/skills/` 是否作为所有 Agent 的通用入口长期保留？
5. `npx skills add` 的目标目录和 StarWork 项目内 Skill 目录之间是否需要一个桥接命令？
