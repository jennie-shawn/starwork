# StarWork Skills

这里存放 StarWork 自研 Agent skill。

Skill 的职责不是替代 CLI，而是帮助 Agent 更可靠地理解用户意图、生成配置、组织规则和调用 StarWork 工具。

## 路由规则

- 与 Core 协议相关的事实源放在 `product/core/`。
- 与 CLI 命令相关的规格和实现放在 `product/cli/`。
- 与 Pack 场景相关的正式包放在 `product/packs/`。
- 与 Agent 工作流相关、可被复用为 skill 的内容放在 `product/skills/`。

## 当前 Skills

- `starworkSpawn/`：帮助 Agent 设计 `starwork spawn --blueprint` 工作台定制单。
- `starworkInit/`：帮助 Agent 设计 `starwork init` 初始化方案和 init blueprint。详细 SPEC 见 `starworkInit-spec.md`。
