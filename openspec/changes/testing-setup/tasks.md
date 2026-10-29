# Tasks

## 1. Vitest

- [x] 1.1 Run `pnpm dlx sv@1.1.1 add vitest="usages:unit,component" --install pnpm`, review the diff against SvelteKit 3 config (`vite.config.ts`, `#lib` aliases), and verify `pnpm test:unit --run` runs the generated demo tests
- [x] 1.2 Replace the generated demo tests with a component smoke test (`src/routes/page.svelte.test.ts`) that renders the home page and asserts the "huedash" title; verify it passes in the `client` project

## 2. Mock bridge

- [x] 2.1 Add `msw` and create `src/mocks/bridge/` with a fixture bridge resource and a handler for `GET https://192.0.2.10/clip/v2/resource/bridge`; verify `pnpm check` passes
- [x] 2.2 Add a Vitest setup file for the `server` project that starts `setupServer` with `onUnhandledRequest: 'error'` and resets handlers after each test; verify a unit smoke test fetching the bridge resource passes and an unmocked bridge URL fails the test

## 3. Playwright

- [x] 3.1 Run `pnpm dlx sv@1.1.1 add playwright="demo:no" --install pnpm`, install Chromium with `pnpm exec playwright install chromium`, and verify `pnpm exec playwright --version` reports 1.64.x
- [x] 3.2 Add `e2e/mock-bridge` preload and set `webServer` to build and run `node --import <preload> build` on a fixed port with `HUE_BRIDGE_IP=192.0.2.10`; verify the server log shows the mock bridge line
- [x] 3.3 Add `e2e/home.test.ts` that opens `/` and asserts the "huedash" title; verify `pnpm test:e2e` passes

## 4. Scripts and docs

- [x] 4.1 Make `pnpm test` run unit and e2e tests, and verify `pnpm test`, `pnpm check`, and `pnpm lint` all exit 0
- [x] 4.2 Add test commands, the mock bridge location, and the fake bridge host to the Commands section of `AGENTS.md`; verify each listed command runs
- [x] 4.3 Commit in atomic conventional commits and verify `git log --oneline` shows them with no co-author lines

## Workflow follow-up

- Push the commits (needs the user, auto mode blocks `git push`).
- Archive the change with `/opsx:archive` after review.
