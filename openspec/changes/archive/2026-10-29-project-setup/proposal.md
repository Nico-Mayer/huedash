# Proposal

## Why

The repo has agent guidelines and skills but no application yet. Every later change (testing-setup, ci-docker, features) needs a SvelteKit project with the agreed UI stack, a fixed package manager, and lint and format rules in place.

## What Changes

- Scaffold a SvelteKit (Svelte 5) project with TypeScript at the repo root.
- Use pnpm as the package manager, pinned in `mise.toml`.
- Use `@sveltejs/adapter-node`, so the build runs as a Node server inside the later Docker image.
- Add Tailwind CSS v4.
- Initialize shadcn-svelte (bits-ui based) with the `neutral` base color, and add a first small set of components to prove the setup.
- Add ESLint and Prettier with Svelte and Tailwind support, plus `lint`, `format`, and `check` scripts.
- Replace the default page with a minimal placeholder page that uses a shadcn-svelte component.
- Update `AGENTS.md` with the commands to run (dev, build, check, lint, format).

## Capabilities

### New Capabilities

None. This change sets up tooling and a placeholder page. It adds no product behavior.

### Modified Capabilities

None.

## Impact

- New files: `package.json`, `pnpm-lock.yaml`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, ESLint and Prettier config, `components.json`, `src/`, `static/`.
- Modified files: `mise.toml`, `.gitignore`, `AGENTS.md`.
- New dependencies: SvelteKit, Svelte, Vite, adapter-node, Tailwind CSS, shadcn-svelte components (bits-ui, tailwind-variants, clsx, tailwind-merge, `@lucide/svelte`), ESLint, Prettier and plugins.
- Out of scope: Vitest and Playwright (testing-setup), Dockerfile and CI (ci-docker), Hue client and pairing (bridge-pairing).
