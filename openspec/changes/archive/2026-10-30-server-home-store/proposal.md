# Proposal

## Why

Every page load, tab focus, reconnect, and structural bridge event makes each tab reload the whole home with 7 bridge requests. The browser merges server data with live override maps, which is two sources of truth and loses updates during a reload. Bridge data is parsed in two ways: GET responses are cast without checks, events are checked with zod. Keeping one validated copy of the home on the server removes the repeated requests, makes every change show in place, and gives the data one path from the bridge to the page.

## What Changes

- The server keeps one copy of the bridge resources in memory. It loads them once, then keeps them current from the bridge event stream.
- One zod schema per bridge resource checks both GET responses and events. Invalid items are skipped and logged instead of failing the page.
- **BREAKING** The server holds the bridge event stream open while a bridge is configured, instead of closing it 30 seconds after the last tab.
- Page loads read the home from the server copy. They do not contact the bridge while the copy is current.
- **BREAKING** The browser event stream sends the whole home (rebuilt at most every 50 ms) and the bridge status instead of single light, group, and scene changes plus a `reload` signal. The browser replaces its home with each message.
- Structural changes (rooms, zones, lights, scenes added, removed, or renamed, and reachability) show in place, without reloading page data.
- When the bridge accepts a command, the server applies it to its copy at once, so every open tab shows it before the bridge confirms it.
- Remove the browser's live override maps, the `reload` message, and the reload on tab focus.
- The home model lists each light once, and rooms and zones refer to their lights by id.
- Changes to different properties of the same target within the rate limit window are combined, not dropped.
- White values are clamped to the range of the light or group, not to a fixed 153-500 mirek range.
- A tab running an older build reloads itself when it connects to a newer server.

## Capabilities

### New Capabilities

- `home-state`: the server's single copy of the home: loading, keeping it current, validating bridge data, and serving page loads from it.

### Modified Capabilities

- `live-updates`: the stream stays open while configured, the browser receives the whole home, structural changes show in place, accepted commands show in all tabs at once, and a reconnect sends fresh data instead of reloading.
- `room-control`: combined changes within the group rate limit, white clamped to the group's range, no reload on tab focus.
- `light-control`: combined changes within the light rate limit, white clamped to the light's range.

## Impact

- Server: new resource store and resource schemas in `src/lib/server/hue/`; `events.ts`, `updates.ts`, `home.ts`, `commands.ts`, `throttle.ts`, `command-endpoint.ts`, `(app)/+layout.server.ts`, `api/events/+server.ts`; the settings "forget" action stops the store.
- Browser: `live.svelte.ts` and `group-state.svelte.ts` are replaced by one home store; `live-updates.ts` message types; pages and components read groups and lights from the store by id; `SceneList.svelte` drops its own pending state.
- API: command endpoints answer `200` with the revision of the applied change instead of `204`.
- Tests: unit tests for the store, schemas, throttle merge, and clamping; component and e2e tests that use `live` or `reload` change.
- No new dependencies.
