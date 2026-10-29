# Proposal

## Why

Moving between rooms always goes through the home page grid and back. A design mockup (Claude Design, "Hue Dashboard") shows a layout that is easier to navigate: a sidebar with every room, the selected room in the middle, and its controls on the right. This change adopts that layout for the features huedash already has. Later changes add the mockup's new features (light selection, presets, home actions, keyboard shortcuts).

## What Changes

- New app shell on every page except setup: a sidebar on the left, the page in the middle, and on room and zone pages an inspector on the right.
- Sidebar: rooms, then zones. Each entry shows the name, a short state ("Relax", "3 of 5 on", "All off"), and an on/off switch. The footer shows the bridge connection and links to settings.
- **BREAKING** (UI): the home page grid goes away. `/` opens the first room (or the first zone if there are no rooms). With no rooms and no zones, or when the bridge fails, `/` shows the existing empty state or bridge notice inside the shell.
- Room and zone pages: a header with the name and light counts, scenes as a card grid, and lights as a card grid. The group switch, brightness, white, and color controls move to the inspector, with White and Color as tabs.
- Sidebar entries no longer show brightness. Brightness stays in the inspector.
- Below 1280 px the inspector moves to the top of the page column. Below 768 px the sidebar opens as a sheet from a menu button in a top bar.
- The connection notice moves from the header (removed) to the top of the page column, and the sidebar footer shows the connection state.
- Visual language stays shadcn-svelte: existing components and tokens, plus the shadcn-svelte `sidebar` and `tabs` components. No colors from the mockup.

## Capabilities

### New Capabilities

- `navigation`: the app shell, the sidebar, opening the first room from `/`, and the layout at each screen width.

### Modified Capabilities

- `room-control`: the list of rooms and zones moves from the home page to the sidebar and shows a short state instead of brightness.
- `light-control`: rooms and zones open from the sidebar; lights show as cards.
- `scenes`: the active scene name shows in the sidebar entry instead of the home page card.
- `live-updates`: the connection notice moves from the header to the top of the page column.
- `bridge-pairing`: the settings link moves from the header to the sidebar.

## Impact

- Routes: a `(app)` route group with a layout that loads the home once for the sidebar and the page. `src/routes/+page.svelte` (grid) is replaced by a redirect. Setup stays outside the shell.
- Components: new `AppSidebar`, `GroupInspector`, `LightCard`; `GroupCard`, `GroupDetail`, `LightRow`, `SceneList`, `LiveStatus` change or are replaced.
- New shadcn-svelte components: `sidebar` (brings `sheet`, `tooltip`, `skeleton`, and an `is-mobile` hook), `tabs`.
- Tests: e2e tests for rooms, scenes, and live updates start from the sidebar; new e2e tests for `/` and the three widths.
