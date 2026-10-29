# Proposal

## Why

The UI feels slow: after every command huedash reloads the whole home from the bridge (six reads), and changes made in the Hue app or with a wall switch only show up when the user returns to the tab. The bridge offers an event stream that reports every change as it happens.

## What Changes

- The server keeps one connection to the bridge's event stream (`/eventstream/clip/v2`) while at least one browser tab is open, and shares it with all tabs. It reconnects on its own after failures.
- Add `GET /api/events`, a server-sent events endpoint for the browser. It forwards compact updates (on/off and brightness of lights and groups) and tells the page to reload when rooms, zones, lights, or reachability change in other ways.
- Pages apply these updates in place, without reloading.
- Stop reloading the home after each command; the update from the bridge confirms the change. Keep the reload when the tab becomes visible again.
- Show a notice in the header while the live connection is lost and reconnecting; reload once it is back.
- Extend the mock bridge with an event stream that reports its state changes, for unit and e2e tests.

## Capabilities

### New Capabilities

- `live-updates`: receiving bridge changes as they happen and showing them on open pages, including connection status.

### Modified Capabilities

- `room-control`: "Refresh state without polling" changes. The page no longer reloads after each command; it updates from the event stream and still reloads when the tab becomes visible.

## Impact

- New dependency: `eventsource` (Node client for the bridge's event stream, with a custom `fetch` for certificate pinning).
- New files: `src/lib/server/hue/events.ts` (bridge stream and fan-out), `src/routes/api/events/+server.ts`, `src/lib/live.svelte.ts` (browser state), mock event stream.
- Modified files: `src/lib/commands.ts`, `GroupCard`, `LightRow`, `+layout.svelte`, `src/mocks/serve.ts` (stream responses), mock home, e2e tests, `AGENTS.md`.
- The bridge allows only a few event stream connections; huedash uses one.
- Out of scope: scenes, showing the current color of groups, live updates for pages that do not exist yet.
