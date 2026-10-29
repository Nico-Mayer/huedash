# Tasks

## 1. Setup

- [x] 1.1 Create the stacked branch `app-shell` on `main` with `git-spice branch create app-shell`; verify `git-spice log short` shows it
- [x] 1.2 Add components with `pnpm dlx shadcn-svelte@latest add sidebar tabs`, then `pnpm format`; verify `src/lib/components/ui/sidebar/` and `tabs/` exist and `pnpm check` passes

## 2. Routes and data

- [x] 2.1 Move `/`, `rooms/[id]`, `zones/[id]`, and `settings` into `src/routes/(app)/` with `git mv` (no behavior change) and commit; verify `pnpm test` passes
- [x] 2.2 Add `(app)/+layout.server.ts` (config redirect to `/setup`, `loadHome`) and replace `loadGroupPage` with `findGroup` on the parent result; verify unit tests for `findGroup` and the layout load pass and the bridge is called once per page load
- [x] 2.3 Make `(app)/+page.server.ts` redirect (307) to the first room, else the first zone; keep the empty state and bridge failure in `(app)/+page.svelte`; verify unit tests for rooms, zones only, none, and bridge failure
- [x] 2.4 Move the header out of the root layout: setup gets `setup/+layout.svelte` with the "huedash" header; `live.connect`, the visibility refresh, and `data-live` move to `(app)/+layout.svelte`; verify `setup.e2e.ts` passes

## 3. Shared group state

- [x] 3.1 Add `src/lib/group-state.svelte.ts` (`groupOn`, `groupBrightness`, `lightOn`, `activeScene`, `lightCounts`) merging `live` overrides; verify unit tests cover overrides, unreachable lights, and no active scene

## 4. Sidebar

- [x] 4.1 Build `AppSidebar` (Rooms and Zones groups, entry link with state line and `isActive`, `GroupSwitch` outside the link, footer with connection state and Settings) in `(app)/+layout.svelte` inside `Sidebar.Provider` and `Sidebar.Inset`; verify with the Svelte autofixer and component tests for entry state ("Relax", "2 of 3 on", "All off") and the switch
- [x] 4.2 Add the top bar with `Sidebar.Trigger` and page title below 768 px, close the sheet on navigation, and move `LiveStatus` into the inset; verify `LiveStatus` component test still passes and the notice shows at 390 px with the sidebar closed

## 5. Room and zone page

- [x] 5.1 Build `GroupControls` (switch, brightness) and `GroupInspector` (White / Color `Tabs` when both, single control otherwise) from `GroupCard`, `ColorTemperatureControl`, `ColorControl`; remove `GroupCard`; verify with the Svelte autofixer and updated `controls.svelte.test.ts`
- [x] 5.2 Rework `GroupDetail`: header with name and light counts, inspector first in DOM and right column at `xl`, scenes card grid, lights as `LightCard` grid in `<ul aria-label="Lights">`; remove `LightRow`; verify with the Svelte autofixer and updated `scenes.svelte.test.ts` and light component tests
- [x] 5.3 Not-found page keeps the sidebar and drops the "Go to all rooms" link; verify a unit or e2e check for an unknown id

## 6. End to end, docs, verification

- [x] 6.1 Update `rooms.e2e.ts`, `scenes.e2e.ts`, `live.e2e.ts` to use the sidebar (Kitchen entry shows "Relax" after recall); add `navigation.e2e.ts` (`/` opens Kitchen; sidebar moves between rooms and marks current; 1024 px inspector above scenes; 390 px menu opens sidebar and closes after picking a room); verify `pnpm test:e2e` passes
- [ ] 6.2 Take screenshots of room, zone, settings, empty and failure states at 1440, 1024, and 390 px in light and dark with `playwright-cli`; fix layout issues with shadcn tokens only; verify by the screenshots
- [x] 6.3 Update `README.md` features (sidebar navigation); verify `pnpm lint` passes
- [x] 6.4 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit the branch with `git-spice branch submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
- Next changes in the stack: `light-selection`, `home-actions`, `shortcuts`.
