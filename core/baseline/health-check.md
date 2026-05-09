# Core Health Check v0.1

A workspace is Core v0.1 healthy when:

- `agent.entry_rules` exists.
- `system.context.project_status` exists.
- `system.tasks.current_work` exists.
- The formal source of truth is declared in the entry rules or project status.
- Optional capability files, if present, follow their file boundaries.
- Satellite workspaces using `main-repo-sync` include `.core-sync.json`.

## Warnings

A checker should warn when:

- `current-work.md` contains long project history.
- the project status file contains task-level progress, whether it is named `project-status.md` or `current-projects.md`.
- `decisions.md` contains meeting notes or local draft choices.
- `references/` is modified as if it were generated output.
- Matter drafts are treated as final source-of-truth content.
- A satellite workspace edits main-repository snapshots or symlinked skills without confirmation.

## Compatibility

`system.context.project_status` is a role, not a mandatory filename.

For current hub-managed Chinese workspaces, `_系统/上下文/current-projects.md` remains the live compatibility fact source. StarWork Core may use `project-status.md` in simpler new kits, but checkers and adapters must not assume that filename is universal.
