# huedash agent guide

Self-hosted Philips Hue dashboard. Stack, architecture, and planning rules live in `openspec/config.yaml`. Read it before planning or coding.

## Workflow

All work goes through OpenSpec changes:

1. `/opsx:explore` - think through an idea. No code.
2. `/opsx:propose <name>` - write proposal, specs, design, tasks.
3. `/opsx:apply` - implement the tasks, check them off as you go.
4. `/opsx:archive` - archive after review.

Planned changes, in order:

1. `agent-setup` - this guide, OpenSpec config, skills
2. `project-setup` - SvelteKit, shadcn-svelte, bits-ui, lint, format
3. `testing-setup` - Vitest, Playwright, mock Hue bridge
4. `ci-docker` - Dockerfile, compose example, GitHub Actions, GHCR
5. `bridge-pairing` - setup wizard, `/data` config, env override
6. `room-control` - rooms and zones: on/off, brightness, color temp, color
7. `scenes` - list and activate scenes
8. `live-updates` - bridge event stream to the browser via SSE

## Library first

Before writing code we would have to maintain, search for a maintained library: recent releases, active repo, real usage. Record the choice, the evidence, and the alternatives in the change's `design.md`. Custom UI components build on bits-ui primitives when one fits.

## Skills

Use these skills for the matching work.

| Work | Skill | Where |
|---|---|---|
| Svelte components and modules | `svelte:svelte-code-writer`, `svelte:svelte-core-bestpractices`, `svelte:svelte-file-editor` agent, Svelte MCP | Global plugin `svelte` from marketplace `sveltejs/ai-tools` |
| shadcn-svelte components, theming | `shadcn-svelte` | Project |
| Dockerfile | `multi-stage-dockerfile` | Project |
| GitHub Actions workflows | `github-actions-templates` | Project |
| Interface design | `interface-design` | Global, `npx skills add dammyjay93/interface-design -g` |
| UI copy | `ux-writing` | Global, `npx skills add content-designer/ux-writing-skill -g` |
| Browser checks and e2e | `playwright-cli` | Global, `npx skills add microsoft/playwright-cli -g` |
| Library docs | `find-docs` | Global, from Context7 (`npx ctx7`) |

Notes:

- `github-actions-templates` pins older action versions. Check the latest major version of each action before use.
- No Tailwind skill is installed. `wshobson/agents@tailwind-design-system` targets Tailwind v4 but builds its own token system, which conflicts with shadcn-svelte theming. Use semantic tokens from shadcn-svelte.
- Project skills are tracked in `skills-lock.json`. Manage them with `npx skills` (`list`, `check`, `update`, `add -a claude-code`). Read a skill's `SKILL.md` before installing it.

## Git

- Conventional commits, imperative subject under 50 characters.
- Atomic commits. Body only when the why is not obvious.
