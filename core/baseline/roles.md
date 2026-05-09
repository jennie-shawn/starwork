# Core Roles v0.1

## Canonical Roles

| Canonical role | Required | Description |
|---|---:|---|
| `agent.entry_rules` | Yes | Entry rules for all Agents working in the project. |
| `system.context.project_status` | Yes | Slow-changing project state. |
| `system.tasks.current_work` | Yes | Current work, blockers, and next handoff point. |
| `system.context.decisions` | No | High-impact decision log. |
| `work.starter.references` | No | Read-only source materials for Starter Mode. |
| `work.starter.outputs_drafts` | No | AI drafts awaiting user review. |
| `work.starter.outputs_final` | No | User-approved outputs. |
| `work.matters.registry` | No | Matter index for Matter Mode. |
| `identity.local` | No | Project-local identity reference. |
| `lessons.local` | No | Project-local reusable lessons. |
| `main_repo.sync_metadata` | No | Main-repository sync metadata for satellite workspaces. |
| `main_repo.knowledge_link` | No | Read-only shared knowledge link. |
| `main_repo.internal_protocols` | No | Copied internal protocol snapshots. |
| `main_repo.skill_mounts` | No | Symlinked shared skills. |

## Rule

Profiles map canonical roles to concrete paths. Capabilities may require or recommend additional roles, but they must not change the meaning of baseline roles.

`system.context.project_status` is intentionally named by role. A preset may map it to `project-status.md`, `current-projects.md`, or another declared file as long as the workspace has exactly one project-status fact source.
