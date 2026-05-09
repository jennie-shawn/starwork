# Core Baseline v0.1

## Definition

StarWork Core Baseline is the minimum semantic contract for a workspace that AI Agents and humans can share.

It defines roles, boundaries, and health checks. It does not define a business domain, a specific Agent runtime, or a single language path layout.

## Required Roles

A Core v0.1 workspace must provide these roles:

| Role | Purpose |
|---|---|
| `agent.entry_rules` | Cross-Agent working rules. |
| `system.context.project_status` | Stable project status and source-of-truth pointers. |
| `system.tasks.current_work` | Current work entry point for the next Agent session. |

## Required Behaviors

- Agents must read the entry rules before changing the workspace.
- Current work must have a stable entry file.
- Formal sources of truth must be declared by the project.
- Process materials must not be silently promoted into formal sources of truth.
- Read-only reference layers must not be rewritten without explicit user confirmation.

## Optional Capabilities

Capabilities can add files and behaviors without redefining the baseline:

- `starter-outputs`
- `matter-mode`
- `decisions`
- `local-identity`
- `local-lessons`
- `main-repo-sync`
- `skill-mount`

## Non-Goals

Core v0.1 does not define:

- Pack-specific workflows
- CLI command implementation
- Agent-specific runtime behavior
- A mandatory machine-readable manifest
- A required `matters/` directory for every user
