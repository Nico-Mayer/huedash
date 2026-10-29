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

## Commands

Tools (Node, pnpm) are pinned in `mise.toml`. Run `mise install` once.

| Command                                    | Does                                        |
| ------------------------------------------ | ------------------------------------------- |
| `pnpm dev`                                 | Dev server                                  |
| `pnpm build`                               | Production build to `build/` (adapter-node) |
| `pnpm check`                               | Type check with svelte-check                |
| `pnpm lint`                                | Prettier check and ESLint                   |
| `pnpm format`                              | Format with Prettier                        |
| `pnpm dlx shadcn-svelte@latest add <name>` | Add a shadcn-svelte component               |
| `pnpm test`                                | Unit, component, and e2e tests              |
| `pnpm test:unit`                           | Vitest in watch mode (`--run` for once)     |
| `pnpm test:e2e`                            | Playwright against the production build     |
| `pnpm exec playwright install chromium`    | Install the browser for tests (once)        |

Imports use SvelteKit 3 subpath aliases (`#lib`). Name the file, not the folder: `#lib/components/ui/card/index.js`.

## Tests

- Unit tests: `*.test.ts` (Node). Component tests: `*.svelte.test.ts` (browser). E2E tests: `*.e2e.ts`.
- The mock Hue bridge lives in `src/mocks/bridge/` (MSW handlers and fixtures) and answers at `192.0.2.10`. Unit tests and the e2e server use it. Requests without a handler fail.
- Files in `src/mocks/` import each other with `.ts` extensions, because Node loads them directly in the e2e preload.

## CI and image

- `.github/workflows/ci.yml` runs lint, check, unit, and e2e tests on every PR and push to `main`. Tool versions come from `mise.toml`.
- `.github/workflows/image.yml` builds the Docker image. PRs build `amd64` only, without pushing. `main` pushes `edge` and `sha-*`; `v*` tags push semver tags and `latest`, both for `amd64` and `arm64`.
- The Docker image is only built in CI, not locally. Check results with `gh pr checks` or `gh run list`.
- The runtime image contains only `build/` and `package.json`. Anything the server needs at runtime must be bundled by the build.

## Library first

Before writing code we would have to maintain, search for a maintained library: recent releases, active repo, real usage. Record the choice, the evidence, and the alternatives in the change's `design.md`. Custom UI components build on bits-ui primitives when one fits.

## Skills

Use these skills for the matching work.

| Work                              | Skill                                                                                                          | Where                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Svelte components and modules     | `svelte:svelte-code-writer`, `svelte:svelte-core-bestpractices`, `svelte:svelte-file-editor` agent, Svelte MCP | Global plugin `svelte` from marketplace `sveltejs/ai-tools`   |
| shadcn-svelte components, theming | `shadcn-svelte`                                                                                                | Project                                                       |
| Dockerfile                        | `multi-stage-dockerfile`                                                                                       | Project                                                       |
| GitHub Actions workflows          | `github-actions-templates`                                                                                     | Project                                                       |
| Interface design                  | `interface-design`                                                                                             | Global, `npx skills add dammyjay93/interface-design -g`       |
| UI copy                           | `ux-writing`                                                                                                   | Global, `npx skills add content-designer/ux-writing-skill -g` |
| Browser checks and e2e            | `playwright-cli`                                                                                               | Global, `npx skills add microsoft/playwright-cli -g`          |
| Library docs                      | `find-docs`                                                                                                    | Global, from Context7 (`npx ctx7`)                            |

Notes:

- `github-actions-templates` pins older action versions. Check the latest major version of each action before use.
- No Tailwind skill is installed. `wshobson/agents@tailwind-design-system` targets Tailwind v4 but builds its own token system, which conflicts with shadcn-svelte theming. Use semantic tokens from shadcn-svelte.
- Project skills are tracked in `skills-lock.json`. Manage them with `npx skills` (`list`, `check`, `update`, `add -a claude-code`). Read a skill's `SKILL.md` before installing it.

## Git

- Conventional commits, imperative subject under 50 characters.
- Atomic commits. Body only when the why is not obvious.
