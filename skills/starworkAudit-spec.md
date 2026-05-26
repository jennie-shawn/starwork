# `starworkAudit` Skill SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Skills
- Skill 名称：`starworkAudit`
- 实现状态：待实现
- 相关命令：`starwork audit`、`starwork repair`、`starwork doctor`
- 目标：帮助 Agent 基于 Hub 巡检结果，解释多个 Satellite 的健康状况、判断问题优先级，并在用户确认后生成可 dry-run 的 `repair blueprint`

## 一句话定义

`starworkAudit` 是 Hub 视角的 Satellite 巡检解读与修复蓝图设计 skill。

它不是 `audit` 命令本身，也不是 `repair` 执行器。它负责在 CLI 暴露事实之后做 AI 判断：

```text
starwork audit --json
  ↓
Hub / registry / Satellite / doctor facts
  ↓
starworkAudit skill 分析和解释
  ↓
用户确认修复范围
  ↓
repair-blueprint.json
  ↓
starwork repair --blueprint
```

## 产品边界

| 层 | 负责 | 不负责 |
|---|---|---|
| `audit` CLI | 扫描 Hub 和 Satellite，输出事实 JSON | 主观判断、修复建议、写文件 |
| `starworkAudit` skill | 解释巡检结果、分级、追问、生成 repair blueprint | 直接改文件、替用户做不可逆决定 |
| `repair` CLI | 校验和执行用户确认过的 repair blueprint | 自行判断业务语义 |

一句话：

> `starworkAudit` 是多项目中枢的“体检报告医生”，不是施工队。

## Skill 触发场景

用户可能这样触发：

- “帮我检查一下这个 Hub 下面的所有卫星项目”
- “这些 Satellite 健康吗”
- “Hub registry 里哪些项目有问题”
- “帮我做一次多项目巡检”
- “根据 audit 结果帮我生成修复蓝图”
- “把这些卫星项目的旧跨项目结构整理成新版”

## 输入要求

优先运行：

```bash
starwork audit --hub <hub-path> --json --inventory-depth all
```

如果用户已经提供 `audit-result.json`，优先读取该文件。

如果用户没有提供 Hub 路径：

- 当前目录是 Hub：直接使用当前目录。
- 当前目录不是 Hub：询问 Hub 路径，不要默认扫描用户主目录。

## 对 `audit` 输出的要求

`starworkAudit` 依赖 `starwork.audit.result.v0.1`。

必须读取：

- `hub.path`
- `hub.ok`
- `registry`
- `summary`
- `projects[]`
- 每个 project 的 `checks`
- 每个 project 的 `doctor_ok`
- 每个 project 的 `sync_ok`
- 每个 project 的 `legacy_signals`

`audit` JSON 不应包含 next steps 或建议。Skill 自己负责判断。

## 工作流程

### Step 1：确认巡检对象

先判断：

- 这是哪个 Hub？
- registry 里有多少项目？
- 这次是全量巡检，还是指定项目巡检？
- 是否有 archived / paused 项目需要跳过深度判断？

第一屏输出必须先说人话：

```text
我先把这个 Hub 当作中枢来看。它登记了 8 个项目，其中 7 个可访问，1 个路径失效。现在最需要处理的是路径失效和两个共享资源断链，其余规则更新可以放到第二批。
```

### Step 2：建立问题分组

按项目和问题类型分组。

问题类型：

| 类型 | 说明 |
|---|---|
| `hub-health` | Hub 自身结构问题。 |
| `registry` | `projects/registry.json` 解析、重复、路径、状态问题。 |
| `reachability` | Satellite 路径不存在、不可读、不是目录。 |
| `doctor` | Satellite 自身 doctor fail / warn。 |
| `sync` | `.core-sync.json`、Hub path、project_id 不一致。 |
| `shared-resource` | knowledge / identity / lessons / skills 挂载异常。 |
| `handoff` | `.starwork/handoff/` 缺失或旧路径残留。 |
| `rules` | `AGENTS.md` 仍使用旧规则或缺少关键规则。 |
| `maintenance` | 长期未更新、联络队列积压、可读性提醒。 |

### Step 3：判断严重程度

使用四级：

| 等级 | 含义 | 示例 |
|---|---|---|
| `blocking` | 阻塞，巡检或项目使用不可靠。 | 路径不存在、不是 StarWork、workspace state 无法解析。 |
| `high` | 高风险，可能导致 Hub / Satellite 关系错误。 | `.core-sync.json` 指向错误 Hub、project_id 不一致。 |
| `repairable` | 可通过保守修复补齐。 | 缺 `.starwork/handoff/`、缺 state.json、规则插槽缺失。 |
| `notice` | 提醒，不急于修。 | 项目长期未更新、队列有积压、输出区为空。 |

不要伪造精确分数。

### Step 4：区分“可自动修”和“需要确认”

可自动修的典型问题：

- 缺 `.starwork/handoff/` 子目录。
- 缺 `.starwork/handoff/state.json`。
- `.core-sync.json` 中 Hub path 明显不一致，且用户确认当前 Hub 是唯一中枢。
- registry 中 path 为旧路径，用户确认项目已移动到当前路径。
- `AGENTS.md` 缺新版 handoff 规则，可以追加受控插槽。

需要用户确认的问题：

- 项目是否已经归档。
- registry 中路径失效时，项目真实位置在哪里。
- 断链资源应重建软链接，还是改为本地副本。
- 旧 `_系统/跨项目/` 中的内容是否要迁移到 `.starwork/handoff/`。
- 项目规则是否允许被追加新版 Satellite 规则。

禁止自动处理：

- 删除项目记录。
- 删除旧跨项目目录。
- 移动正式成果。
- 合并 `.incoming/` 候选内容。
- 修改 identity / lessons 正文。

### Step 5：输出巡检报告

报告结构：

1. 总结：Hub 和项目整体健康状态。
2. 阻塞问题：需要先解决。
3. 高风险问题：建议尽快修。
4. 可批量修复项：适合生成 repair blueprint。
5. 需要用户确认的问题：最多 3 个。
6. 下一步：是否生成 repair blueprint。

建议语气：

```text
这不是“项目坏了”，更像是 Hub 和几个 Satellite 的登记信息有点不同步。先修路径和同步关系，再处理规则升级，会比较稳。
```

### Step 6：生成 repair blueprint

只有用户明确要求时，才生成：

```text
repair-blueprint.json
rules/
```

repair blueprint 和配套文件是 StarWork 巡检 / 修复过程材料，必须写入 Hub 的机制目录，而不是 Hub 或 Satellite 的业务工作区：

```text
<hub>/.starwork/audit-runs/<YYYY-MM-DD-or-run-id>/
├── audit-result.json
├── repair-blueprint.json
└── rules/
```

禁止写入：

- Hub `workspace/`
- Satellite `workspace/`
- `输出/`、`outputs/`
- `知识/`、`knowledge/`
- `参考资料/`、`references/`
- 任何项目正式成果目录

默认不要生成 `.mjs`、`.js`、`.sh` 等脚本型中间产物。`starworkAudit` 的标准产物是 JSON blueprint 和 Markdown 规则片段；除非用户明确要求调试 CLI，否则不应创建脚本文件。

生成前最多问 3 个问题，且只问会影响蓝图的问题。

推荐问题：

```text
路径失效的这个项目，是已经归档，还是移动到了新位置？
```

```text
共享知识断链时，你希望重建软链接，还是改成本地副本？
```

```text
我可以只在 AGENTS.md 追加新版 Satellite 规则插槽，不覆盖原文，可以吗？
```

## Repair Blueprint 设计原则

`starworkAudit` 生成的蓝图必须保守：

- 不删除。
- 不移动用户内容。
- 不覆盖已有文件。
- 修改范围只限 Hub registry、StarWork state、`.core-sync.json`、handoff 目录、受控规则插槽和共享资源链接。
- 每个 action 都要能解释来源和原因。

蓝图 schema 使用：

```json
{
  "schema": "starwork.repair_blueprint.v0.1",
  "generated_by": "starworkAudit"
}
```

完整 action 见：

```text
../cli/repair-spec.md
```

## 关键判断规则

### Hub 自身有 fail

如果 Hub 自身 doctor fail 或 registry 无法解析：

- 不继续生成跨项目修复蓝图。
- 先解释 Hub 自身问题。
- 只允许生成 Hub 层面的最小修复蓝图。

### Satellite 路径失效

如果 registry 路径不存在：

- 不猜路径。
- 输出该项目为 `blocking`。
- 询问用户是否已移动、归档或删除。
- 只有用户确认新路径后，才能生成 `update_hub_registry` action。

### Satellite 不是 StarWork

如果路径存在但不是 StarWork：

- 不使用 `repair`。
- 解释它可能需要 `doctor -> starworkDoctor -> upgrade`。
- 不把它写进 repair blueprint。

### 旧跨项目路径

如果发现：

```text
_系统/跨项目/
_system/cross-project/
```

处理方式：

- 作为 legacy local handoff 信号。
- 不建议删除旧目录。
- 可建议补齐 `.starwork/handoff/`。
- 是否迁移旧消息内容必须单独确认。

### 共享资源断链

断链不一定等于错误。

需要区分：

- Hub 资源目录是否存在。
- Satellite 目标路径是否存在。
- 目标是软链接、真实目录还是缺失。
- 项目是否刻意使用本地副本。

只有在“目标是断链”或“目标缺失且用户确认要挂 Hub 资源”时，才生成 `repair_symlink`。

## 输出蓝图后的提示

生成 blueprint 后，建议用户先 dry-run：

```bash
starwork repair --blueprint repair-blueprint.json --dry-run
```

用户确认后再执行：

```bash
starwork repair --blueprint repair-blueprint.json --yes
```

执行后再巡检：

```bash
starwork audit --hub <hub-path>
```

## 参考文件

正式实现时建议新增：

```text
product/kit-skills/starworkAudit/
├── SKILL.md
└── references/
    ├── response-guide.md
    ├── issue-taxonomy.md
    └── repair-blueprint-guide.md
```

其中：

- `response-guide.md`：巡检报告话术。
- `issue-taxonomy.md`：问题分类和严重程度。
- `repair-blueprint-guide.md`：如何从 audit 结果生成 repair blueprint。

## 验收标准

第一版 skill 可验收，至少满足：

1. 能读取 `starwork audit --json`。
2. 能把多个项目问题按严重程度分组。
3. 能区分可修复项和必须确认项。
4. 不把 audit JSON 中的事实直接当最终判断。
5. 不建议删除或移动用户内容。
6. 用户明确要求后，能生成符合 `starwork.repair_blueprint.v0.1` 的 blueprint。
7. 输出中能解释 `audit`、`starworkAudit`、`repair` 三者边界。
