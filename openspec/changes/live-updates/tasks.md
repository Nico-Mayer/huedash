# Tasks

## 1. Mock event stream

- [x] 1.1 Add an emitter to the mock home that publishes CLIP `update` events for changed lights and affected grouped lights, a helper to publish arbitrary events, and a streaming `text/event-stream` handler (MSW `sse()` needs a global `EventSource`, which Node lacks) on `*/eventstream/clip/v2` that requires the app key; verify a unit test receives the update events after a `PUT`
- [x] 1.2 Make `src/mocks/serve.ts` stream response bodies instead of buffering; verify the existing e2e tests still pass and a manual request to the e2e mock stream receives an event

## 2. Server

- [x] 2.1 Add `eventsource`; implement `toUpdates` (bridge message to browser updates: light, group, reload, dropped types, rounded brightness) with unit tests for each case, including that no key or raw resource fields pass through
- [ ] 2.2 Implement the event hub (lazy start, shared subscribers, status `open`/`reconnecting`, close 30 s after the last subscriber, pinned fetch with app key) with unit tests using the MSW stream and fake timers for the idle close
- [ ] 2.3 Implement `GET /api/events` (SSE response, heartbeat every 25 s, unsubscribe on abort, `409` without a bridge) with unit tests reading the stream

## 3. Browser

- [ ] 3.1 Implement `src/lib/live.svelte.ts` (connect once, override maps, `connected`, throttled reload, reload after reconnect, clear overrides after navigation) with component-level tests using a fake `EventSource`
- [ ] 3.2 Use the overrides in `GroupCard` and `LightRow`, remove `refreshAll()` from `src/lib/commands.ts`, connect from `+layout.svelte`, and add the reconnecting notice; verify with the Svelte autofixer and component tests (update applied in place, notice shown and hidden)

## 4. End to end, docs, verification

- [ ] 4.1 Add e2e tests: a change in one browser page shows in a second page without reload; a group command does not trigger a page data reload; verify `pnpm test:e2e` passes
- [ ] 4.2 Update `AGENTS.md` (event hub, browser state, mock stream) and `README.md` (live updates, reverse proxy must not buffer `/api/events`); verify `pnpm lint` passes
- [ ] 4.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build` exit 0 and `server.js` runs without `node_modules`; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Push the commits (needs the user) and check CI and image runs on `main`.
- Try live updates with the real bridge (`pnpm docker:up`, change a light in the Hue app) before archiving.
- Archive the change with `/opsx:archive` after review.
