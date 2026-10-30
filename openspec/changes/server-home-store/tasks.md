# Tasks

## 1. Resource schemas

- [x] 1.1 Add `src/lib/server/hue/resources.ts` with zod schemas for room, zone, device, light, grouped_light, zigbee_connectivity, and scene (fields huedash reads only), their partial update forms, and compile-time assertions against `schema.d.ts` (design: Resource schemas); verify `pnpm check` passes and fails when an assertion is broken on purpose
- [x] 1.2 Add a parse helper that skips and logs bad items per id and keeps the rest (spec: home-state "Check bridge data"); verify unit tests cover a light without a name, an unknown resource type, and a valid list

## 2. Home model

- [x] 2.1 Change `buildHome()` to return `lights` by id and `lightIds` per group, sorted by light name, typed from the resource schemas instead of casts (design: Home model); verify `home.test.ts` covers a light in a room and a zone appearing once
- [x] 2.2 Add a size check: a unit test builds a home with 50 lights and 20 scenes and records the JSON size (design: Risks); verify the test passes and the size is noted in the test name or assertion

## 3. Server store

- [x] 3.1 Add `src/lib/server/hue/store.ts`: shared load of the 7 lists, `add`/`update`/`delete` event apply with deep merge, 50 ms revision batching, `status`, and listeners (design: Resource store); verify unit tests for load sharing, rename, add, delete, connectivity change, and malformed events (spec: home-state)
- [x] 3.2 Move the bridge stream into the store: open, buffer during load, replay, load again on reconnect, keep the 5 s restart, no idle close (spec: live-updates "One shared bridge connection", home-state "Reload the copy after a lost stream"); verify unit tests with the mock event stream for startup buffering and reconnect
- [x] 3.3 Keep one store per config key, close the old store on key change, and close it from the settings `forget` action (spec: home-state "Clear the copy when the bridge is forgotten"); verify unit tests for key change and forget, and `settings/page.server.test.ts` passes
- [x] 3.4 Reset the store map in `src/mocks/vitest.setup.ts` next to `resetHome()`; verify `pnpm test:unit --run` passes twice in a row
- [x] 3.5 Remove `loadHome()`, `updates.ts`, `updates.test.ts`, and the per-tab hub in `events.ts`; verify `rg "loadHome|toUpdates" src` finds nothing and `pnpm check` passes

## 4. Commands

- [x] 4.1 Let `createThrottle` take a `merge` function; use a shallow CLIP body merge for lights and groups and "latest wins" for scenes (design: Throttle merges waiting commands); verify `throttle.test.ts` and `commands.test.ts` cover the "Different properties" scenarios of light-control and room-control
- [x] 4.2 Look up targets in the store: `404` for unknown ids without a bridge request, mirek clamped to the light's or group's range (spec: home-state "Reject commands for unknown targets", light-control "Keep white in the light's range", room-control "Set group color temperature"); verify unit tests for each scenario and that the mock bridge received no command for the unknown id
- [x] 4.3 Apply accepted commands to the store as CLIP updates (light, group with member lights, scene with its group's other scenes) and answer `200 { revision }` (design: Commands); verify `api/commands.test.ts` checks the answer and that the store's home shows the change before the mock bridge event

## 5. Browser stream

- [x] 5.1 Change `src/lib/live-updates.ts` to the `hello`, `status`, and `home` messages, and `/api/events` to send `hello`, the status, and the current home on connect, then each revision (design: Browser stream); verify `api/events/server.test.ts` covers connect, a change, and that no key appears in the stream (spec: live-updates "Keep keys on the server")

## 6. Browser home store

- [x] 6.1 Add `src/lib/home.svelte.ts` with `home` and `revision` (`$state.raw`), connection state, newer-revision-only updates, version check with `location.reload()`, and pending changes with tokens, cleared when `revision >=` the answer's revision (design: Browser home store); use the Svelte autofixer, and verify a unit test for stale revisions, version mismatch, pending clear, failure revert, and an older answer not clearing a newer change
- [x] 6.2 Move the helpers in `group-state.svelte.ts` and `control-target.svelte.ts` to read pending changes, then `home`; delete `live.svelte.ts` and its test; verify `group-state.svelte.test.ts` and `control-target.svelte.test.ts` pass on the new store
- [x] 6.3 Change `(app)/+layout.server.ts` to read from the server store and `rooms/[id]/+page.ts` and `zones/[id]/+page.ts` to return kind and id only; components look up groups and lights in the browser store; remove the reload on tab focus (spec: room-control "Refresh state without polling"); verify `pnpm check` passes and the component tests for `RoomHeader`, `LightCard`, `GroupSwitch`, `ControlDialog`, and `controls` pass
- [x] 6.4 Remove `pending` and `CONFIRM_MS` from `SceneList.svelte` and use the store's pending changes; verify `scenes.svelte.test.ts` passes

## 7. End to end

- [x] 7.1 Extend `live.e2e.ts`: rename a room and make a light unreachable through `publishEvents` without a page data request; switch the Kitchen off in one page and see it in another before the mock bridge event; drop the browser connection and see a change after reconnect (spec: live-updates); verify `pnpm test:e2e` passes
- [x] 7.2 Add an e2e test that loading and focusing pages sends no request to the mock bridge after the first load, by checking the mock bridge's request log (spec: home-state "Page loads use the server copy"); verify `pnpm test:e2e` passes
- [x] 7.3 Update `navigation.e2e.ts`, `scenes.e2e.ts`, `details.e2e.ts`, and `dialog.e2e.ts` for the removed reload and the new scene pending behavior; verify `pnpm test:e2e` passes

## 8. Verification

- [x] 8.1 Run `pnpm docker:up`, open two tabs, change lights, rename a room through the mock or a real bridge, and check `pnpm docker:logs` for skipped resource warnings; verify both tabs follow without reloads
- [ ] 8.2 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0; commit on `main` in atomic conventional commits

## Workflow follow-up

- On a real bridge, measure the time from a Hue app change to the huedash update (design: Open Questions).
- Archive with `/opsx:archive` after review.
