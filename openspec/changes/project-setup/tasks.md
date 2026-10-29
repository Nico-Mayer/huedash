# Tasks

## 1. Tooling

- [x] 1.1 Add `pnpm = "12"` to `mise.toml` and verify `mise install` succeeds and `pnpm --version` reports 12.x

## 2. SvelteKit scaffold

- [x] 2.1 On a clean git tree, run `pnpm dlx sv@1.1.1 create . --template minimal --types ts --no-add-ons --install pnpm --no-dir-check` and verify `pnpm dev` serves the default page
- [x] 2.2 Review `git diff` for files `sv` overwrote (`.gitignore`, `README.md`) and merge back the previous entries; verify `git diff .gitignore` shows no removed project entries (`/data/`, `.env`, `.claude/settings.local.json`)
- [x] 2.3 Run `pnpm dlx sv@1.1.1 add prettier eslint tailwindcss sveltekit-adapter="adapter:node"` and verify `vite.config.ts` (SvelteKit 3 has no `svelte.config.js`) imports `@sveltejs/adapter-node` and `pnpm build` writes `build/index.js`
- [x] 2.4 Approve only required install scripts with `pnpm approve-builds` and verify a fresh `pnpm install` prints no ignored-build warnings

## 3. Lint and format

- [x] 3.1 Add `prettier-plugin-tailwindcss` to the Prettier config (after `prettier-plugin-svelte`) and verify `pnpm format` sorts Tailwind classes in a test edit
- [x] 3.2 Verify `pnpm lint` and `pnpm check` pass with zero errors on the scaffold

## 4. shadcn-svelte

- [x] 4.1 Run `pnpm dlx shadcn-svelte@latest init --base-color neutral` with default aliases and verify `components.json` exists and `src/lib/utils.ts` exports `cn`
- [x] 4.2 Run `pnpm dlx shadcn-svelte@latest add button card -y` and verify both folders exist under `src/lib/components/ui/`
- [x] 4.3 Replace `src/routes/+page.svelte` with a placeholder `Card` (app name, short note that setup comes next) using `Card` and `Button`; verify it renders styled in `pnpm dev` and passes the Svelte autofixer
- [x] 4.4 Verify `pnpm check`, `pnpm lint`, and `pnpm build` all pass after adding shadcn-svelte

## 5. Docs and commit

- [x] 5.1 Add a "Commands" section to `AGENTS.md` (`pnpm dev`, `pnpm build`, `pnpm check`, `pnpm lint`, `pnpm format`, adding shadcn-svelte components) and verify each listed command runs
- [ ] 5.2 Commit in atomic conventional commits (tooling, scaffold, lint/format, shadcn-svelte, docs) and verify `git log --oneline` shows them with no co-author lines

## Workflow follow-up

- Push the commits (needs the user, auto mode blocks `git push`).
- Archive the change with `/opsx:archive` after review.
