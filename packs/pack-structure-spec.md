# StarWork Pack Structure SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Packs
- 目标：定义 Pack 源包的结构、声明方式和组装方式
- 相关命令：`starwork init`、`starwork pack install`

## 一句话定义

Pack 是 StarWork 的场景定制模板。

它通过一个机器可读的 JSON 结构声明，加上一组人类和 Agent 可读的 Markdown 规则片段，描述某个场景工作台应该长什么样、如何流动、Agent 应该遵守哪些场景规则。

## 核心判断

Pack 不应该只是一组最终目录和文件。

Pack 应该是可组装的源包：

```text
pack.json
  描述目录结构、路径角色、业务关系、默认覆盖和规则插槽

rules/*.md
  提供可被组装进 AGENTS.md 或其他 Agent 入口文件的规则片段

templates/*.md
  提供用户在场景中反复使用的业务模板

seed/
  提供初始化时可创建到工作区里的占位文件
```

CLI 负责把这些源材料和 Kit 模板组装成最终工作台。

```text
Kit 模板 + Pack JSON + Pack Markdown 片段 + 用户选择
  ↓
CLI 组装
  ↓
最终 StarWork 工作台
```

## Pack 与 Kit 的关系

### Kit

Kit 是 AI 工作区的通用模板。

它定义：

- Agent 入口角色
- 项目状态索引角色
- 当前工作索引角色
- 事项机制是否启用
- 本地身份和教训是否启用
- 多项目中枢能力是否启用

### Pack

Pack 是场景定制模板。

它定义：

- 这个工作台用于什么场景
- 场景目录有哪些
- 每个目录承担什么业务角色
- 业务流如何从一个目录流向另一个目录
- 正式成果默认放哪里
- 当前业务工作默认在哪里推进
- 场景规则如何组装进 Agent 入口文件

Pack 可以覆盖 Kit 预留的场景配置，但不能破坏 Core 的基础角色。

```text
Kit 决定工作区的通用组织形态。
Pack 决定工作区的场景业务形态。
```

## 推荐目录结构

```text
content-creator/
├── pack.json
├── README.md
├── rules/
│   ├── overview.md
│   ├── workflow.md
│   ├── file-boundaries.md
│   └── review.md
├── templates/
│   ├── content-brief.md
│   ├── publish-record.md
│   └── weekly-review.md
└── seed/
    ├── 账号定位/
    │   └── README.md
    ├── 选题池/
    │   └── README.md
    └── 数据复盘/
        └── README.md
```

## `pack.json`

`pack.json` 是 Pack 的机器可读声明。

它不写长篇解释，只描述结构、关系、覆盖和组装规则。

### 职责

`pack.json` 应回答：

- Pack ID 是什么
- 适配哪些工作区类型
- 需要哪些 Kit 能力
- 要创建哪些目录
- 这些目录分别承担什么角色
- 目录之间的业务流是什么
- 会覆盖哪些默认路径
- 哪些 Markdown 规则片段要插入哪些 slot
- 哪些 seed 文件要初始化到工作区
- 冲突时如何处理

### 示例

```json
{
  "schema": "starwork.pack.v0.1",
  "id": "content-creator",
  "name": "自媒体内容创作者 Pack",
  "version": "0.1.0",
  "compatible_core": "0.1",
  "supports_workspace_types": ["single-light", "single-matter"],
  "requires_capabilities": [],
  "paths": {
    "account_profile": "账号定位/",
    "ideas": "选题池/",
    "materials": "素材库/",
    "drafts": "草稿与脚本/",
    "published": "发布记录/",
    "review": "数据复盘/",
    "feedback": "用户反馈/",
    "commercial": "商业化线索/"
  },
  "flow": [
    "account_profile",
    "ideas",
    "materials",
    "drafts",
    "published",
    "review"
  ],
  "overrides": {
    "formal_source": "发布记录/",
    "business_work_area": "草稿与脚本/"
  },
  "rules": [
    {
      "slot": "pack.overview",
      "from": "rules/overview.md"
    },
    {
      "slot": "pack.workflow",
      "from": "rules/workflow.md"
    },
    {
      "slot": "pack.file_boundaries",
      "from": "rules/file-boundaries.md"
    },
    {
      "slot": "pack.review",
      "from": "rules/review.md"
    }
  ],
  "templates": [
    {
      "id": "content-brief",
      "from": "templates/content-brief.md",
      "description": "单篇内容大纲模板"
    },
    {
      "id": "publish-record",
      "from": "templates/publish-record.md",
      "description": "发布记录模板"
    }
  ],
  "seed": [
    {
      "from": "seed/账号定位/README.md",
      "to": "账号定位/README.md",
      "on_conflict": "create_new"
    },
    {
      "from": "seed/选题池/README.md",
      "to": "选题池/README.md",
      "on_conflict": "create_new"
    }
  ]
}
```

## JSON 字段说明

| 字段 | 说明 |
|---|---|
| `schema` | Pack 声明 schema 版本。 |
| `id` | Pack 唯一 ID。 |
| `name` | 给用户看的名称。 |
| `version` | Pack 版本。 |
| `compatible_core` | 兼容的 Core 版本。 |
| `supports_workspace_types` | 可安装到哪些工作区类型。 |
| `requires_capabilities` | 依赖的 Core capability。 |
| `paths` | 场景路径角色表。键是业务角色，值是目标路径。 |
| `flow` | 业务流顺序，引用 `paths` 中的键。 |
| `overrides` | 覆盖 Kit 的场景默认配置。 |
| `rules` | Markdown 规则片段如何插入 slot。 |
| `templates` | 业务模板清单。 |
| `seed` | 初始化时创建的占位文件。 |

## Markdown 规则片段

Markdown 规则片段不是最终 `AGENTS.md`。

它们是可被 CLI 组装进 Agent 入口文件的源片段。

### 推荐规则片段

```text
rules/
├── overview.md          # 场景总览
├── workflow.md          # 工作流规则
├── file-boundaries.md   # 文件边界
└── review.md            # 复盘和检查规则
```

### 占位符

规则片段可以使用占位符。

```md
## 自媒体内容创作规则

本工作台的选题池位于：{{paths.ideas}}

素材放在：{{paths.materials}}

草稿和脚本放在：{{paths.drafts}}

发布完成后，必须更新：{{paths.published}} 和 {{paths.review}}
```

CLI 渲染时从 `pack.json` 和用户选择中读取变量。

### 占位符边界

v0.1 只支持简单变量替换。

建议支持：

```text
{{pack.id}}
{{pack.name}}
{{paths.<key>}}
{{overrides.formal_source}}
{{overrides.business_work_area}}
{{workspace.name}}
{{workspace.type}}
```

v0.1 不支持复杂条件语法、循环语法和脚本执行。

## Kit 插槽

Kit 应提供可被 Pack 注入的规则插槽。

示例：

```md
# Agent 工作规则

## Core 规则

{{core.rules}}

## 工作区规则

{{kit.rules}}

## 场景规则

{{pack.overview}}

{{pack.workflow}}

{{pack.file_boundaries}}

{{pack.review}}
```

Pack 不能直接覆盖完整 `AGENTS.md`。

Pack 应通过声明规则片段和插槽，由 CLI 组装最终 Agent 入口文件。

## Seed 文件

`seed/` 存放初始化时可写入用户工作区的占位文件。

Seed 文件可以是：

- 目录 README
- 示例空表
- 初始说明
- 默认索引文件

Seed 文件不能包含用户真实内容。

如果目标文件已存在，默认不覆盖。

## Templates

`templates/` 存放用户在业务场景中反复使用的模板。

模板不一定在初始化时全部复制到工作区，也可以登记到 `.starwork/workspace.json` 或 Pack 状态中，供后续命令使用。

例如：

```text
starwork template use content-brief
```

该命令不属于 v0.1 必需范围，但 Pack 结构应为未来保留模板清单。

## 组装流程

CLI 安装 Pack 时，应按以下顺序执行：

1. 读取 Kit 声明和模板。
2. 读取 Pack `pack.json`。
3. 校验 Core 版本和工作区类型。
4. 校验 Pack 依赖的 capabilities。
5. 解析 Pack 路径角色和 overrides。
6. 渲染 Markdown 规则片段。
7. 将规则片段注入 Kit 插槽。
8. 生成目录和 seed 文件写入计划。
9. 展示预览。
10. 用户确认后写入。
11. 更新 CLI 内部状态。

## 写入安全

Pack 安装必须遵守 StarWork 的安全写入原则：

- 不静默覆盖用户已有内容
- 不删除用户文件
- 不移动用户文件
- 不改写已确认事项记录
- 不改写已确认决策记录
- 冲突时生成旁路文件或提示用户手动合并

Pack 可以创建新目录、新模板、新 seed 文件，也可以更新 CLI 状态文件。

## Pack 可以覆盖什么

Pack 可以覆盖 Kit 预留的场景配置：

- `formal_source`
- `business_work_area`
- 场景默认目录
- 场景规则片段
- 场景模板清单
- 初始化后的推荐下一步

Pack 不能覆盖 Core 基础角色：

- Agent 入口角色
- 项目状态索引角色
- 当前工作索引角色
- 事项注册表角色
- 决策记录角色

一句话：

```text
Pack 可以改变业务怎么流动，但不能拆掉工作区的仪表盘。
```

## CLI 内部状态

Pack 安装后，应写入 `.starwork/workspace.json`。

示例：

```json
{
  "schema": "starwork.workspace.v0.1",
  "core": "0.1",
  "workspace_type": "single-matter",
  "kit": "zh-local-matter",
  "packs": [
    {
      "id": "content-creator",
      "version": "0.1.0",
      "installed_at": "2026-05-12"
    }
  ],
  "paths": {
    "formal_source": "发布记录/",
    "business_work_area": "草稿与脚本/"
  }
}
```

`.starwork/workspace.json` 是 CLI 状态，不是项目事实源。

## 自定义 Pack

用户或 Agent 后续可以通过同一结构创建自定义 Pack。

目标体验：

```bash
starwork pack create my-workflow
starwork pack validate ./my-workflow
starwork init --type single-matter --pack ./my-workflow
```

v0.1 不必实现 `pack create` 和 `pack validate`，但 Pack 结构应为它们预留空间。

## 暂不支持

v0.1 Pack 结构暂不支持：

- Pack 内执行任意脚本
- 复杂模板语言
- 多 Pack 之间的自动冲突解决
- Pack 市场
- 云端下载安装
- 付费授权
- 自动迁移用户旧目录
- 安装时删除或移动用户已有内容

## v0.1 实现状态

当前第一版实现已补齐：

1. `general` 默认 Pack。
2. `content-creator` Pack 的 `pack.json`、规则片段、模板和 seed 文件。
3. `hub-management` 管理 Pack。
4. CLI 的简单占位符渲染器。
5. CLI 的写入计划、dry-run 预览和冲突旁路文件机制。

后续仍需要补齐：

1. `starwork.pack.v0.1` JSON Schema 文件。
2. Kit 侧更正式的规则插槽设计。
3. Pack 校验命令。
4. 多 Pack 安装时的冲突策略。

## 验收标准

Pack 结构 v0.1 可验收，至少满足：

- Pack 可以用 JSON 描述目录结构、路径角色和业务流。
- Pack 可以用 Markdown 片段描述 Agent 场景规则。
- Pack 不需要直接提供完整 `AGENTS.md`。
- CLI 可以把 Kit 插槽和 Pack 规则片段组装成最终 Agent 入口文件。
- Pack 可以覆盖正式成果路径和业务工作区路径。
- Pack 不能破坏 Core 基础角色。
- 通用工作也能表达为默认 Pack。
- 自媒体内容创作者 Pack 可以按此结构落地。
