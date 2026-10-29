# Tasks

## 1. Mock bridge scenes

- [x] 1.1 Add scene fixtures (Kitchen Bright, Relax, Tropical with palette; Living room Reading), `GET /resource/scene`, and stateful `PUT /resource/scene/{id}` recall that applies actions, sets status (others in the group inactive), logs the command, and publishes light, grouped light, and scene events; verify with unit tests for recall state and published events

## 2. Server

- [x] 2.1 Add `chroma-js`; implement scene colors (xy via `culori`, mirek via `chroma.temperature`, up to five distinct hex colors) with unit tests for xy, mirek, mixed, and empty actions
- [ ] 2.2 Add scenes to the home model (seventh read, attach to groups, sort, `dynamic`, `active`) with unit tests
- [ ] 2.3 Add `PUT /api/scenes/[id]` (`mode: active | dynamic` to recall action, throttled, `204/400/502`) with unit tests that check the command log
- [ ] 2.4 Map `scene` events in `toUpdates` (status to `scene` update, add/delete/metadata to reload) with unit tests

## 3. Browser

- [ ] 3.1 Add `scenes` to `live` (newest active wins per group, cleared on reload) with unit tests
- [ ] 3.2 Build `SceneList` (color strip, name, Active/Playing badge, play button for dynamic scenes, empty state, optimistic recall with toast on failure) and add it to `GroupDetail`; show the active scene name on `GroupCard`; verify with the Svelte autofixer and component tests

## 4. End to end, docs, verification

- [ ] 4.1 Add e2e tests: Kitchen page lists Bright, Relax, Tropical; selecting Relax marks it active and the home card shows "Relax"; play on Tropical marks it playing; a second page sees the active scene change without reload. Verify `pnpm test:e2e` passes
- [ ] 4.2 Update `README.md` features and `AGENTS.md` (scenes in the home model, endpoint, mock scenes); verify `pnpm lint` passes
- [ ] 4.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Push the commits (needs the user) and check CI and image runs on `main`.
- Try scenes with the real bridge (`pnpm docker:up`) before archiving.
- Archive the change with `/opsx:archive` after review.
