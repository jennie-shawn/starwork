# Agent Lanes 宿主会话命名增强 SPEC

## 状态

- 版本：v0.1 draft
- 所属模块：StarWork Core / CLI / Skills / Adapters
- 相关能力：Agent Lanes
- 相关命令：`starwork multiagent bind`
- 相关 Skill：`starworkMultiagent`
- 输入依据：`_系统/协作/lanes/feature-research/workspace/codex-session-rename-research.md`
- 目标：在 Agent 绑定 lane 时，可选同步修改宿主工具里的会话名称，让用户在 Codex Desktop 等工具侧也能直接看懂该会话的职责。

## 一句话定义

Agent Lanes 负责登记“这个 Agent 会话在项目里负责什么”；宿主会话命名增强负责把这个职责同步给宿主工具的会话标题。

```text
starwork multiagent bind feature-research
  -> StarWork 记录当前 session 绑定到 feature-research lane
  -> 可选把 Codex Desktop 会话名改成“StarWork 新功能预研 Agent”
```

这不是新的协作层，也不是新的事实源。它只是 Agent Lanes 绑定动作后的宿主体验增强。

## 背景

当前 `starwork multiagent bind` 已能把具体 session 绑定到某个 lane，但用户在 Codex Desktop 的会话列表里仍可能只看到原始对话标题。

当一个项目长期使用多个 Agent 会话时，用户真正需要看到的是：

- 这个会话负责什么 lane。
- 这个会话是否是某个稳定职责位的当前接手者。
- 打开会话列表时，不需要靠记忆猜哪个会话是哪个 Agent。

预研已验证 Codex Desktop 支持通过 app-server 协议修改当前 thread 名称，因此 StarWork 可以在绑定 lane 时增加一个可选的 best-effort 同步步骤。

## 产品目标

1. 降低多 Agent 协作时的会话识别成本。
2. 让 `multiagent bind` 更像“登记一个常用智能体”，而不是只写一条内部状态。
3. 保持 StarWork 事实源仍在项目目录内，宿主会话名只作为外部显示增强。
4. 为后续 Codex、Claude Code、Cursor、Trae 等 Adapter 的会话命名能力预留统一接口。

## 非目标

- 不把宿主会话标题当成 StarWork 的事实源。
- 不要求所有 Agent 宿主都支持改名。
- 不直接修改 `~/.codex` 下的 sqlite、jsonl 或其他私有状态文件。
- 不因为宿主改名失败而回滚 lane binding。
- 不在 Core 中写死 Codex 专用实现细节。

## 用户体验

### 推荐入口

用户不需要理解底层参数，可以直接说：

```text
把当前会话登记成 StarWork 新功能预研 Agent，负责 feature-research。
```

`starworkMultiagent` 应解释为：

1. 检查 Agent Lanes 是否已初始化。
2. 检查 `feature-research` lane 是否存在。
3. 必要时生成 `add`。
4. 生成 `bind`。
5. 若用户希望同步宿主会话名，加入 `--session-name`。

### CLI 示例

```bash
starwork multiagent bind feature-research \
  --session codex:$CODEX_THREAD_ID \
  --session-name "StarWork 新功能预研 Agent" \
  --target /path/to/workspace \
  --yes
```

### 交互规则

- 如果用户明确给了会话名称，直接使用。
- 如果用户只给了 lane 和职责，Skill 可以建议一个会话名称，但写入前需要展示给用户确认。
- 如果用户不想改宿主标题，`bind` 仍正常执行。
- 如果宿主改名失败，只提示 warning，不影响 StarWork lane binding。

## CLI 设计

### 新增参数

`starwork multiagent bind <lane-id>` 增加：

```text
--session-name <name>
```

含义：

- 在 lane binding 成功后，尝试将宿主工具中的当前会话标题改为 `<name>`。
- 仅当当前 session 可识别，且当前 Adapter 支持命名时生效。
- 失败不影响 bind 结果。

可选别名暂缓：

```text
--rename-session <name>
```

v0.1 建议先只保留 `--session-name`，避免命令表面过宽。

### 输出行为

dry-run：

```text
Would bind lane feature-research to codex:...
Would rename host session to "StarWork 新功能预研 Agent" if adapter supports it.
```

成功：

```text
Bound lane feature-research to codex:...
Renamed Codex session to "StarWork 新功能预研 Agent".
```

改名失败但绑定成功：

```text
Bound lane feature-research to codex:...
Warning: session name sync failed: <reason>
```

JSON 输出中可增加：

```json
{
  "session_name_sync": {
    "requested": true,
    "supported": true,
    "status": "ok",
    "name": "StarWork 新功能预研 Agent",
    "warning": null
  }
}
```

失败时：

```json
{
  "session_name_sync": {
    "requested": true,
    "supported": true,
    "status": "warning",
    "name": "StarWork 新功能预研 Agent",
    "warning": "Codex app-server unavailable"
  }
}
```

不支持时：

```json
{
  "session_name_sync": {
    "requested": true,
    "supported": false,
    "status": "skipped",
    "name": "StarWork 新功能预研 Agent",
    "warning": "Current session adapter does not support host session naming"
  }
}
```

## Core 协议调整

Agent Lanes Core 增加一个可选概念：

```text
Host Session Display Name
```

定义：

- 宿主工具中展示给用户看的会话名称。
- 可由 StarWork CLI 在 binding 后 best-effort 同步。
- 不作为绑定事实源。
- 不参与冲突判断。
- 不进入 write scope 判断。

`_系统/协作/agent-lanes.md` 中无需新增必填字段。

`.starwork/agent-lanes/state.json` 未来可以记录最近一次同步结果，但 v0.1 不强制引入，避免把增强能力做成状态依赖。

## Adapter 设计

新增内部 Adapter 接口：

```ts
type HostSessionRenameRequest = {
  sessionId: string;
  sessionName: string;
  target?: string;
};

type HostSessionRenameResult = {
  supported: boolean;
  status: "ok" | "skipped" | "warning";
  warning?: string;
};
```

v0.1 只实现 Codex Adapter。

后续 Adapter 可分别支持：

- Codex Desktop：通过 app-server JSON-RPC。
- Claude Code：待调研。
- Cursor：待调研。
- Trae：待调研。

## Codex Adapter 实现要求

### 识别条件

优先条件：

- `sessionId` 以 `codex:` 开头。
- 或当前环境存在 `CODEX_THREAD_ID`。

如果两者不一致，优先使用显式 `--session` 提供的 thread id，并输出轻量 warning 供调试。

### 协议调用

必须通过 Codex app-server JSON-RPC：

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientInfo":{"name":"starwork","version":"0"},"capabilities":null}}
```

然后发送：

```json
{"jsonrpc":"2.0","id":2,"method":"thread/name/set","params":{"threadId":"<CODEX_THREAD_ID>","name":"<session-name>"}}
```

成功条件：

```json
{"id":2,"result":{}}
```

### 禁止行为

不得直接写入：

```text
~/.codex/state_5.sqlite
~/.codex/session_index.jsonl
```

这些是 Codex 私有状态，直接改写可能绕过桌面端缓存、索引和通知机制。

### 失败处理

以下情况均为 warning，不影响 bind：

- `codex` 命令不存在。
- app-server 启动失败。
- JSON-RPC initialize 失败。
- `thread/name/set` 返回错误。
- 当前宿主不是 Codex。
- 找不到 thread id。

## Skill 调整

`starworkMultiagent` 增加判断：

当用户说“把当前会话创建为 / 登记为 / 命名为某 Agent”时，除了 lane binding，还应判断是否需要同步宿主会话名。

Skill 应追问或确认：

- lane ID。
- 职责描述。
- 写入范围。
- session ID。
- 宿主会话显示名称。

建议命名格式：

```text
<项目或产品名> <职责> Agent
```

示例：

```text
StarWork 新功能预研 Agent
StarWork CLI 维护 Agent
GFM 课程审校 Agent
```

Skill 不应强制所有 bind 都改名。若用户只要求内部绑定，则不加 `--session-name`。

## 安全与权限

- 写入类命令仍默认 dry-run。
- `--session-name` 只在用户确认后执行。
- 改名是宿主侧副作用，必须在 dry-run 中明确展示。
- 改名失败不得回滚 `_系统/协作/agent-lanes.md`。
- 不得在用户未确认时猜测并写入宿主会话名。

## 测试计划

### CLI 单元测试

- `multiagent bind` 接受 `--session-name`。
- dry-run 不调用 Adapter。
- bind 成功后才调用 Adapter。
- Adapter warning 不导致命令失败。
- JSON 输出包含 `session_name_sync`。
- 未传 `--session-name` 时保持现有行为。

### Codex Adapter 测试

- 模拟 app-server 返回 success。
- 模拟 app-server unavailable。
- 模拟 JSON-RPC error。
- 模拟无 `CODEX_THREAD_ID` 且 session 不是 `codex:`。

### 手动验收

在 Codex Desktop 中运行：

```bash
starwork multiagent bind feature-research \
  --session codex:$CODEX_THREAD_ID \
  --session-name "StarWork 新功能预研 Agent" \
  --yes
```

验收：

1. `_系统/协作/agent-lanes.md` 中 lane 绑定成功。
2. Codex Desktop 当前会话标题被修改。
3. `~/.codex/session_index.jsonl` 中出现同 thread id 的 `thread_name` 更新记录。
4. 如果改名失败，命令仍返回 bind 成功，并显示 warning。

## 实施步骤

1. 更新 `product/core/agent-lanes-spec.md`，加入 Host Session Display Name 的非事实源定义。
2. 更新 `product/skills/starworkMultiagent-spec.md` 和 `product/skills/starworkMultiagent/SKILL.md`，加入 `--session-name` 交互判断。
3. 在 `product/cli/src/cli.js` 为 `multiagent bind` 增加 `--session-name` 参数解析。
4. 抽出内部 host session adapter，先实现 Codex app-server rename。
5. 为 bind dry-run、成功、warning、JSON 输出补测试。
6. 更新 CLI help 文案和 `product/docs/cli-skill-registry.html` 中的 multiagent 能力说明。

## 开放问题

1. `--session-name` 是否需要支持自动模板，例如根据 lane purpose 生成名称。
2. 是否需要在 `.starwork/agent-lanes/state.json` 记录最近一次宿主改名结果。
3. 非 Codex 宿主的 session naming 能力如何调研和暴露。
4. 用户手动修改宿主会话名后，StarWork 是否需要检测偏差。v0.1 建议不检测。
