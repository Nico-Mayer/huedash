# Design

## Context

SvelteKit 3 project with Vite 8, Svelte 5.57, adapter-node, pnpm 12, Node 24. Config lives in `vite.config.ts` (no `svelte.config.js`). Imports use `#lib` subpath aliases. No tests and no Hue client exist yet. The `sv` CLI (1.1.1) offers official `vitest` (unit, component) and `playwright` add-ons.

The SvelteKit server will call the bridge at `https://<bridge-ip>/clip/v2/...` with `fetch`. The browser never calls the bridge.

Versions checked on npm and GitHub (2026-10-29):

| Package | Version | Last publish | Repo activity |
|---|---|---|---|
| `vitest`, `@vitest/browser-playwright` | 5.0.5 | 2026-10-19 | active |
| `vitest-browser-svelte` | 3.1.0 | 2026-09-04 | active |
| `@playwright/test` | 1.64.1 | 2026-10-29 | active |
| `msw` | 3.0.3 | 2026-10-10 | pushed 2026-10-17, 18k stars |
| `openapi-msw` | 2.1.1 | 2026-10-27 | pushed 2026-10-27, 91 stars |
| `@stoplight/prism-cli` | 5.16.0 | 2026-07-17 | pushed 2026-10-22, 5k stars |

## Goals / Non-Goals

**Goals:**
- One command per layer: `pnpm test:unit`, `pnpm test:e2e`, and `pnpm test` for both.
- One set of mock bridge handlers, reused by unit, component, and e2e tests.
- No test-only code paths in the app.

**Non-Goals:**
- No typed handlers yet. `openapi-msw` needs the `paths` types generated from the openhue-api spec, which arrive with the client in bridge-pairing.
- No CI workflow (ci-docker). No coverage thresholds.
- No mock for the CLIP v2 event stream yet (live-updates).

## Decisions

### Vitest and Playwright from the `sv` add-ons
`sv add vitest="usages:unit,component" playwright="demo:no"`. Vitest gets two projects: `server` (Node, `*.test.ts`) and `client` (browser mode with Playwright, `*.svelte.test.ts`). Playwright tests live in `e2e/`.
- Alternative: hand-written config. Rejected: drifts from upstream defaults.
- Alternative: jsdom for component tests. Rejected: the `sv` default is real browser mode, which matches Svelte 5 behavior more closely.

### Mock bridge with MSW
Handlers in `src/mocks/bridge/` intercept requests to a fixed fake bridge host `192.0.2.10` (TEST-NET-1, never routable). Fixture data lives next to the handlers.
- Unit tests: `setupServer(...handlers)` in a Vitest setup file for the `server` project.
- E2E: Playwright's `webServer` starts the production build with `node --import ./e2e/mock-bridge.ts build` (or a compiled `.js` if Node cannot load the `.ts` preload directly). The preload calls `setupServer(...handlers).listen()` in the app process, so server-side `fetch` to the bridge is intercepted. `HUE_BRIDGE_IP` points at the fake host.
- Unhandled requests to the bridge host fail the test (`onUnhandledRequest: 'error'`), so missing handlers are visible.

Alternatives:
- Prism mock server from the openhue-api spec. Rejected for now: answers come from spec examples, which makes stateful flows (pairing waits for button press, light state changes) hard to script. It also serves plain HTTP while the app expects HTTPS. Can be revisited for contract tests.
- A handwritten mock HTTP server. Rejected: more code to maintain than MSW handlers.
- MSW started from `hooks.server.ts` behind an env flag. Rejected: test code inside the app bundle.

### E2E runs against the production build
`webServer` runs `pnpm build` and then the Node preload command on a fixed port. This tests what Docker will ship.
- Alternative: `vite dev`. Rejected: dev-only behavior can hide build problems.

### Browser for Playwright
Use the Playwright-managed Chromium (`pnpm exec playwright install chromium`). Chrome is not installed on this machine, and CI will use the same managed browser.

### Smoke tests
- Unit: `fetch('https://192.0.2.10/clip/v2/resource/bridge')` returns the fixture bridge.
- Component: render the placeholder `Card` content and assert the title.
- E2E: the home page loads and shows the title. The preload logs that the mock bridge is active. An e2e test of a real mocked bridge call follows in bridge-pairing, when the app first calls the bridge.

## Risks / Trade-offs

- [`sv` add-ons may not match SvelteKit 3 config exactly] → Review the diff after `sv add`. Fix by hand if needed and record it here.
- [MSW in a `--import` preload depends on Node loading the preload before the app's `fetch` use] → The smoke e2e checks the preload log line. If loading `.ts` fails, compile the preload with the existing toolchain or write it in plain JS.
- [Self-signed bridge TLS: the real client will use a custom undici agent] → MSW intercepts before the network layer. Verify again in bridge-pairing once the agent exists.
- [Playwright browser download is large] → Install only Chromium.
