# File Boundaries v0.1

## Required Baseline Files

| File role | Write here | Do not write here |
|---|---|---|
| `agent.entry_rules` | How Agents should work in this workspace. | Project status, task history, draft content. |
| `system.context.project_status` | Goal, stage, focus, risks, formal source locations. | Single-session notes, draft bodies, detailed matter progress. |
| `system.tasks.current_work` | Current task, active matter, blockers, waiting questions. | Long-term background, complete designs, project history. |

## Optional Capability Files

| Capability | Boundary |
|---|---|
| `decisions` | Only high-impact confirmed decisions that affect future work. |
| `starter-outputs` | `references/` is read-only source material; `outputs/drafts/` is unapproved AI work; `outputs/final/` is user-approved output. |
| `matter-mode` | `matters/` is process workspace; mature content must be promoted to the project formal source of truth. |
| `local-identity` | Project-local identity reference, changed only with user confirmation. |
| `local-lessons` | Project-local reusable lessons, not ordinary retrospectives. |
| `main-repo-sync` | Hub resources enter a satellite workspace through snapshots, read-only links, metadata, and review queues; hub registry never stores project progress body text. |
| `skill-mount` | Shared skills are symlinked from the main repository, not copied into independent forks. |

## Formal Source Rule

Every workspace must declare where formal source-of-truth content belongs. Core does not require that directory to be named `product/`.
