---
name: starworkInit
description: Use this skill when a user wants to initialize a new StarWork workspace, choose between project and hub workspace types, choose Chinese or English workspace language, design friendly init interview flows, draft init blueprints, and explain how `starwork init` should execute and validate the result.
---

# starworkInit

使用这个 skill，把用户“我想建一个工作台”的模糊需求，整理成 StarWork 初始化方案。

`starworkInit` 不是 `starwork init` 命令本身。它负责在命令执行前帮用户判断：

- 应该建单项目工作台，还是多项目中枢
- 使用中文工作台，还是英文工作台
- 是否需要定制目录和 Agent 规则
- 最终应该如何执行和检查

除非用户明确要求落地文件，否则这个 skill 只负责设计方案，不直接创建工作台。

## 参考

需要完整字段、边界和待确认问题时，读取：

```text
../starworkInit-spec.md
```

不要在 skill 内重复维护完整 schema，避免和 SPEC 漂移。

## 决策流程

按分支判断，不要一次问完所有问题。

```text
Step 1 判断工作台类型
  ├─ hub：继续判断语言，然后直接给 Hub 初始化建议
  └─ project：继续判断语言和是否需要定制目录

Step 2 判断语言
  ├─ 中文：language=zh
  └─ English：language=en

Step 3 判断是否需要定制工作台
  ├─ 不需要：输出标准初始化建议
  └─ 需要：进入友好采访

Step 4 采访正式成果放哪里
Step 5 采访日常工作在哪里发生
Step 6 采访额外固定区域和 Agent 规则
```

## Step 1：判断工作台类型

先问：

```text
你是想管理一个具体项目，还是建立一个能管理多个项目的中枢？
```

判断：

- 一个具体项目、一个阶段目标、一次成果交付：`project`
- 管理多个项目、统一身份/教训/知识/skills：`hub`

默认优先建议 `project`。只有用户明确要建立多项目中枢时，才推荐 `hub`。

### Hub 分支

如果判断为 `hub`，不要继续问“选哪个 Pack”。仍然要问语言。

直接输出 Hub 初始化建议：

- 工作区类型：`hub`
- 基础 Kit：`hub`
- 语言：使用 Step 2 的选择
- Pack：不让用户选择；Hub 使用中枢管理结构
- 后续确认：Hub 名称、项目注册区域、是否预置 `skills/` 和 `.incoming/`

## Step 2：判断语言

工作台类型判断后，必须问语言：

```text
这个工作台你想用中文结构，还是英文结构？
```

判断：

- 用户主要用中文工作：`language=zh`
- 用户主要用英文协作或英文目录：`language=en`
- 用户不确定：默认 `zh`

不要跳过这一步。语言会影响目录名称、模板文字和 Agent 规则表达方式。

## Step 3：判断是否需要定制目录

仅当 Step 1 是 Project 时才问：

```text
这个项目是否需要自定义资料区、推进区、成果区或 Agent 规则？
```

判断：

- 不需要、不确定：使用标准 Project Kit。
- 明确需要固定目录或规则：进入定制采访。
- 用户改口说要管理多个项目：回到 Step 1，改为 `hub`。

## Pack 选择规则

v0.1 不采访用户选择场景 Pack。

原因：

- 目前只把 `general` 作为稳定的默认 Pack。
- 内容创作者 Pack 还未完成产品定稿，不应在 init skill 中主动推荐。
- 其他业务场景 Pack 还不存在，不应询问用户“其他场景”。

默认规则：

- 单项目工作台：`pack=general`
- Hub：不让用户选择 Pack；使用 Hub 中枢管理结构
- 用户主动提到某个业务场景时，只把它记录为定制需求，不把它映射成 Pack
- 不把一次性目录偏好误判成新 Pack

## Step 4：判断是否定制

在问正式成果、当前工作区、额外目录之前，先问：

```text
你想先用标准结构，还是希望我帮你按自己的工作习惯稍微改一下目录和规则？
```

判断：

- 标准结构就行：输出标准 Kit + Pack 初始化建议
- 想改一下：进入 Step 5-7
- 不确定：给 2-3 个例子帮用户判断

解释时可以说：

```text
标准结构像直接入住酒店；定制结构像把书桌、收纳盒和常用文件夹按你的习惯摆好。
如果你还没形成稳定习惯，先用标准结构更省心。
```

## Step 5-7：友好采访

采访要像聊天，不要像配置表。

### 正式成果

问：

```text
等这个工作台用一段时间后，你最希望未来的自己回来翻到什么？
是最终交付物、发布记录、客户确认版，还是项目清单？
```

常见映射：

- 最终成果、交付物、确认版本：`输出/确认成果/`
- 已发布内容、发布记录：`发布记录/`
- 项目清单、项目注册：Hub 使用 `projects/`；单项目不单独创建项目注册目录

如果用户答不上来，默认用 `输出/确认成果/`。

### 日常工作区

问：

```text
你平时会在哪里“干活”？
比如写草稿、放参考资料、记录推进过程、整理待办和阶段判断。
```

常见映射：

- 事项推进：`事项/`
- 轻量资料整理：`参考资料/`
- 内容草稿推进：`草稿与脚本/` 或 `事项/`

默认：

- `single-light`：`参考资料/`
- `project`：`事项/`

### 额外目录和规则

问：

```text
有没有一些东西你每次都想单独放，不想和别的文件混在一起？
比如会议纪要、客户沟通、版本记录、素材库、复盘。
```

只新增未来确实会反复使用的目录。避免含义重叠、只为好看、或与 Pack 已有目录重复的目录。

至少考虑两类规则：

- `rules/file-boundaries.md`：不同信息放哪里
- `rules/workflow.md`：Agent 如何推进工作

规则要具体、可执行，避免泛泛的效率建议。

## 输出方式

用户还在讨论时，输出初始化建议：

```markdown
## 初始化建议

- 工作区类型：
- Kit：
- 语言：
- Pack：
- 正式成果：
- 当前工作区：
- 额外目录：
- 需要注入的规则：

## 为什么这样选

...

## 后续执行

...
```

用户要求生成定制单时，创建：

```text
<workspace>-init/
├── init-blueprint.json
├── rules/
│   ├── file-boundaries.md
│   └── workflow.md
└── seed/
    └── ...
```

不要创建空的可选目录或文件。

## Init Blueprint 最小示例

```json
{
  "schema": "starwork.init_blueprint.v0.1",
  "name": "我的项目工作台",
  "workspace_type": "project",
  "kit": "project",
  "language": "zh",
  "pack": "general",
  "paths": {
    "formal_source": "输出/确认成果/",
    "business_work_area": "事项/"
  },
  "folders": [
    "会议纪要/",
    "客户沟通/",
    "版本记录/"
  ],
  "agent_rules": [
    {
      "slot": "workspace.file_boundaries",
      "from": "rules/file-boundaries.md"
    },
    {
      "slot": "workspace.workflow",
      "from": "rules/workflow.md"
    }
  ]
}
```

## 执行命令

当前 CLI 尚未实现 `init --blueprint` 时，要诚实说明这是目标命令形态。

未来执行方式：

```bash
starwork init --target <workspace-path> --blueprint <init-blueprint.json> --dry-run
starwork init --target <workspace-path> --blueprint <init-blueprint.json> --yes
starwork doctor --target <workspace-path>
```

## 约束

- 不用 init 创建卫星项目；已有 Hub 下创建项目应转向 `starworkSpawn`。
- 不建议用户修改 `product/core/kits/`。
- 不让 blueprint 决定真实 target 路径，目标路径必须来自命令参数或用户明确指定。
- 不采访场景 Pack；v0.1 单项目默认 `general`。
- 不把一次性偏好做成 Pack。
- 不覆盖用户已有文件。
- 一次只问一个问题；用户说不清时，用默认值推进并复述判断。
