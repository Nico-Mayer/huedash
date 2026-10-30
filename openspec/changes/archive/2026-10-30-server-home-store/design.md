# Design

## Context

See proposal.md - Why. Today:

- `(app)/+layout.server.ts` calls `loadHome()`, which sends 7 GETs and casts the results (`as Room[]`) into `buildHome()`.
- `events.ts` holds one bridge stream per config, opened by the first tab and closed 30 s after the last. `updates.ts` checks events with its own zod schemas and turns them into `light`, `group`, `scene`, `status`, or `reload` messages.
- The browser keeps `live.lights`, `live.groups`, and `live.scenes` override maps over the server-rendered home. `reload` and tab focus call `refreshAll()`, then clear the maps.
- `throttle.ts` replaces a waiting command, so properties of the earlier waiting command are lost. `commands.ts` clamps mirek to 153-500 for every target.
- `HomeGroup.lights` holds full light objects, so a light in a room and a zone is sent twice. `homeSummary` removes the duplicates again.

## Goals / Non-Goals

**Goals:**

- One path for bridge data: bridge -> checked resources -> home -> browser.
- No bridge request for a page load, tab focus, or browser reconnect while the stream is open.
- One source of state in the browser, plus short-lived values for commands in flight.

**Non-Goals:**

- Using the copy for the settings page bridge check or `/healthz`. They keep their own request.
- Partial updates to the browser (patches). Decided against in exploration: the browser would have to compute group values again.
- HTTP/2 to the bridge.
- Holding back bridge reports that are older than a command in flight (see Risks).

## Decisions

### Data flow

```
bridge GET x7 --+
                +--> parse (resource schemas) --> resource store --> buildHome() --> home + revision
bridge events --+                                     ^                                  |
                                                      |                       +----------+----------+
command accepted (200) --> apply as CLIP update ------+                       |                     |
                                                                       layout load (SSR)    /api/events
                                                                              |                     |
                                                                              +-----> browser home store
```

### Resource schemas: hand-written zod, checked against the generated types

`src/lib/server/hue/resources.ts` defines one zod schema per resource type (room, zone, device, light, grouped_light, zigbee_connectivity, scene) with only the fields huedash reads. GETs and events use the same schemas. Event data is partial (for example `dimming: { brightness }` only), so the store merges an update into the stored resource and checks the result with the same full schema. If the result fails, the store keeps the previous resource. No second, partial schema is needed. A compile-time assertion checks that each schema's output fits the matching type in `schema.d.ts`, so a change in `openhue.yaml` shows up in `pnpm check`.

Items that fail are skipped and logged once per id. A list response with a bad item keeps the other items.

`updates.ts` and its message mapping are removed.

- Alternative: generate zod from `openhue.yaml`. Checked 2026-10-30: `@hey-api/openapi-ts` 0.99.0 (published 2026-09-30, zod v4 plugin), `orval` 8.45.0 (2026-10-25), `typed-openapi` 4.1.0 (2026-09-16), `openapi-zod-client` 1.18.3 (2026-06-15). All are maintained, but they generate strict schemas for the whole community-made spec (about 9,700 lines), so a field huedash never reads could reject a valid resource. They would also add a second generator next to `openapi-typescript`. The hand-written subset is small (7 resources), and the compile-time check against the generated types keeps it tied to the spec.

### Resource store

`src/lib/server/hue/store.ts` holds the parsed resources by type and id, a `revision` number, and the derived `home`. The store:

- loads all 7 lists, with one shared promise for concurrent callers;
- applies `add`, `update` (deep merge into the existing resource), and `delete` events;
- rebuilds `home` with the existing `buildHome()` and increments `revision` at most every 50 ms (first change starts the timer, it is not reset), then notifies listeners;
- exposes `status`: `loading`, `ok`, or a `BridgeFailure`.

Startup order: open the stream, buffer events, load the lists, apply the buffer, then apply events directly. On each reconnect (`onopen` after an error) the store loads again the same way. The 5 s restart timer for a closed stream stays.

There is one store per config key (origin, cert, app key), like today's hub map. When the key changes or the bridge is forgotten, the old store closes its stream and is dropped. The settings `forget` action calls this. The store is opened lazily by the first layout load or `/api/events` request, and then stays open.

The store replaces `events.ts`'s per-tab idle logic and `loadHome()`.

### Home model: lights once, groups by id

```
Home = {
  lights: Record<id, HomeLight>
  rooms:  HomeGroup[]   // lightIds: string[] sorted by light name
  zones:  HomeGroup[]
}
```

`HomeGroup.lights` becomes `lightIds`. Scenes stay inside their group, because each scene belongs to one group. Group values that depend on lights (`colorTemperature`, `whiteStops`, `color`) stay derived on the server in `buildHome()`.

### Browser stream: full home, plus status and version

`/api/events` sends three message kinds:

```
{ kind: 'hello', version }              // on connect, from $app/env
{ kind: 'status', bridge: 'open' | 'reconnecting' }
{ kind: 'home', revision, home }        // on connect when loaded, then on every revision
```

The browser compares `version` with its own and calls `location.reload()` when it differs. Server and browser are built together, so the messages are typed with shared TS types and not checked with zod in the browser.

- Alternative: SvelteKit's `updated` from `$app/state`. It polls `version.json` on a timer or waits for a failed navigation. The stream already connects on every reconnect, so checking there is immediate and needs no polling.

### Browser home store

`src/lib/home.svelte.ts` replaces `live.svelte.ts` and the override parts of `group-state.svelte.ts`. It holds `home` and `revision` in `$state.raw`, the connection state (same `open` and `connected` logic as today), and a map of pending changes per target. It starts from the layout data and takes a stream message only when its revision is newer.

Pages and components get groups and lights from the store by id. `+page.ts` returns the id and kind only. Components read values through the same helper names as today (`groupOn`, `lightBrightness`, ...), which now read the pending change first, then `home`.

### Commands: apply on the server, answer with the revision

After the bridge accepts a command, the server applies the CLIP body to the store as an update of that resource, before it answers. The endpoint then answers `200 { revision }` with the store revision that contains the change.

- Light: the body is applied to the light. A color sets `color_temperature.mirek_valid` to false, and a mirek sets it to true, the same way the bridge reports it.
- Group: the body is applied to the grouped light and to each member light that supports the property. Values are clamped per light.
- Scene: the recalled scene gets `static` or `dynamic_palette`, and the other scenes of its group get `inactive`.

In the browser, a change is kept as pending from the click until a `home` with `revision >= ` the answer's revision arrives. On failure, the pending change is dropped and the toast shows, as today. Each pending change has a token, so the answer to an older command does not clear a newer one. `SceneList` drops its own `pending` and `CONFIRM_MS`.

- Alternative: wait for the bridge event only. That takes up to about 1 s in other tabs (unconfirmed reports say the bridge groups events per second; see Open Questions).
- Alternative: clear pending on the HTTP answer. The answer can arrive before the stream message, so the UI would jump back for a moment.

### Throttle merges waiting commands

`createThrottle` takes a `merge(previous, next)` function. The commands use a shallow merge of the CLIP body (`{ ...previous, ...next }`), so the latest value of each property wins and properties of earlier waiting commands are kept. Scenes use "latest wins", as today. Waiters still all get the result of the combined command.

### Clamping per target

The command schema keeps type and shape checks only. The sender looks up the target in the store: unknown id -> `404`, without a bridge request. Mirek is clamped to the light's `mirekRange` or the group's `colorTemperature`. Brightness stays 1-100.

### No new dependencies

The stream, store, and merge are small and specific to the CLIP model. A general state-sync library would still need the CLIP merge rules, so none is added.

## Risks / Trade-offs

- [A bridge report about an earlier command arrives after a newer command was applied, so the value jumps back for a moment] -> Commands are sent when a slider is released, so this needs two releases within about 1 s. Today's behavior is the same. Hold back reports only if e2e or real use shows it.
- [The copy goes stale if the stream silently stops delivering] -> The `eventsource` client reconnects on errors, and each reconnect loads the copy again. The heartbeat stays for browser connections.
- [The full home on every change is larger than single updates] -> At most one message every 50 ms. Measure the size with the mock home and a large fixture (50 lights, 20 scenes) in a unit test. Patches remain possible later without changing the specs.
- [The bridge may limit event stream connections] -> huedash still uses one connection. Only its lifetime changes.
- [Forgetting the bridge or re-pairing leaves an old stream open] -> The store map closes the old store when the config key changes. A unit test covers it.
- [Tests share the server store across unit tests] -> Reset the store map in `vitest.setup.ts` next to `resetHome()`.

## Migration Plan

Deploy as a normal image update. Tabs opened before this change do not know the `hello` message and ignore it, so they must be reloaded by hand once. After that, version changes reload tabs automatically. No data migration. Rollback is the previous image.

## Open Questions

- How long the bridge takes from a change to its event. Community posts say events are grouped about once per second; not confirmed by Philips. Measure on real hardware after the change, because it does not change the approach.
