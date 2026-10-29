# Tasks

## 1. Mock bridge home

- [ ] 1.1 Add home fixtures (rooms Kitchen and Living room, zone Downstairs, devices, lights with varied capabilities, grouped lights, zigbee connectivity with the Plug unreachable) and handlers for the six reads plus stateful `PUT` on `grouped_light` and `light` with a resettable command log; verify a unit test reads each resource and sees a `PUT` change the state

## 2. Server: model, commands, throttle

- [ ] 2.1 Implement `home.ts` (`buildHome` pure function and `loadHome` with parallel reads and status mapping) with unit tests: room lights via devices, zone lights directly, sorted groups and lights, union mirek range, color support, unreachable light, failed read returns a status
- [ ] 2.2 Add `culori` and `@types/culori`; implement `color.ts` (hue and saturation to CIE xy, kelvin and mirek conversion) with unit tests: red, green, blue match sRGB primaries' xy within 0.01; 2700 K and 6500 K round-trip
- [ ] 2.3 Implement `throttle.ts` (per-key leading and trailing, latest value wins, every caller gets the result for its value) with fake-timer unit tests for the spec scenario "Quick changes"
- [ ] 2.4 Implement `commands.ts` (`setGroup`, `setLight`: zod-validated input, clamping, mapping to CLIP bodies, throttled per id) and the `PUT /api/groups/[id]` and `PUT /api/lights/[id]` endpoints with unit tests: 204 on success, 400 on invalid input, 502 on bridge error, command log shows the mapped body

## 3. UI components

- [ ] 3.1 Add shadcn-svelte `slider`, `switch`, `sonner`, `empty` and `@lucide/svelte` icons as needed (keep existing `button`); verify `pnpm check` passes
- [ ] 3.2 Build `GroupCard`, `LightRow`, `ColorTemperatureControl`, `ColorControl` with optimistic state, send-on-release, revert plus toast on failure; copy per the `ux-writing` skill; verify with the Svelte autofixer and component tests for on/off, release-to-send, revert on failure, hidden controls for unsupported features, unreachable light

## 4. Pages

- [ ] 4.1 Move bridge status and Forget bridge to `/settings`; add the layout header with a labelled settings link and the `visibilitychange` refresh; verify existing settings behavior with the moved component tests
- [ ] 4.2 Replace the home page with Rooms and Zones lists, the empty state, and the unreachable notice with retry and settings link; verify load tests (model, unreachable, no keys in data)
- [ ] 4.3 Add `/rooms/[id]` and `/zones/[id]` with `GroupDetail` and the not-found state; verify load tests for found and unknown ids

## 5. End to end, docs, verification

- [ ] 5.1 Update e2e: after pairing, home lists Kitchen, Living room, Downstairs; toggle Kitchen off and back; set Kitchen brightness; open Kitchen, switch Ceiling off; Plug shows unreachable; settings shows "Connected to Mock Bridge" and forget still returns to setup. Verify `pnpm test:e2e` passes
- [ ] 5.2 Update `README.md` (what the dashboard controls now) and `AGENTS.md` (home model, command endpoints, throttle, mock home fixtures); verify `pnpm lint` passes
- [ ] 5.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build` exit 0 and `server.js` runs without `node_modules`; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Push the commits (needs the user) and check CI and image runs on `main`.
- Try the controls with the real bridge before archiving.
- Archive the change with `/opsx:archive` after review.
