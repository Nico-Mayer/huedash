# Design

## Context

The folder has no git repository and no code. It has `mise.toml` (pins the OpenSpec CLI only), an empty `openspec/config.yaml` template, and `.claude/` with the OpenSpec skills and `opsx` commands.

Skills already available globally on this machine and relevant to the stack: the official Svelte plugin (`svelte-code-writer`, `svelte-core-bestpractices`, `svelte-file-editor` agent, Svelte MCP server), `interface-design`, `ux-writing`, `playwright-cli`, `find-docs`.

Findings about the skills CLI (`skills` on npm, `vercel-labs/skills`): v1.7.4, active. It requires Node.js 22.20 or later. It installs per project by default (`-g` for global), selects the agent with `-a claude-code`, and has `find`, `list`, `check`, `update`, `remove`. `experimental_install` restores from `skills-lock.json`.

`npx skills find` results for gaps in the stack:

| Area | Candidate | Notes |
|---|---|---|
| shadcn-svelte, bits-ui | `huntabyte/shadcn-svelte@shadcn-svelte` | From the shadcn-svelte and bits-ui maintainer, 6.8K installs |
| Svelte 5 / SvelteKit | official Svelte plugin (global) | Third-party Svelte skills not needed |
| Tailwind | `wshobson/agents@tailwind-design-system` | 71K installs, third party |
| Dockerfile | `github/awesome-copilot@multi-stage-dockerfile` | Maintained by GitHub |
| GitHub Actions | `wshobson/agents@github-actions-templates`, `callstackincubator/agent-skills@github-actions` | Third party |

## Goals / Non-Goals

**Goals:**
- One source of agent guidelines that works for Claude Code and other agents.
- Project skills that are reproducible on another machine.
- UI copy and interface standards that later feature changes can point to.

**Non-Goals:**
- No SvelteKit scaffold, package manager choice, or app dependencies (project-setup).
- No CI workflows or Dockerfile (ci-docker).
- No custom skills written by us.

## Decisions

### AGENTS.md is the source, CLAUDE.md imports it
`AGENTS.md` holds the guidelines. `CLAUDE.md` contains only `@AGENTS.md` plus any Claude-only notes.
- Alternative: only `CLAUDE.md`. Rejected: other agents read `AGENTS.md`.
- Alternative: duplicate content in both. Rejected: they drift.

### Prefer global skills, install only what is missing
The guidelines name the global skills to use for each task (Svelte work, UI design, UI copy, browser tests, library docs). Project installs cover only gaps.
- Alternative: install everything per project. Rejected: duplicates the official Svelte plugin and the other global skills.

### Project skills via `npx skills add -a claude-code`, committed with the lock file
Install per project (no `-g`) so the setup travels with the repo. Commit the installed skill files and `skills-lock.json`.
- Alternative: global installs. Rejected: not reproducible for other contributors.

Install set:
- `huntabyte/shadcn-svelte@shadcn-svelte`
- `github/awesome-copilot@multi-stage-dockerfile`
- One GitHub Actions skill, chosen after reviewing both candidates' `SKILL.md`
- `wshobson/agents@tailwind-design-system` only if its content matches Tailwind v4 and shadcn-svelte conventions

Each skill's `SKILL.md` is read before install. A skill that runs unexpected commands or fetches remote scripts is rejected.

### Library-first rule lives in `openspec/config.yaml`
Stack and architecture go into `context`. Per-artifact `rules`:
- design: record chosen libraries with maintenance evidence (last release, repo activity) and alternatives considered.
- tasks: prefer adding a maintained dependency over custom code; custom UI components build on bits-ui primitives.

Feature work then has to follow the rule as part of the OpenSpec flow, not only when someone remembers it.

### UI standards as two docs under `docs/`
- `docs/ui-copy.md`: voice, tone, terms (light, room, zone, scene, bridge), button and label style, error, empty, and loading states. Drafted with the `ux-writing` skill.
- `docs/ui-standards.md`: layout, spacing and color tokens, component states, touch targets, use of shadcn-svelte vs. custom bits-ui components. Drafted with the `interface-design` skill.

`AGENTS.md` links to both.
- Alternative: put everything in `AGENTS.md`. Rejected: makes the always-loaded context too large.

### Node pinned in `mise.toml`
Pin Node.js 24 LTS in `mise.toml`. It meets the skills CLI minimum (22.20) and is the base for project-setup.

### Public GitHub repo, created with `gh`
Assumption: the repo is public, because the image is meant for others to self-host. `git init` with `main` as the default branch, add a `.gitignore`, then `gh repo create --public --source . --push` after the first commit.

## Risks / Trade-offs

- [Third-party skills contain bad or outdated advice] → Review `SKILL.md` before install. Prefer maintainer-owned skills. `npx skills check` before later changes.
- [Skills CLI changes, `experimental_install` is unstable] → Committed skill files work without the CLI. The lock file is a convenience only.
- [Skill installs run remote code] → Run with `DISABLE_TELEMETRY=1`, pin the CLI version in commands, review the diff before commit.
- [Global skills differ per machine] → `AGENTS.md` names them and says how to get them. Missing global skills do not block work.
