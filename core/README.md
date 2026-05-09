# StarWork Core

StarWork Core is the workspace protocol for AI-assisted projects.

Core v0.1 defines:

- what an Agent reads first
- where project status and current work live
- how process materials stay separate from formal sources of truth
- how lightweight `references/outputs` workspaces and Matter-based workspaces coexist
- how CLI, adapters, packs, and templates can build on the same protocol

## Repository Model

Core is maintained as one baseline plus composable profiles and capabilities:

```text
product/core/
├── baseline/       # shared semantics every Core workspace follows
├── profiles/       # language/path mappings such as zh and en
├── capabilities/   # optional capabilities such as Starter Mode and Matter Mode
├── presets/        # recipes for user-facing workspace states
└── kits/           # copyable starter kits assembled from presets
```

## Maintenance Rule

- Change shared rules in `baseline/`.
- Change path, template language, CLI prompts, and user-facing labels in `profiles/`.
- Change optional behavior in `capabilities/`.
- Change user-facing combinations in `presets/`.
- Treat `kits/` as generated or assembled outputs, not the source of truth.

## Hub + Satellite Model

The multi-project model is represented by `main-repo-sync`, not by separate `shared-identity` and `shared-lessons` toggles.

In this model:

- the hub owns reusable rules, identity, lessons, knowledge, shared skills, project registry metadata, cross-project messages, and writeback review
- satellite workspaces own project status, current work, process materials, project decisions, and formal project source of truth
- snapshots, read-only links, `.core-sync.json`, and review queues define the sync boundary
- the hub reads satellite status; it does not copy the status body into the registry

## v0.1 Scope

Core v0.1 is intentionally small. It freezes the minimum workspace semantics before CLI, packs, and adapters add automation.

Core does not contain content-creator-specific workflow logic. That belongs in `product/packs/content-creator/`.
