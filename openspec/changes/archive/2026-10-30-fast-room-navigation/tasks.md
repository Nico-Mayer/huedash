# Tasks

## 1. Group lookup in the browser

- [x] 1.1 Move `src/lib/server/group-page.ts` and its test to `src/lib/group-page.ts` and update imports in `GroupDetail.svelte` (design: Universal page load picks the group); verify `pnpm test:unit --run src/lib/group-page.test.ts` passes
- [x] 1.2 Replace `rooms/[id]/+page.server.ts` and `zones/[id]/+page.server.ts` with `+page.ts` loads that call `findGroup(await parent(), ...)`; move `rooms/[id]/page.server.test.ts` to a `page.test.ts` for the new load and add the same test for zones; verify `pnpm check` and the unit tests pass
- [x] 1.3 Add e2e tests in `navigation.e2e.ts` for "Switch pages without a bridge request": no `__data.json` request on a sidebar switch or on hover over an entry, live state kept after a switch, and "Room not found" for `/rooms/unknown`; verify `pnpm test:e2e` passes

## 2. Page transition

- [x] 2.1 Start a view transition in `onNavigate` in `(app)/+layout.svelte`, skipped without `document.startViewTransition` or under `prefers-reduced-motion: reduce` (design: View Transitions API through `onNavigate`); verify with the Svelte autofixer and `pnpm check`
- [x] 2.2 Give `Sidebar.Inset` `view-transition-name: page` and add the 200 ms cross-fade for the `page` group and no animation for `root` in `src/routes/layout.css`; verify in the browser at 1440 px and 390 px that the page column fades and the sidebar stays still
- [x] 2.3 Add an e2e test that a sidebar switch with reduced motion starts no view transition and one without reduced motion does (check `document.getAnimations()` or a `startViewTransition` spy); verify `pnpm test:e2e` passes, and that existing e2e tests do not get flaky from the transition

## 3. Integration

- [x] 3.1 Run `pnpm lint`, `pnpm check`, and `pnpm test`; verify all pass
