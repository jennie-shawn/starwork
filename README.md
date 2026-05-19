# StarWork

StarWork is an AI workspace protocol and toolkit for keeping long-running work organized across agents, projects, and sessions.

It provides:

- **Core**: workspace structures, roles, health checks, and project-state conventions.
- **CLI**: commands for creating, checking, adapting, extending, and spawning workspaces.
- **Packs**: scenario templates for common workflows.
- **Skills**: Agent workflows that help Codex and other agents design StarWork workspaces.

StarWork is currently in early A-test. The current package is intended for installation testing, workflow validation, and product feedback.

## Install

Install the CLI globally:

```bash
npm install -g @jennie-shawn/starwork
starwork --help
```

Or run it without global installation:

```bash
npx @jennie-shawn/starwork --help
```

## Install Skills

StarWork skills are distributed through the `skills` CLI from the GitHub repository.

Install all StarWork skills for Codex:

```bash
npx skills add jennie-shawn/starwork --skill '*' -g -a codex -y
```

Install individual skills:

```bash
npx skills add jennie-shawn/starwork --skill starworkInit -g -a codex -y
npx skills add jennie-shawn/starwork --skill starworkSpawn -g -a codex -y
```

Available skills:

- `starworkInit`: helps an agent design a friendly `starwork init` plan for a new workspace.
- `starworkSpawn`: helps an agent design a `starwork spawn --blueprint` plan for a satellite workspace.

## Quick Start

Create a single-project workspace:

```bash
starwork init \
  --type single-matter \
  --pack general \
  --name "StarWork A Test" \
  --target ~/Desktop/starwork-a-test \
  --yes
```

Check the workspace:

```bash
starwork doctor --target ~/Desktop/starwork-a-test
```

Create a multi-project Hub:

```bash
starwork init \
  --type hub \
  --name "StarWork Hub A Test" \
  --target ~/Desktop/starwork-hub-a-test \
  --yes
```

Spawn a project from the Hub:

```bash
starwork spawn \
  --hub ~/Desktop/starwork-hub-a-test \
  --name "Alpha Project" \
  --target ~/Desktop/starwork-alpha-project \
  --mode matter \
  --yes
```

Check the spawned project:

```bash
starwork doctor --target ~/Desktop/starwork-alpha-project
```

## CLI Commands

```text
starwork init
starwork doctor
starwork spawn
starwork adapt
starwork pack install
```

Current capabilities:

- `init`: creates a local starter workspace, local matter workspace, or multi-project Hub.
- `doctor`: checks workspace health, required files, Pack installation, and blueprint customization.
- `spawn`: creates and registers a satellite project from an existing Hub.
- `adapt`: generates Agent-specific adapter files for Claude Code, Cursor, and related tools.
- `pack install`: installs supported Packs into compatible workspaces.

## Repository Structure

```text
.
├── core/       # StarWork Core protocol, kits, profiles, and presets
├── cli/        # CLI implementation and command specifications
├── packs/      # Scenario Packs
├── skills/     # Agent skills
├── schemas/    # Structured schemas
├── adapters/   # Agent adapter rules
├── examples/   # Examples and sample snippets
└── docs/       # Product documentation and A-test guides
```

## A-test Notes

This release is intended for early testers. Please focus feedback on:

- whether the CLI installs and runs cleanly;
- whether generated workspace structures are easy to understand;
- whether `doctor` explains problems clearly;
- whether Hub + Satellite workflows feel natural;
- whether `starworkInit` and `starworkSpawn` can be discovered and used by Codex.

For a fuller test script, see [docs/alpha-test-guide.md](docs/alpha-test-guide.md).

## Development

Run the test suite:

```bash
npm test
```

Preview the npm package contents:

```bash
npm pack --dry-run
```
