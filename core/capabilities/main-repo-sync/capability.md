# Capability: main-repo-sync v0.1

`main-repo-sync` describes the Hub + Satellite model used by a main repository and its satellite workspaces.

It is not just shared identity or shared lessons. It is a whole coordination model:

- the hub is the rule source, reusable-knowledge source, project registry, skill source, and message router
- satellites are execution workspaces
- initialization copies stable snapshots
- selected resources are mounted as read-only links
- sync metadata is tracked in `.core-sync.json`
- project discovery is tracked in the hub registry
- reusable updates flow back through an inbox/review process

## Core Model

One sentence:

> The hub owns shared, reusable, auditable mechanisms; each satellite owns its own project facts and execution process.

This means the hub can find, initialize, synchronize, and message satellites. It does not become the progress database for those satellites.

## Hub Responsibilities

The hub owns cross-project reusable resources:

- `identity/`
- `lessons/`
- `.internal/` protocols
- `knowledge/`
- shared skills
- project registry
- cross-project message routing
- incoming review queue for reusable writeback

It should not store project-specific execution content.

## Satellite Workspace Responsibilities

The satellite workspace owns project execution:

- project status
- current work
- process materials
- formal project source of truth
- project-specific decisions and outputs

It may contain snapshots or links from the main repository, but those resources remain shared reference layers by default.

## Satellite Required Layer

A hub-managed satellite normally contains these fixed layers:

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `.core-sync.json`
- `identity/`
- `lessons/`
- `.internal/`
- `.obsidian/`
- `knowledge/` as a read-only link
- `_系统/上下文/current-projects.md` or `_system/context/current-projects.md` for current hub compatibility
- `_系统/任务/` or `_system/tasks/`
- `_系统/跨项目/` or `_system/cross-project/`
- `_系统/diary/` or `_system/diary/`

StarWork Core may introduce `project-status.md` as a clearer canonical role name, but hub-compatible presets must still support the current `current-projects.md` fact source.

## Sync Semantics

| Resource | Satellite representation | Default sync semantics |
|---|---|---|
| `identity/` | Copied snapshot | Initialized from main repo; later updates are manual and confirmed. |
| `lessons/` | Copied snapshot | Initialized from main repo; project-specific lessons stay local until reusable. |
| `.internal/` | Copied selected protocol files | Only sync stable protocols such as writeback and merge policy. |
| `.obsidian/` | Copied config | Provides default local Obsidian behavior. |
| `knowledge/` | Read-only symlink | Main repo remains the source of truth. |
| `.core-sync.json` | Local metadata | Records source path, version, sync time, mounted resources, and skills. |
| shared skills | Symlink | Do not copy shared skills into independent project forks. |

## Registry Boundary

The hub `projects/registry.json` stores discovery and sync metadata:

- project id
- name
- path
- status
- created date
- last sync
- core version
- sync mode
- shared resources

It must not store project progress body text.

Project progress remains in the satellite workspace, typically in:

- `_系统/上下文/current-projects.md`
- `_system/context/current-projects.md`
- or the Core v0.1 project status role declared by the profile

## Status Read Order

Tools and adapters should read project status in this order:

1. the status file declared by the workspace rules or preset
2. `_系统/上下文/current-projects.md`
3. `_system/context/current-projects.md`
4. `_系统/上下文/project-status.md`
5. `_system/context/project-status.md`

If multiple files exist, the workspace rules must identify the one fact source. The other file should be an alias, pointer, or generated copy, not an independently maintained second status file.

## Writeback Boundary

Reusable suggestions from a satellite workspace should go through the main repository review flow, such as `.incoming/`.

Cross-project handoff is for project-to-project requests, dependencies, notices, and handoffs. It is not a replacement for the main repository reusable-knowledge review queue.

| Mechanism | Purpose | Changes hub formal content? |
|---|---|---:|
| `.incoming/` | Satellite proposes reusable identity, lesson, report, or knowledge changes to the hub. | Only after hub review. |
| cross-project handoff | One project sends another project a request, update, dependency, or reply. | No. |

## Lifecycle

| Status | Meaning | Hub behavior |
|---|---|---|
| `active` | The project is currently being worked on. | Include in normal project discovery and status reading. |
| `paused` | The project is intentionally idle but may resume. | Keep registry entry and project facts; do not treat silence as failure. |
| `archived` | The project is historical reference. | Keep registry entry and project directory; skip by default in live summaries. |
