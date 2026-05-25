# Repair Blueprint Guide

`starworkAudit` 生成的 repair blueprint 必须保守。

允许的首版动作：

- `ensure_dir`
- `write_file_if_missing`
- `rewrite_core_sync`
- `update_hub_registry`
- `update_workspace_state`

默认不要生成：

- 删除动作
- 移动用户目录
- 覆盖正式成果
- 合并 `.incoming/`
- 修改 identity / lessons / knowledge 正文

执行前应提示用户先运行：

```bash
starwork repair --blueprint repair-blueprint.json --dry-run
```

确认后再运行：

```bash
starwork repair --blueprint repair-blueprint.json --yes
```
