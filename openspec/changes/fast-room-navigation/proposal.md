# Proposal

## Why

Switching rooms or zones is sometimes slow, and the new page replaces the old one without any transition. Each switch runs the layout server load again, because the page server load calls `parent()`. That sends 7 requests to the bridge, although the browser already has the whole home in the layout data.

## What Changes

- Room and zone pages pick their group from the layout data in the browser. Switching between rooms, zones, and settings makes no server request and no bridge request.
- The page column cross-fades when the page changes. The sidebar does not move. No transition when the browser asks for reduced motion or does not support view transitions.
- Hover preload in the sidebar no longer sends requests to the bridge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `navigation`: add switching pages without a bridge request, and the cross-fade between pages.

## Impact

- Routes: `rooms/[id]` and `zones/[id]` replace `+page.server.ts` with a universal `+page.ts`; `(app)/+layout.svelte` starts the view transition.
- `src/lib/server/group-page.ts` moves out of `$lib/server`, because the browser now runs it.
- CSS: view transition styles in `src/routes/layout.css`.
- Tests: the room page load test moves to the new load; e2e checks that a switch sends no data request.
- No new dependency. No API changes. The initial load and live reloads still read the home from the bridge.
