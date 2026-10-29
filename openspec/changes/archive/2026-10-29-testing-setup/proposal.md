# Proposal

## Why

The project builds, type checks, and lints, but has no tests. Feature changes (bridge-pairing onward) need unit, component, and end-to-end tests, and CI (ci-docker) will run them. There is no real Hue bridge in CI or on most dev machines, so tests need a mock bridge from the start.

## What Changes

- Add Vitest with two projects: unit tests in Node, component tests in a real browser (Vitest browser mode with Playwright).
- Add Playwright for end-to-end tests against the production build (`node build`).
- Add a mock Hue bridge based on MSW that answers CLIP v2 requests:
  - In Vitest, through MSW's Node server setup.
  - In end-to-end tests, through an MSW preload in the app server process, so app code has no test-only branches.
- Add one smoke test per layer (unit, component, e2e) that proves the setup, including one mocked bridge request.
- Add `test`, `test:unit`, and `test:e2e` scripts and update the Commands section in `AGENTS.md`.

## Capabilities

### New Capabilities

None. This change adds test tooling only. It adds no product behavior.

### Modified Capabilities

None.

## Impact

- New dev dependencies: `vitest`, `@vitest/browser-playwright`, `vitest-browser-svelte`, `@playwright/test`, `msw`.
- New files: Vitest and Playwright config, `src/mocks/` (bridge handlers), `e2e/`, smoke tests.
- Modified files: `package.json`, `vite.config.ts`, `AGENTS.md`, `.gitignore` if needed.
- Playwright browsers are downloaded on dev machines and later in CI.
- Out of scope: typed handlers from the openhue-api spec (added with the generated client in bridge-pairing), CI workflows (ci-docker), coverage thresholds.
