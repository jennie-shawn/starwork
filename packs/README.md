# StarWork Packs

这里存放 StarWork 场景工作流包。

Pack 由语言无关的业务角色声明和语言相关的落地配置组成：

```text
pack.json
languages/zh.json
languages/en.json
rules/<language>/
templates/<language>/
seed/<language>/
```

## 规格

- [Pack Structure SPEC](./pack-structure-spec.md)

## v0.1 Packs

- `general/`：通用工作默认 Pack。
- `content-creator/`：自媒体内容创作者 Pack。
- `hub-management/`：多项目管理中枢默认 Pack。
