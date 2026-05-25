# `starwork spawn --blueprint` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI / StarWork Skills
- 相关命令：`starwork spawn`
- 实现状态：v0.1 第一版已实现
- 相关对象：`satellite-starter`、`project`、Pack、Hub、工作台定制单
- 目标：让 AI 可以根据用户需求生成可检查、可预览、可执行的卫星项目定制方案

## 一句话定义

工作台定制单是 `starwork spawn` 的一次性配置文件。

它告诉 CLI：

- 这次从哪个基础 Kit 生成项目
- 哪些目录要保留、改名、新增或隐藏
- 哪些路径要写入 `.starwork/workspace.json`
- 哪些项目规则要注入 Agent 入口文件
- 哪些初始化文件要创建

```text
用户想法
  ↓
starworkSpawn skill
  ↓
工作台定制单 JSON + Markdown
  ↓
starwork spawn --blueprint
  ↓
定制化卫星项目工作台
```

## 为什么需要它

当前 `starwork spawn` 只支持两种固定结构：

- `satellite-starter`
- `project`

这适合标准项目，但真实使用时经常会出现定制需求：

- 这个项目不叫 `参考资料/`，而叫 `资料库/`
- 这个项目需要 `客户沟通/`、`会议纪要/`、`版本记录/`
- 这个项目的正式成果不放 `输出/确认成果/`，而放 `交付物/确认版本/`
- 这个项目需要特别告诉 Agent：哪些内容可以改，哪些内容不能改

如果让 AI 直接改 Kit 源文件，Kit 会被污染；如果把所有定制都做成 Pack，Pack 会变得过度膨胀。

所以 v0.1 需要一个中间层：

> Kit 提供基础结构，Pack 提供可复用场景，工作台定制单处理“这一次”的个性化生成。

## 边界

### Kit

Kit 是工作台基础骨架。

例如：

- `satellite-starter`
- `project`
- `hub`

Kit 不应该因为某一个项目的特殊需求而被修改。

### Pack

Pack 是可复用的场景包。

例如：

- 内容创作者 Pack
- 多项目中枢管理 Pack
- 未来的客户交付 Pack、课程研发 Pack

如果一套结构会反复被不同用户、不同项目使用，应沉淀为 Pack。

### 工作台定制单

工作台定制单是一次性项目配置。

例如：

- 某个客户项目需要额外的 `合同与报价/`
- 某个产品项目需要 `版本记录/`
- 某个内容项目想把 `草稿/` 改成 `脚本工坊/`

如果它只服务于当前项目，不应该立刻做成 Pack。

## 与 skill 的关系

这个能力配套一个 skill：

```text
starworkSpawn
```

skill 的职责是帮 AI 生成工作台定制单。

它不直接创建项目，不直接修改 Hub，也不直接写用户工作区。

skill 应完成：

1. 询问用户项目类型、工作方式和目录偏好。
2. 判断基础模式应使用 `starter` 还是 `project`。
3. 判断是否需要推荐 Pack。
4. 生成 `blueprint.json`。
5. 生成配套 Markdown 规则文件。
6. 提醒用户用 `starwork spawn --blueprint` 执行。

CLI 的职责是执行：

1. 读取并校验 blueprint。
2. 展示 dry-run 计划。
3. 用户确认后创建工作区。
4. 写入 workspace state、项目状态、Hub registry 和 Agent 规则。
5. 运行或提示运行 `starwork doctor`。

## 推荐文件结构

一个工作台定制单建议放在独立文件夹中：

```text
my-project-blueprint/
├── blueprint.json
├── rules/
│   ├── file-boundaries.md
│   ├── workflow.md
│   └── handoff.md
└── seed/
    ├── 会议纪要/README.md
    └── 版本记录/README.md
```

其中：

- `blueprint.json`：机器可读配置。
- `rules/`：写入 Agent 入口文件的项目规则。
- `seed/`：初始化时复制到目标工作区的项目占位文件。

## 命令形式

```bash
starwork spawn --hub <hub-path> --target <path> --blueprint <blueprint.json>
starwork spawn --hub ~/my-hub --target ~/projects/content-site --blueprint ./blueprint.json --dry-run
starwork spawn --hub ~/my-hub --target ~/projects/content-site --blueprint ./blueprint.json --yes
```

`--blueprint` 与普通参数的关系：

| 参数 | 规则 |
|---|---|
| `--blueprint` | 启用定制生成模式。 |
| `--hub` | 仍由命令参数提供，避免 blueprint 被复制到别人机器后误写 Hub。 |
| `--target` | 仍由命令参数提供，避免 blueprint 决定真实写入位置。 |
| `--name` | 可由 blueprint 提供；命令参数优先级更高。 |
| `--mode` | 可由 blueprint 提供；命令参数优先级更高。 |
| `--id` | 可由 blueprint 提供；命令参数优先级更高。 |
| `--pack` | v0.1 不建议与 blueprint 同时执行；如需 Pack，应先 spawn，再 `pack install`。 |

## `blueprint.json`

### 最小示例

```json
{
  "schema": "starwork.spawn_blueprint.v0.1",
  "name": "内容产品官网",
  "project_id": "content-site",
  "base": {
    "mode": "project",
    "kit": "project",
    "language": "zh"
  },
  "paths": {
    "formal_source": "交付物/确认版本/",
    "business_work_area": "事项/"
  },
  "folders": [
    "资料库/",
    "草稿/",
    "客户沟通/",
    "会议纪要/",
    "版本记录/",
    "交付物/确认版本/"
  ],
  "agent_rules": [
    {
      "slot": "project.file_boundaries",
      "from": "rules/file-boundaries.md"
    },
    {
      "slot": "project.workflow",
      "from": "rules/workflow.md"
    }
  ],
  "seed": [
    {
      "from": "seed/会议纪要/README.md",
      "to": "会议纪要/README.md",
      "on_conflict": "error"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|---|---:|---|
| `schema` | 是 | 固定为 `starwork.spawn_blueprint.v0.1`。 |
| `name` | 是 | 项目名称。可被命令参数 `--name` 覆盖。 |
| `project_id` | 否 | Hub registry 中的项目 ID。可被命令参数 `--id` 覆盖。 |
| `description` | 否 | 项目说明，写入项目状态入口。 |
| `base.mode` | 是 | `starter` 或 `project`。 |
| `base.kit` | 是 | 只能是与 mode 匹配的 Satellite Kit。 |
| `base.language` | 否 | `zh` 或 `en`。未提供时继承 Hub 或 CLI `--language`。 |
| `paths.formal_source` | 是 | 正式成果或确认事实源目录。 |
| `paths.business_work_area` | 是 | 当前工作或事项推进目录。 |
| `folders` | 否 | 需要额外创建或确保存在的目录列表。 |
| `renames` | 否 | 从基础 Kit 路径到定制路径的改名声明。 |
| `removals` | 否 | 从基础 Kit 中移除的空占位目录。v0.1 只允许移除空目录。 |
| `agent_rules` | 否 | 注入 Agent 入口文件的 Markdown 规则。 |
| `seed` | 否 | 初始化复制文件。 |
| `notes` | 否 | 给用户或 Agent 阅读的备注，不参与执行。 |

## 路径定制规则

### `folders`

`folders` 表示创建目录或确保目录存在。

```json
{
  "folders": [
    "客户沟通/",
    "会议纪要/",
    "版本记录/"
  ]
}
```

v0.1 只允许相对路径，不能包含：

- 绝对路径
- `..`
- `~`
- 空字符串
- 指向 `.git/` 的路径

### `renames`

`renames` 表示把基础 Kit 中的某个路径换成新路径。

```json
{
  "renames": {
    "参考资料/": "资料库/",
    "输出/确认成果/": "交付物/确认版本/"
  }
}
```

CLI 执行时应：

1. 检查 source 是否来自当前 Kit。
2. 检查 target 是否安全。
3. 如果 source 目录为空，直接改名。
4. 如果 source 有内容，执行复制并在 dry-run 中明确提示。
5. 更新 `.starwork/workspace.json` 中相关路径。

### `removals`

`removals` 表示移除基础 Kit 中不需要的空目录。

```json
{
  "removals": [
    "参考资料/"
  ]
}
```

v0.1 限制：

- 只能移除空目录。
- 不能移除 `AGENTS.md`、`CLAUDE.md`、`.starwork/`、`.core-sync.json`。
- 不能移除 `_系统/`。
- 不能移除共享知识挂载、`.agents/skills/`、`.claude/skills/` 这类主库挂载入口；中文 Satellite 默认为 `知识/`，英文 Satellite 默认为 `knowledge/`。

如果用户不想使用某个入口，更推荐在规则中说明“不使用”，而不是删除结构。

## Agent 规则注入

`agent_rules` 指向 Markdown 文件：

```json
{
  "agent_rules": [
    {
      "slot": "project.file_boundaries",
      "from": "rules/file-boundaries.md"
    },
    {
      "slot": "project.workflow",
      "from": "rules/workflow.md"
    }
  ]
}
```

CLI 应把这些规则注入 `AGENTS.md` 的项目规则区：

```markdown
## 项目定制规则

<!-- StarWork Blueprint: project.file_boundaries -->

...

<!-- StarWork Blueprint: project.workflow -->

...
```

如果存在 `CLAUDE.md`，v0.1 可以选择同步注入同一段规则，或保留轻量转引：

```markdown
项目定制规则以 AGENTS.md 为准。
```

## Seed 文件

`seed` 用于创建初始化占位文件：

```json
{
  "seed": [
    {
      "from": "seed/版本记录/README.md",
      "to": "版本记录/README.md",
      "on_conflict": "error"
    }
  ]
}
```

`on_conflict` 可选值：

| 值 | 行为 |
|---|---|
| `error` | 目标已存在则中止。v0.1 默认值。 |
| `skip` | 目标已存在则跳过。 |
| `create_new` | 目标已存在则生成新文件名。 |

v0.1 不支持覆盖已有用户文件。

## workspace state 写入

使用 blueprint 创建的工作区，应在 `.starwork/workspace.json` 中记录：

```json
{
  "schema": "starwork.workspace.v0.1",
  "core": "0.1",
  "workspace_type": "project",
  "kit": "project",
  "language": "zh",
  "packs": [],
  "paths": {
    "formal_source": "交付物/确认版本/",
    "business_work_area": "事项/"
  },
  "customization": {
    "type": "spawn_blueprint",
    "schema": "starwork.spawn_blueprint.v0.1",
    "source": "blueprint.json",
    "folders": [
      "资料库/",
      "草稿/",
      "客户沟通/",
      "会议纪要/",
      "版本记录/",
      "交付物/确认版本/"
    ]
  },
  "hub": {
    "path": "/Users/example/my-hub",
    "project_id": "content-site"
  },
  "created_by": "starwork spawn --blueprint"
}
```

`customization` 用于让后续 `doctor`、`adapt` 和 Agent 知道：这个工作台不是纯标准 Kit，而是通过定制单生成。

## 项目状态入口写入

CLI 应继续写入：

```text
_系统/上下文/当前项目.md
```

如果 blueprint 提供 `description`，应写入该文件。

建议结构：

```markdown
# 当前项目

## 项目名称

内容产品官网

## 项目定位

...

## 工作区定制

- 基础 Kit：project
- 正式成果：交付物/确认版本/
- 当前工作：事项/
- 定制目录：资料库/、客户沟通/、会议纪要/、版本记录/

## 主库关系

- Hub：...
- Project ID：content-site
```

## Hub registry 写入

Hub 的 `projects/registry.json` 应保留轻量登记，不保存完整 blueprint。

建议新增字段：

```json
{
  "id": "content-site",
  "name": "内容产品官网",
  "path": "/Users/example/projects/content-site",
  "status": "active",
  "workspace_type": "project",
  "kit": "project",
  "customized": true,
  "created_at": "2026-05-18T00:00:00.000Z",
  "updated_at": "2026-05-18T00:00:00.000Z"
}
```

Hub registry 只回答“有哪些项目、在哪里、是否活跃”。项目定制细节留在 Satellite 自己的 `.starwork/workspace.json`。

## 校验规则

CLI 在执行前必须校验：

1. `schema` 正确。
2. `base.mode` 与 `base.kit` 匹配。
3. `base.kit` 是 Satellite Kit。
4. `paths.formal_source` 和 `paths.business_work_area` 是安全相对路径。
5. `folders`、`renames`、`removals`、`seed.to` 都是安全相对路径。
6. `agent_rules.from` 和 `seed.from` 必须存在于 blueprint 文件夹内。
7. `agent_rules.from` 和 `seed.from` 不能跳出 blueprint 文件夹。
8. 不允许覆盖目标目录已有用户文件。
9. 不允许通过 blueprint 修改 Hub 内部文件，除 Hub registry 登记外。
10. 不允许删除或替换 StarWork 固定系统入口。

## Dry-run 输出

`--dry-run` 必须清晰展示：

```text
Spawn blueprint preview:

Hub:
  /Users/example/my-hub

Target:
  /Users/example/projects/content-site

Base:
  mode: 事项
  kit: project

Workspace paths:
  formal_source: 交付物/确认版本/
  business_work_area: 事项/

Create folders:
  资料库/
  草稿/
  客户沟通/
  会议纪要/
  版本记录/
  交付物/确认版本/

Inject rules:
  project.file_boundaries <- rules/file-boundaries.md
  project.workflow <- rules/workflow.md

Write seed files:
  seed/会议纪要/README.md -> 会议纪要/README.md

Update Hub registry:
  content-site
```

这一步非常重要，因为用户要能看懂 AI 生成的施工单到底会做什么。

## 与 Pack 的关系

v0.1 建议：

1. `spawn --blueprint` 只负责创建定制工作台。
2. `pack install` 负责安装可复用场景能力。
3. 两者不在同一次命令里混合执行。

推荐流程：

```bash
starwork spawn --hub ~/my-hub --target ~/projects/content-site --blueprint ./blueprint.json --yes
cd ~/projects/content-site
starwork pack install content-creator --yes
starwork doctor
```

原因：

- spawn 先保证工作区结构和主库关系正确。
- pack install 再保证场景能力正确落地。
- 分两步更容易预览和排错。

未来可以考虑让 blueprint 声明推荐 Pack：

```json
{
  "recommended_packs": [
    "content-creator"
  ]
}
```

但 v0.1 不自动安装。

## 与 doctor 的关系

`doctor` 后续应增加 blueprint-aware 检查：

- `.starwork/workspace.json` 是否记录 `customization.type = spawn_blueprint`
- `customization.folders` 中的目录是否存在
- `paths.formal_source` 是否存在
- `paths.business_work_area` 是否存在
- `agent_rules` 是否已经注入
- seed 文件是否落地

v0.1 可以先只检查目录和 workspace state，规则注入完整性可后续增强。

## 与 adapt 的关系

`adapt` 不需要理解完整 blueprint。

它只需要读取生成后的：

- `AGENTS.md`
- `.starwork/workspace.json`
- `_系统/上下文/当前项目.md`

也就是说，blueprint 是生成期工具；adapt 面向生成后的工作台事实。

## 错误示例

### 错误：把定制写进 Kit

不应该为了某个项目去修改：

```text
product/core/kits/project/
```

这会污染所有未来项目。

### 错误：把一次性需求做成 Pack

如果只是某个客户项目需要 `合同与报价/`，不应该马上新建 Pack。

### 错误：让 blueprint 写真实 Hub 路径

blueprint 可以描述项目，但不应该决定真实 `--hub`。

Hub 路径应该来自命令参数，避免一个 blueprint 被复制到另一台机器后误写错误中枢。

### 错误：覆盖用户文件

blueprint 不能覆盖目标目录里的已有文件。

v0.1 应保持保守：目标目录必须不存在或为空。

## 实现分期

### v0.1

- 支持 `--blueprint <file>`。
- 支持 `folders`。
- 支持 `paths.formal_source` 和 `paths.business_work_area`。
- 支持 `agent_rules` 注入 `AGENTS.md`。
- 支持 `seed` 复制。
- 支持 workspace state `customization` 记录。
- 支持 dry-run。
- `doctor` 支持检查 blueprint schema、定制目录、seed 文件和规则注入标记。
- 不支持自动安装 Pack。
- 不支持复杂条件、循环、脚本执行。
- 不支持 `renames` 和 `removals`。

### v0.2

- 支持 `renames`。
- 支持安全 `removals`。
- `doctor` 增强 blueprint-aware 检查。
- 支持 blueprint schema 文件。
- 支持从交互式 skill 直接生成 blueprint 文件夹。

### v0.3+

- 支持团队共享 blueprint。
- 支持 blueprint 升级和迁移。
- 支持把反复使用的 blueprint 提升为 Pack。

## 待确认问题

1. `starwork-spawn-designer` skill 是否放在主库 `skills/`，再由 Hub 分发给卫星项目？
2. blueprint 文件是否需要进入 Hub 项目登记附件，还是只保存在 Satellite 内？
3. `AGENTS.md` 和 `CLAUDE.md` 是否都注入完整规则，还是只让 `CLAUDE.md` 转引 `AGENTS.md`？
4. v0.1 是否要实现 `renames`，还是先只支持新增目录和路径覆盖？

## 结论

工作台定制单让 StarWork 多了一层很重要的能力：

```text
标准 Kit
  + 一次性定制单
  + 可选 Pack
  = 符合当前项目需要的工作台
```

它避免了两种风险：

- 为每个项目污染 Kit。
- 为每个小差异制造 Pack。

长期看，用户和 AI 可以先用工作台定制单解决具体项目；当某类定制被反复使用，再把它沉淀为正式 Pack。
