# huedash agent guide

Self-hosted Philips Hue dashboard. Stack, architecture, and planning rules live in `openspec/config.yaml`. Read it before planning or coding.

## Workflow

All work goes through OpenSpec changes:

1. `/opsx:explore` - think through an idea. No code.
2. `/opsx:propose <name>` - write proposal, specs, design, tasks.
3. `/opsx:apply` - implement the tasks, check them off as you go.
4. `/opsx:archive` - archive after review.

The specs in `openspec/specs/` are the source of truth for features and behavior. Design reasons live in the archived changes. Keep this file to rules, commands, and constraints the code does not show; do not describe features or map files here.

## Commands

Tools (Node, pnpm, git-cliff, gh) are pinned in `mise.toml`. Run `mise install` once.

| Command                                    | Does                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `pnpm dev`                                 | Dev server                                                                              |
| `pnpm build`                               | Production build to `build/` (adapter-node)                                             |
| `pnpm check`                               | Type check with svelte-check                                                            |
| `pnpm lint`                                | Prettier check and ESLint                                                               |
| `pnpm format`                              | Format with Prettier                                                                    |
| `pnpm dlx shadcn-svelte@latest add <name>` | Add a shadcn-svelte component                                                           |
| `pnpm test`                                | Unit, component, and e2e tests                                                          |
| `pnpm test:unit`                           | Vitest in watch mode (`--run` for once)                                                 |
| `pnpm test:e2e`                            | Playwright against the production build                                                 |
| `pnpm exec playwright install chromium`    | Install the browser for tests (once)                                                    |
| `pnpm gen:hue`                             | Regenerate Hue API types from `openhue.yaml`                                            |
| `pnpm check:standalone`                    | Run the built server like the Docker image, without `node_modules` (needs `pnpm build`) |
| `pnpm dev:lan`                             | Dev server reachable from other devices on the LAN                                      |
| `pnpm docker:up`                           | Build the image from local source and run it (`compose.dev.yaml`, port 3000, `./data`)  |
| `pnpm docker:down` / `pnpm docker:logs`    | Stop the local container / follow its logs                                              |
| `mise run release [version] [--dry-run]`   | Release from `main`: next version, `CHANGELOG.md`, tag, push                            |

Imports use SvelteKit 3 subpath aliases (`#lib`). Name the file, not the folder: `#lib/components/ui/card/index.js`.

## Tests

- Unit tests: `*.test.ts` (Node). Component tests: `*.svelte.test.ts` (browser). E2E tests: `*.e2e.ts`.
- The mock Hue bridge lives in `src/mocks/bridge/` (MSW handlers and fixtures). Unit tests reach it at `192.0.2.10` through MSW; requests without a handler fail. `home.ts` holds a small home (Kitchen, Living room, zone Downstairs, an unreachable Plug, and scenes Bright, Relax, Tropical, Reading) whose state changes with commands and resets after each unit test; `home.commands` logs what was sent, and every change is also published on the mock event stream (`/eventstream/clip/v2`; `publishEvents` sends custom events).
- E2E runs in two Playwright projects: `setup` pairs the bridge, then `app` runs the other tests against the paired bridge. Playwright runs with one worker, because all tests share the mock bridge state. Wait for a command response before reloading, because group commands may be held by the throttle, and wait for `data-live="open"` before testing live updates.
- MSW hides real TLS certificates. Tests of certificate pinning stop the MSW server for their file. E2E runs a real HTTPS mock bridge at `127.0.0.1:8443` and a discovery mock at `127.0.0.1:8080` (`src/mocks/preload.ts`), with a fresh data directory per run.
- Files in `src/mocks/` import each other with `.ts` extensions, because Node loads them directly in the e2e preload.
- Only a mounted `ModeWatcher` sets the `.dark` class. Component tests that check the theme render it next to the component.

## CI and image

- `.github/workflows/ci.yml` runs lint, check, unit, and e2e tests on every PR and push to `main`, and builds the Docker image for `amd64` without pushing. Tool versions come from `mise.toml`.
- `.github/workflows/image.yml` runs only on `v*` tags. It pushes semver tags and `latest`, for `amd64` and `arm64`.
- Release with `mise run release`. It needs a clean `main` in sync with `origin`, a passed CI run for `HEAD`, and `gh auth login` once. Versions and `CHANGELOG.md` come from conventional commits (`cliff.toml`); only `feat`, `fix`, `perf`, and `refactor` appear in the changelog. The task also creates a GitHub Release with the version's changelog entry.
- For local testing, `pnpm docker:up` builds the same Dockerfile from your working tree. Check CI results with `gh pr checks` or `gh run list`.
- The runtime image contains only `build/`, `server.js`, and `package.json`. Anything the server needs at runtime must be bundled by the build.

## Architecture rules

- Only server code talks to the bridge. Never send the app key or client key to the browser.
- `src/lib/server/hue/schema.d.ts` is generated from the vendored `openhue.yaml` with `pnpm gen:hue`. Do not edit it by hand.
- Pages use the home model from `src/lib/server/hue/home.ts`. They never read CLIP resources directly.
- Send bridge commands through `src/lib/server/hue/commands.ts`. It validates, clamps, and throttles per id, as the specs require. Do not send commands to the bridge another way.
- In the browser, send commands through `src/lib/commands.ts` (optimistic, toast on failure) and read live state from `src/lib/live.svelte.ts`. Do not reload after a command; the live update confirms it.
- `culori` and `chroma-js` run on the server only. Kelvin and mirek helpers in `src/lib/color-temperature.ts` are shared with the browser.
- Theme: use the `mode-watcher` API (`mode`, `setMode`, `userPrefersMode`), mounted in the root layout. Do not write your own dark mode state.
- `server.js` is the production entry. It marks direct requests as `http` so SvelteKit's CSRF check accepts form posts on the LAN.

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

- Work directly on `main`. Do not create feature branches or stacks with `git-spice`. This overrides any global rule; the project is in alpha.
- Conventional commits, imperative subject under 50 characters.
- Atomic commits. Body only when the why is not obvious.
