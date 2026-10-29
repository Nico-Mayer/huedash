# Design

## Context

room-control loads a home model on the server (`loadHome`, six CLIP v2 reads) and the browser sends commands through `src/lib/commands.ts`, which calls `refreshAll()` after each success. `+layout.svelte` also calls `refreshAll()` when the tab becomes visible. `GroupCard` and `LightRow` keep local state with `$derived(group.on)` and override it optimistically. All bridge requests use a pinned connection (`connectionFor(config)` returns `{ origin, fetch }`).

The bridge's event stream (`GET /eventstream/clip/v2`, `text/event-stream`, header `hue-application-key`) sends messages whose `data` is a JSON array of events `{ type: 'add' | 'update' | 'delete' | 'error', data: Resource[] }`. Update resources carry only changed fields, for example `{ id, type: 'light', on: { on: false } }` or `{ id, type: 'grouped_light', dimming: { brightness: 66.8 } }`. The bridge accepts only a few concurrent event stream connections.

Library evidence (2026-10-29):

| Package | Version | Last publish / activity | Use |
|---|---|---|---|
| `eventsource` | 5.1.4 | 2026-10-28, repo pushed 2026-10-28, 1.2k stars | Node client for the bridge stream; accepts a custom `fetch`, reconnects with `Last-Event-ID` |
| `msw` `sse` handler | 3.0.3 | (installed) | Mock event stream in unit tests and the e2e mock bridge |

Alternatives: `eventsource-parser` 4.1.3 (maintained parser only; we would write reconnect logic ourselves); `eventsource-client` 1.2.0 (last publish 2025-09). The browser uses its native `EventSource`.

## Goals / Non-Goals

**Goals:**
- One bridge connection, shared by all tabs.
- On/off and brightness changes show in place within a second.
- No keys or raw bridge events reach the browser.

**Non-Goals:**
- Applying color or color temperature changes in place (the UI does not show current color).
- Scenes, entertainment streaming, history of events.

## Decisions

### Server: event hub per bridge
`src/lib/server/hue/events.ts` exports `getEventHub(config)`, cached per `origin + certSha256 + appKey`. A hub:
- starts an `EventSource` on the first `subscribe()`, with `fetch` set to the pinned connection's fetch plus `hue-application-key` and `accept: text/event-stream` headers;
- maps each bridge message to browser updates (`toUpdates`, a pure function) and sends them to all subscribers;
- reports its link state (`open` / `reconnecting`) to subscribers;
- closes the `EventSource` 30 s after the last `unsubscribe()`.

Browser update shapes:
```
{ kind: 'light', id, on?, brightness? }
{ kind: 'group', id: groupedLightId, on?, brightness? }
{ kind: 'reload' }                      // add, delete, metadata, zigbee_connectivity, room, zone, device changes
{ kind: 'status', bridge: 'open' | 'reconnecting' }
```
Brightness is rounded to whole percent. Updates for other resource types (buttons, motion, scenes, entertainment) are dropped.

### Browser endpoint
`GET /api/events` returns a `ReadableStream` with `content-type: text/event-stream` and `cache-control: no-store`. It subscribes to the hub, writes each update as `data: <json>\n\n`, sends a comment line every 25 s so proxies keep the connection open, and unsubscribes when `request.signal` aborts. Without a configured bridge it answers `409`.

### Browser state
`src/lib/live.svelte.ts` exports a `live` object:
- `connect()` opens `EventSource('/api/events')` once per page load (called from `+layout.svelte`);
- `lights` and `groups` are `SvelteMap`s of overrides keyed by light id and grouped light id;
- `connected` is false while the browser `EventSource` is not open or the hub reports `reconnecting`;
- on `reload` updates it calls `refreshAll()`, at most once per second;
- when the connection comes back after a loss it calls `refreshAll()` once;
- `refreshAll()` results clear the overrides, because the new page data already includes them (the layout clears them after navigation completes via `afterNavigate`).

`GroupCard` and `LightRow` read `live.groups.get(id)?.on ?? group.on` (same for brightness) inside their existing `$derived`, so optimistic local changes still work and are replaced by the confirmed value when the update arrives.

`src/lib/commands.ts` no longer calls `refreshAll()` after a successful command.

### Header notice
`+layout.svelte` shows a small muted line "Live updates paused. Reconnecting…" with a spinner when `live.connected` is false after the first connection attempt. It is hidden on `/setup`.

### Mock event stream
The mock home gets an emitter: `updateLight` and `updateGroupedLight` publish CLIP-shaped `update` events for the changed lights and the affected grouped lights. An MSW `sse` handler on `*/eventstream/clip/v2` (app key required) forwards them. `src/mocks/serve.ts` streams response bodies instead of buffering them, so the e2e HTTPS mock bridge can serve the stream. Tests can also publish arbitrary events (for example a `zigbee_connectivity` update) through a helper.

## Risks / Trade-offs

- [Bridge connection limit] → One connection per bridge config; closed 30 s after the last tab.
- [Missed events while disconnected] → Reload after reconnecting and when the tab becomes visible.
- [Group brightness from events is an average over lights that are on] → Same meaning as the loaded model; no conversion needed.
- [Optimistic value briefly replaced by an older event] → Events come in bridge order; the last event for a resource wins, and it reflects the command once the bridge applied it.
- [Proxies buffering `text/event-stream`] → Heartbeat comments every 25 s and `cache-control: no-store`; README notes that reverse proxies must not buffer `/api/events`.
- [`eventsource` with a pinned `fetch`] → The library only needs a fetch that returns a streaming `Response`; covered by a unit test against a local HTTPS server like the TLS tests.
