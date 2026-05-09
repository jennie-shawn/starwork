# Capability: skill-mount v0.1

`skill-mount` describes how shared skills from a main repository are made available to a satellite workspace.

## Rule

Shared skills should be mounted by symlink, not copied into independent project forks.

Typical mount targets:

```text
.agents/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
.claude/skills/<skill-name> -> /path/to/main-repo/skills/<skill-name>
```

## Boundaries

- Shared skills remain owned by the main repository.
- Project-specific skill modifications must live in a project-specific skill path.
- A satellite workspace must not edit a symlinked shared skill as if it were local project code.

## CLI Responsibility

CLI should install shared skills by creating symlinks and recording them in `.core-sync.json`.
