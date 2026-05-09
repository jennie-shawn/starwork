# Capability: matter-mode v0.1

Matter Mode is the long-running work tracking mode.

## Adds

```text
matters/registry.md
matters/<matter-id>/
```

## Matter Structure

```text
matters/<matter-id>/
├── README.md
├── progress.md
├── notes.md
├── drafts/
└── handoff.md
```

## Rules

- `matters/registry.md` is an index, not a progress log.
- A matter directory is a process workspace, not the final source of truth.
- Mature drafts must be promoted into the project formal source of truth.
- Creating, pausing, and archiving matters should be handled by a matter maintenance rule or skill.

## Skill Requirement

Matter Mode should be paired with `matter-workspace`.

In the current main repository, the reference skill lives at:

```text
/Users/shuxinding/digital-twin-core/skills/matter-workspace/
```

When CLI supports Matter Mode, it should install or symlink the skill rather than copying it into an independent fork.
