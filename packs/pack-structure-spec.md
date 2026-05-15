# StarWork Pack Structure SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Packs
- 目标：定义 Pack 源包的结构、声明方式、多语言镜像和 CLI 组装方式
- 相关命令：`starwork init`、`starwork pack install`

## 一句话定义

Pack 是 StarWork 的场景定制模板。

它不直接等于一套中文目录，也不直接等于一套英文目录。Pack 的核心是“业务角色和业务流”，语言层再决定这些角色在用户工作区里叫什么、规则怎么写、模板用哪种语言。

## 核心判断

Pack 应拆成两层：

```text
pack.json
  语言无关：Pack ID、适配工作区、业务角色、业务流、规则插槽、模板 ID、seed ID

languages/<language>.json
  语言相关：显示名称、目录路径、默认覆盖、规则文件、模板文件、seed 文件
```

这样同一个 Pack 可以生成中文工作台，也可以生成英文镜像，而不需要维护两套互相漂移的 Pack。

## 推荐目录结构

```text
content-creator/
├── pack.json
├── README.md
├── languages/
│   ├── zh.json
│   └── en.json
├── rules/
│   ├── zh/
│   │   ├── overview.md
│   │   ├── workflow.md
│   │   ├── file-boundaries.md
│   │   └── review.md
│   └── en/
│       ├── overview.md
│       ├── workflow.md
│       ├── file-boundaries.md
│       └── review.md
├── templates/
│   ├── zh/
│   │   ├── content-brief.md
│   │   ├── publish-record.md
│   │   └── weekly-review.md
│   └── en/
│       ├── content-brief.md
│       ├── publish-record.md
│       └── weekly-review.md
└── seed/
    ├── zh/
    │   ├── 账号定位/
    │   └── 选题池/
    └── en/
        ├── account-profile/
        └── ideas/
```

## `pack.json`

`pack.json` 是 Pack 的语言无关声明。

它回答：

- Pack ID 是什么
- 适配哪些工作区类型
- 需要哪些 Core capability
- 有哪些业务角色
- 业务流如何从一个角色流向另一个角色
- 有哪些规则插槽
- 有哪些模板 ID
- 有哪些 seed ID

示例：

```json
{
  "schema": "starwork.pack.v0.1",
  "id": "content-creator",
  "version": "0.1.0",
  "compatible_core": "0.1",
  "supports_workspace_types": ["single-light", "single-matter"],
  "requires_capabilities": [],
  "roles": {
    "account_profile": { "kind": "strategy" },
    "ideas": { "kind": "pipeline" },
    "materials": { "kind": "source" },
    "drafts": { "kind": "work_in_progress" },
    "published": { "kind": "formal_source" },
    "review": { "kind": "learning_loop" }
  },
  "flow": ["account_profile", "ideas", "materials", "drafts", "published", "review"],
  "rules": [
    { "id": "overview", "slot": "pack.overview" },
    { "id": "workflow", "slot": "pack.workflow" }
  ],
  "templates": [
    { "id": "content-brief" },
    { "id": "publish-record" }
  ],
  "seed": [
    { "id": "ideas", "role": "ideas" }
  ]
}
```

注意：`pack.json` 不写 `选题池/`、`ideas/` 这类具体路径。路径属于语言层。

## `languages/<language>.json`

语言文件决定 Pack 在某种语言镜像下如何落地。

它回答：

- 给用户看的 Pack 名称是什么
- 每个业务角色映射到哪个目录
- 默认正式事实源在哪里
- 默认业务工作区在哪里
- 规则片段读取哪些 Markdown
- 模板读取哪些 Markdown
- seed 文件写到哪里

中文示例：

```json
{
  "language": "zh",
  "name": "自媒体内容创作者 Pack",
  "paths": {
    "ideas": "选题池/",
    "materials": "素材库/",
    "drafts": "草稿与脚本/",
    "published": "发布记录/"
  },
  "overrides": {
    "formal_source": "发布记录/",
    "business_work_area": "草稿与脚本/"
  },
  "rules": [
    { "slot": "pack.overview", "from": "rules/zh/overview.md" }
  ],
  "templates": [
    { "id": "content-brief", "from": "templates/zh/content-brief.md", "description": "单篇内容大纲模板" }
  ],
  "seed": [
    { "from": "seed/zh/选题池/README.md", "to": "选题池/README.md", "on_conflict": "create_new" }
  ]
}
```

英文示例：

```json
{
  "language": "en",
  "name": "Content Creator Pack",
  "paths": {
    "ideas": "ideas/",
    "materials": "materials/",
    "drafts": "drafts-and-scripts/",
    "published": "published/"
  },
  "overrides": {
    "formal_source": "published/",
    "business_work_area": "drafts-and-scripts/"
  }
}
```

## 组装流程

CLI 安装 Pack 时，应按以下顺序执行：

1. 读取 Kit / preset，确定工作区类型和语言。
2. 读取 Pack `pack.json`。
3. 读取 Pack `languages/<language>.json`。
4. 合并得到本次安装用的 Pack 配置。
5. 校验 Core 版本、工作区类型和 capabilities。
6. 用语言层 `paths` 创建场景目录。
7. 用语言层 `rules` 渲染 Markdown 片段，并注入 Agent 入口文件。
8. 用语言层 `seed` 生成占位文件写入计划。
9. 用语言层 `templates` 登记或复制业务模板。
10. 展示预览。
11. 用户确认后写入。
12. 更新 `.starwork/workspace.json`。

当前 v0.1 实现仍是简单组装器：直接复制现成 Kit 目录，再把 Pack 规则追加到 `AGENTS.md` 的“场景规则”部分。

## 占位符

规则片段、模板和 seed 文件可以使用占位符。

建议支持：

```text
{{pack.id}}
{{pack.name}}
{{pack.language}}
{{paths.<key>}}
{{overrides.formal_source}}
{{overrides.business_work_area}}
{{workspace.name}}
{{workspace.type}}
```

v0.1 不支持复杂条件语法、循环语法和脚本执行。

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
  "language": "zh",
  "paths": {
    "formal_source": "发布记录/",
    "business_work_area": "草稿与脚本/"
  }
}
```

`.starwork/workspace.json` 是 CLI 状态，不是项目事实源。

## v0.1 实现状态

当前第一版实现已补齐：

1. `general` 默认 Pack。
2. `content-creator` 场景 Pack。
3. `hub-management` 管理 Pack。
4. `languages/zh.json` 和 `languages/en.json` 多语言结构。
5. CLI 根据语言文件读取 Pack 路径、规则、模板和 seed。
6. CLI 的简单占位符渲染器。
7. CLI 的写入计划、dry-run 预览和冲突旁路文件机制。

后续仍需要补齐：

1. `starwork.pack.v0.1` JSON Schema 文件。
2. Kit 侧更正式的规则插槽设计。
3. Pack 校验命令。
4. 多 Pack 安装时的冲突策略。
5. 真正根据英文 Kit 自动选择英文 Pack 镜像的完整 init 入口。

## 验收标准

Pack 结构 v0.1 可验收，至少满足：

- Pack 可以用 `pack.json` 描述语言无关的业务角色和业务流。
- Pack 可以用 `languages/<language>.json` 描述不同语言下的路径、规则、模板和 seed。
- Pack 不需要直接提供完整 `AGENTS.md`。
- CLI 可以把 Kit 和 Pack 规则片段组装成最终 Agent 入口文件。
- Pack 可以覆盖正式成果路径和业务工作区路径。
- Pack 不能破坏 Core 基础角色。
- 通用工作也能表达为默认 Pack。
- 自媒体内容创作者 Pack 可以按此结构落地。
