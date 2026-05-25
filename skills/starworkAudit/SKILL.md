---
name: starworkAudit
description: Use this skill when a user wants an AI-readable and user-readable diagnosis of a Hub audit result, including interpreting `starwork audit --json`, prioritizing Satellite project issues, asking only necessary repair questions, and generating a conservative `starwork repair --blueprint` plan.
---

# starworkAudit

使用这个 skill，把 `starwork audit --json` 暴露的 Hub 与 Project Satellite 巡检事实解释成人能理解的报告；当用户明确要求修复时，生成 `repair-blueprint.json`，交给 `starwork repair --blueprint` 执行。

`starworkAudit` 不是 `starwork audit` 命令本身，也不是 `starwork repair` 执行器。

```text
starwork audit = Hub 巡检器，只列事实
starworkAudit = 巡检诊断师 + repair blueprint 设计师
starwork repair = 修复蓝图执行器
```

## 工作流程

1. 优先运行或读取：

```bash
starwork audit --hub <hub-path> --json --inventory-depth all
```

2. 先给用户一句话结论：

```text
这个 Hub 登记了 8 个项目，其中 7 个可访问，1 个路径失效。当前最优先处理路径失效和同步关系问题，规则更新可以放在第二批。
```

3. 按严重程度分组：

- `blocking`：路径失效、不是 StarWork、workspace state 无法解析。
- `high`：Hub path / project_id / sync metadata 不一致。
- `repairable`：缺 `.starwork/handoff/`、缺 state.json、规则插槽缺失。
- `notice`：长期未更新、旧路径残留、联络队列积压。

4. 区分可直接生成蓝图的问题和需要用户确认的问题。

可直接生成蓝图：

- 补 `.starwork/handoff/` 子目录。
- 补 `.starwork/handoff/state.json`。
- 用户已确认后修 registry path。
- 用户已确认后重写 `.starwork/sync.json` 和 legacy `.core-sync.json`。

必须确认：

- 项目是否已归档。
- 失效路径的新位置。
- 断链知识入口是重建软链接还是保留本地副本。
- 旧 `_系统/跨项目/` 是否要迁移内容。

5. 只有用户明确要求“生成修复蓝图 / 执行 dry-run / 帮我修”时，才生成 `repair-blueprint.json`。

## 约束

- 不直接改文件。
- 不建议删除项目记录。
- 不移动用户内容。
- 不合并 `.incoming/`。
- 不修改 identity / lessons / knowledge 正文。
- 不把旧 `project` 作为新标准；它只是 legacy Project Satellite + historical 事项-content signal 信号。

## 参考

完整边界见：

```text
../starworkAudit-spec.md
../../cli/audit-spec.md
../../cli/repair-spec.md
```
