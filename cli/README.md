# StarWork CLI

这里存放 StarWork CLI 源码、命令设计和命令级文档。

## v0.1 边界

v0.1 只覆盖最小可用安装和适配能力：

- `starwork init`
- `starwork doctor`
- `starwork adapt`
- `starwork pack install content-creator`

第一阶段重点：

- 能从空文件夹初始化 StarWork Core
- 能检查工作区结构是否完整
- 能生成或更新当前 Agent 所需适配文件
- 能安装自媒体内容创作者 Pack
- 安装和更新时不覆盖用户已有内容

CLI 不在 v0.1 阶段处理账号、授权、消息平台 gateway 或复杂商业系统。

## 命令规格

- [`starwork init` SPEC](./init-spec.md)

## 本地运行

```bash
node cli/bin/starwork.js init --type single-light --pack general --dry-run
```
