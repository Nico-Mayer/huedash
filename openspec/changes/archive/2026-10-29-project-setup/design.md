# Design

## Context

The repo has no `package.json` yet. It has `mise.toml` (Node 24, OpenSpec CLI), `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `.claude/` skills, and `openspec/`. The global Svelte plugin (MCP + skills) is already available to agents.

Current versions checked on npm (2026-10-29):

| Package | Version | Last publish |
|---|---|---|
| `sv` (official CLI) | 1.1.1 | 2026-10-06 |
| `@sveltejs/kit` | 3.1.0 | 2026-10-14 |
| `svelte` | 5.57.3 | 2026-10-26 |
| `@sveltejs/adapter-node` | 6.0.0 | 2026-10-01 |
| `tailwindcss`, `@tailwindcss/vite` | 4.3.3 | 2026-10-19 |
| `shadcn-svelte` | 1.7.1 | 2026-10-23 |
| `bits-ui` | 2.20.2 | 2026-10-23 |
| `@lucide/svelte` | 1.64.0 | 2026-10-29 |
| `eslint` | 10.13.0 | 2026-10-16 |
| `eslint-plugin-svelte` | 3.23.1 | 2026-10-09 |
| `typescript-eslint` | 8.72.1 | 2026-10-29 |
| `prettier` | 3.9.10 | 2026-10-10 |
| `prettier-plugin-svelte` | 4.1.1 | 2026-06-15 |
| `prettier-plugin-tailwindcss` | 0.8.1 | 2026-09-29 |
| `pnpm` | 12.16.1 | 2026-10-28 |

SvelteKit 3 needs Node 22.17 or later. Node 24 from `mise.toml` meets this.

## Goals / Non-Goals

**Goals:**
- Use official generators (`sv`, `shadcn-svelte` CLI) so config stays close to upstream defaults and is easy to update.
- `pnpm check`, `pnpm lint`, and `pnpm build` pass on a clean clone.

**Non-Goals:**
- No visual direction or custom theme. Base color `neutral` is a placeholder; a preset can be applied later with `shadcn-svelte apply`.
- No dark mode toggle yet (needs `mode-watcher`, decided when a feature needs it).
- No Svelte `experimental` features (async, remote functions). Decided per feature change.
- No `ai-tools` add-on. The global Svelte plugin already covers MCP and skills.

## Decisions

### Scaffold with `sv create` in the repo root
`sv create . --template minimal --types ts --no-add-ons --install pnpm --no-dir-check`, then `sv add` with `prettier eslint tailwindcss sveltekit-adapter="adapter:node"`.
- Alternative: hand-written config. Rejected: more to maintain, drifts from upstream.
- Alternative: scaffold into a subfolder and copy. Rejected: extra step; git shows any overwritten file, so conflicts are easy to review in place.

After scaffolding, review `git diff` for files `sv` overwrote (`.gitignore`, `README.md`) and merge the existing entries back.

### pnpm pinned through mise
Add `pnpm = "12"` to `mise.toml`. Same tool pin mechanism as Node and the OpenSpec CLI.
- Alternative: Corepack with a `packageManager` field. Rejected: a second pinning mechanism next to mise. The `packageManager` field may still be written by `sv`; it is kept if it matches the mise version.

pnpm blocks dependency install scripts by default. Approve only the packages the build needs (for example `esbuild`) with `pnpm approve-builds`, which records them in `pnpm-workspace.yaml`.

### adapter-node
The later Docker image runs `node build`. Picked now, so `pnpm build` produces the same output CI and Docker will use.
- Alternative: `adapter-auto`. Rejected: no target detection in self-hosted Docker.

### shadcn-svelte via its CLI
`pnpm dlx shadcn-svelte@1.7.1 init --preset b3e3SmJxh2` (chosen by the user: style `maia`, base color `mauve`, Geist font, lucide icons). shadcn-svelte 1.7 requires a preset, so the planned `--base-color neutral` was dropped. Then `add button card` as the first components. More components come with the features that need them.
- Alternative: use bits-ui directly. Rejected: shadcn-svelte gives styled, accessible components on top of bits-ui. bits-ui stays available for custom components.

SvelteKit 3 uses Node subpath imports (`#lib`) instead of `$lib`. Aliases are `#lib`, `#lib/components`, `#lib/components/ui`, `#lib/utils`, `#lib/hooks`. Subpath imports do not resolve folders, so imports name the file: `#lib/components/ui/card/index.js`.

shadcn-svelte 1.7 replaces `clsx` + `tailwind-merge` with `cn` (shadcn-ui/cn, 0.5.0, published 2026-10-16).

Generated components are formatted with the project Prettier config. ESLint's `svelte/no-navigation-without-resolve` is off for `src/lib/components/ui/**`, because `Button` passes `href` through and callers resolve it.

### Lint and format from `sv` add-ons
Use the ESLint flat config and Prettier config from `sv`. Add `prettier-plugin-tailwindcss` for class sorting. No extra lint rules for now.
- Alternative: Biome. Rejected: Svelte support is weaker than `eslint-plugin-svelte` and `prettier-plugin-svelte`.

### Placeholder page
`src/routes/+page.svelte` shows a `Card` with the app name and a short note that setup comes next. It only proves that Tailwind and shadcn-svelte work. Feature changes replace it.

## Risks / Trade-offs

- [SvelteKit 3 is new; shadcn-svelte peer range only states `svelte ^5`] → Verify with `pnpm build` and `pnpm check` right after init. If a component breaks, pin the last working version and note it.
- [`sv create` overwrites existing files] → Run on a clean git tree and review the diff before committing.
- [pnpm 12 blocks install scripts] → Approve only the needed packages and commit `pnpm-workspace.yaml`.
- [Base color chosen without a visual direction] → Low cost to change with a preset later.
