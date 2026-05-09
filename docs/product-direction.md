# StarWork 产品方向

## 产品定位

StarWork 是面向 Codex、Claude Code、Cursor、Trae、Claw Code 等 Agent 的 AI 工作系统套件，用于支持用户和 Agent 进行长期、连续、可审计的真实工作协作。

StarWork 不是完整自研 Agent Runtime，也不是单纯开源文件夹模板。它的产品价值在于工作系统层：让 Agent 能稳定理解、继续、记录、复盘和改进用户的长期工作。

## 产品四层

StarWork 拆成四层：

1. StarWork Core：开源 AI 工作区协议
2. StarWork CLI：安装、检查、适配和 Pack 管理工具
3. StarWork Packs：面向岗位和场景的工作流包
4. StarWork Course：方法论课程与陪跑服务

四层分工：

- Core 负责可信度、标准和传播。
- CLI 负责产品感、安装体验和降低门槛。
- Packs 负责具体场景解决方案和商业化。
- Course 负责教育、转化、高客单服务和方法论表达。

Course 层继续由 `珍妮丁丁GFM` 承载。本项目承载产品本体：Core、CLI、Packs、Adapters、schemas、examples、正式产品文档和发布材料。

## 方向约束

- 不复用 `/Users/shuxinding/Project/StarWork` 作为产品基础，该目录只作为 `legacy runtime spike` 参考。
- 不把自研完整 Agent Runtime 作为 v0.1 主线。
- 不把 Claude Code SDK、Claude Agent SDK 或海外服务作为默认产品依赖。
- 第一阶段不做 OpenClaw 式消息平台 gateway。
- 不把 StarWork 讲成“文件夹模板”；文件结构只是 Core 协议的可见载体。
- 不把课程材料直接搬进本产品项目，除非已经晋升为产品事实、正式文档、示例或 Pack 资产。

## 首个产品闭环

第一阶段产品闭环是：

```text
Core v0.1 协议
        ↓
CLI v0.1 安装与适配
        ↓
自媒体内容创作者 Pack v0.1
        ↓
Demo 工作区与产品文档
```

目标是证明：普通内容创作者可以安装 StarWork，加入自媒体内容创作者 Pack，并让 Agent 清楚知道灵感、选题、草稿、发布记录、复盘数据、用户反馈和下一步动作分别放在哪里。
