# `starwork pack install` SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork CLI
- 命令：`starwork pack install`
- 实现状态：v0.1 最小实现已落地
- 目标：在已有 StarWork 工作台中安全补装场景 Pack

## 一句话定义

`starwork pack install` 是 StarWork 的场景扩展命令。

`init` 负责第一次生成 Kit + Pack 的最终工作台；`pack install` 负责在已有健康工作台上补装新的 Pack。

## 设计原则

1. 安装前必须通过 `doctor` 的阻塞检查。
2. Pack 必须支持当前工作区类型。
3. Pack 路径、seed、templates 按工作区语言落地。
4. Pack 规则追加到 `AGENTS.md`，但不重写用户已有规则。
5. 安装结果写入 `.starwork/workspace.json`。
6. 已安装 Pack 不重复安装。

## 命令形式

```bash
starwork pack install content-creator
starwork pack install content-creator --target ./my-workspace --yes
starwork pack install content-creator --dry-run
```

## v0.1 行为

安装 Pack 时，CLI 会：

1. 定位 StarWork 工作台。
2. 读取 `.starwork/workspace.json`。
3. 运行阻塞级 `doctor` 检查。
4. 读取 Pack 的 `pack.json` 和 `languages/<language>.json`。
5. 校验 Core 版本和工作区类型。
6. 创建 Pack 目录。
7. 写入 Pack seed。
8. 复制 Pack templates 到 `.starwork/packs/<pack-id>/templates/`。
9. 将 Pack 规则追加到 `AGENTS.md`。
10. 更新 workspace state。

## v0.1 不做什么

- 不卸载 Pack。
- 不升级已安装 Pack。
- 不解决多个业务 Pack 的复杂冲突。
- 不删除或移动用户文件。
- 不执行 Pack 脚本。

## 验收标准

- 在 `single-light + general` 工作台上安装 `content-creator` 后，`doctor` 仍通过。
- workspace state 中记录新 Pack。
- Pack seed 和 templates 落地。
- `AGENTS.md` 中出现 Pack 规则标记。
- 不支持当前工作区类型的 Pack 会被拒绝。
