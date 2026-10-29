# Design

## Context

- Routes today: `/` (grid of `GroupCard`s, loads the home), `/rooms/[id]` and `/zones/[id]` (`GroupDetail`, each loads the whole home again through `loadGroupPage`), `/settings`, `/setup`. The root layout renders a header (title, settings link), `LiveStatus`, connects `live`, and mounts `ModeWatcher` and `Toaster`.
- `GroupCard` holds the group switch and brightness slider and reads `live.groups` and `live.scenes`. `LightRow` reads `live.lights`. `ColorTemperatureControl` and `ColorControl` take a group. `SceneList` renders `<ul aria-label="Scenes">`.
- `live.reload()` calls `refreshAll()`, so every load function reruns after structural changes.
- The mockup is a fixed ~1080 px React canvas with its own colors and no small-screen layout. We take its structure, not its styling.

Library evidence (2026-10-29):

| Package | Version | Activity | Use |
|---|---|---|---|
| `shadcn-svelte` | 1.7.1 | published 2026-10-23, repo pushed 2026-10-29, 9.2k stars | `sidebar` (with `sheet`, `tooltip`, `skeleton`, `is-mobile` hook) and `tabs` registry components |
| `bits-ui` | 2.20.2 (installed) | | primitives behind `sheet` (Dialog) and `tabs` |

Alternatives: hand-built sidebar with a bits-ui `Dialog` for the phone sheet (more code, same result); `paneforge` resizable panes (not needed, widths are fixed).

## Goals / Non-Goals

**Goals:**
- One home load per navigation, shared by the sidebar and the page.
- Keep existing component logic (optimistic commands, live overrides) and only move it.

**Non-Goals:**
- Light selection, multi-select, presets, home summary, "turn off entire home", light glow and model names, scene brightness, keyboard shortcuts (later changes).
- Remembering the last room per device.
- Collapsing the sidebar to icons on desktop.

## Decisions

### Route group `(app)` with one home load
```
src/routes/
  +layout.svelte            ModeWatcher, Toaster, children (no header)
  setup/+layout.svelte      simple header "huedash" (as today)
  (app)/
    +layout.server.ts       bridge config (redirect to /setup), loadHome -> { bridgeName, result }
    +layout.svelte          Sidebar.Provider, AppSidebar, Sidebar.Inset { top bar, LiveStatus, page },
                            live.connect(), visibility refresh, data-live
    +page.server.ts         await parent(); redirect 307 to first room / first zone; else empty or failure
    +page.svelte            empty state or bridge failure (existing markup)
    rooms/[id]/  zones/[id]/  +page.server.ts: await parent(), find group
    settings/               moved, unchanged
```
`loadGroupPage` becomes a pure `findGroup(result, kind, id)` on the layout's result, so each navigation calls the bridge once. `healthz` and `api` stay outside the group. A 307 redirect keeps `/` out of the history when the first room opens.

Alternative: keep the root layout and branch on `page.url.pathname` for setup (as `inSetup` does now). Rejected: setup would still run the home load.

### Sidebar from shadcn-svelte `sidebar`
`AppSidebar` uses `Sidebar.Root collapsible="offcanvas"`. Sections are `Sidebar.Group` with `Sidebar.GroupLabel` "Rooms" / "Zones". Each entry is a `Sidebar.MenuItem` with a `Sidebar.MenuButton` link (`isActive` for the current page) holding the name and the state line, and a `Switch` beside it. The `Switch` sits outside the link, so toggling does not navigate. The footer has the connection dot and text and a Settings `MenuButton`. Below 768 px the component renders a `Sheet` on its own (`is-mobile` hook). A `Sidebar.Trigger` in the top bar shows only below 768 px. Entries call `setOpenMobile(false)` on navigation.

The sidebar keeps its open state in a `sidebar_state` cookie. We leave this as it is; it is a UI preference and has no server effect.

### Shared group state
New `src/lib/group-state.svelte.ts` with functions that merge `live` overrides over loaded data: `groupOn(group)`, `groupBrightness(group)`, `lightOn(light)`, `activeScene(group)`, `lightCounts(group)` (`{ on, total, unreachable }`, on means reachable and on). The sidebar entry, the page header, and the inspector use these, so all three agree. `GroupCard`'s switch and slider logic moves to `GroupControls` (inspector) and `GroupSwitch` (sidebar), both using `applyChange` as today.

### Page layout
`GroupDetail` becomes:
```
<header> name (h1), "2 of 3 lights on · 1 unreachable" </header>
<div class="grid xl:grid-cols-[1fr_22rem]">
  <aside GroupInspector class="xl:col-start-2 xl:row-start-1 xl:sticky xl:top-0">  first in DOM
  <div> Scenes (card grid), Lights (card grid) </div>
</div>
```
The inspector comes first in the DOM, so keyboard and screen-reader order matches the narrow layout, where it sits on top. On wide screens grid placement moves it to the right. `GroupInspector` = `GroupControls` (switch, brightness) plus `Tabs` White / Color when the group has both, or the single control when it has one.

Scenes: `SceneList` keeps `<ul aria-label="Scenes">` and its behavior; items become cards in `grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` with the color strip on top. Lights: `LightRow` becomes `LightCard` in a `<ul aria-label="Lights">` grid with the same switch and slider logic.

### Connection state
`LiveStatus` moves into `Sidebar.Inset` above the page, so phones see it with the sidebar closed. The sidebar footer shows `<bridge name> · connected` or `Reconnecting…` from `live.connected`.

### Copy
Sidebar labels "Rooms", "Zones", "Settings". Entry state: active scene name, "N of M on", "All off". Page header: "N of M lights on", plus " · K unreachable" when K > 0. Empty and failure texts stay as they are.

### Tests
- Unit: `findGroup`; `(app)/+page.server.ts` redirects (rooms, zones only, none, bridge failure); `lightCounts` with live overrides.
- Component: sidebar entry state and switch; inspector tabs.
- E2E: update `rooms`, `scenes`, `live` to use the sidebar. New `navigation.e2e.ts`: `/` opens Kitchen; sidebar moves between rooms; viewport 1024 puts the inspector above scenes; viewport 390 hides the sidebar, the menu opens it, and picking a room closes it.

## Risks / Trade-offs

- [The sidebar `Switch` next to a link can be hit by mistake on touch] → give the switch its own hit area outside the link and keep the entry tall enough (≥ 44 px).
- [The home model is loaded in the layout, so `/settings` now also calls the bridge] → the settings page already checks the bridge; a failed load shows the sidebar without entries and the page still works.
- [Moving routes into `(app)` touches many test imports] → move files with `git mv` first in one commit, then change behavior.
- [Mockup styles could slip in] → use only shadcn tokens and components; compare screenshots in light and dark.
