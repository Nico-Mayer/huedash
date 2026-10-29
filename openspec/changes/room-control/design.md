# Design

## Context

bridge-pairing gave us a pinned, typed CLIP v2 client (`openapi-fetch` + `schema.d.ts`), config resolution (`getBridgeConfig`, `connectionFor`), a home page with bridge status and "Forget bridge", and an MSW mock bridge (unit tests) plus a real HTTPS mock bridge for e2e (`src/mocks/preload.ts`). The UI uses shadcn-svelte; `#lib` imports name the file.

CLIP v2 facts the design relies on (from the generated types):
- `room` and `zone` list `children` and `services`. A room's children are devices; a zone's children are lights. Both have one `grouped_light` service.
- `grouped_light` PUT accepts `on`, `dimming`, `color_temperature`, `color` (and more), so group commands need one request.
- `light` has optional `dimming`, `color_temperature.mirek_schema` (supported range), and `color.gamut`. Their presence says what the light supports.
- A device's `zigbee_connectivity` service reports `status`; anything other than `connected` means unreachable.
- Hue's guidance is at most about one command per second per group.

Library evidence (2026-10-29):

| Package | Version | Last publish / activity | Use |
|---|---|---|---|
| `culori` (+ `@types/culori` 4.0.1) | 4.0.2 | 2026-04-03, repo pushed 2026-10-15, 1.2k stars | sRGB to XYZ (D65) for CIE xy |
| shadcn-svelte `slider`, `switch` | CLI 1.7.1 | 2026-10-23 | Built on bits-ui 2.20.2 |

Alternatives: `colorjs.io` 0.7.1 (also maintained, larger API than needed); `svelte-awesome-color-picker` 4.1.3 (Svelte 5, maintained, but brings its own styling outside shadcn tokens). The picker is two shadcn `Slider`s (hue, saturation), which follows the rule to build custom UI on bits-ui primitives.

## Goals / Non-Goals

**Goals:**
- One home model loaded on the server per request, from six parallel CLIP v2 reads.
- Commands never exceed the bridge rate guidance, even with several open tabs.
- Every control usable by touch and keyboard.

**Non-Goals:**
- Scenes, live updates (event stream), gradients, effects, renaming or creating rooms.
- Showing the group's current color (`grouped_light` does not report it); the color picker starts neutral.

## Decisions

### Home model
`src/lib/server/hue/home.ts` exports `loadHome(connection, appKey)`. It reads `room`, `zone`, `grouped_light`, `light`, `device`, and `zigbee_connectivity` in parallel and builds:

```
Group  { kind: 'room' | 'zone', id, name, groupedLightId, on, brightness,
         lights: Light[], colorTemperature: { minMirek, maxMirek } | null, color: boolean }
Light  { id, name, on, brightness | null, reachable, colorTemperature: boolean, color: boolean }
```

Room lights come from child devices' `light` services; zone lights come from `light` children. A group's color temperature range is the union of its lights' `mirek_schema`; the bridge clamps per light. Building the model is a pure function so it is unit-tested without HTTP.

Any failed read makes `loadHome` return `{ status: 'unreachable' | 'unauthorized' | 'certificate-mismatch' }` instead of a partial model.

### Commands through JSON endpoints
- `PUT /api/groups/[groupedLightId]` with `{ on?, brightness?, mirek?, color?: { hue, saturation } }`
- `PUT /api/lights/[lightId]` with `{ on?, brightness? }`

Bodies are validated with zod; numbers are clamped (brightness 1-100). The server maps them to CLIP bodies; color conversion (`culori`: HSV at full value to sRGB to XYZ D65 to xy) runs on the server, so `culori` stays out of the client bundle. Responses: `204`, `400` for invalid input, `502` with `{ error }` when the bridge fails.

JSON `PUT` from another origin needs a CORS preflight that SvelteKit does not answer, so these endpoints are not reachable cross-site.

Alternative: form actions. Rejected: sliders and switches send small partial updates; JSON endpoints avoid form encoding and `deserialize`.

### Rate limit on the server
`src/lib/server/hue/throttle.ts`: per-key leading + trailing throttle with a 1 s window. The first command for a group goes out at once; later commands in the window replace a pending one, and only the last is sent when the window ends. Every caller awaits the result of the command that actually carries its value. Single lights use a shorter window (100 ms), following the same guidance.

Server-side, so several tabs share the limit. The UI also sends sliders only on release (`onValueCommit`).

### UI structure
- `src/routes/+layout.svelte`: header with app name and a settings link (lucide `Settings` icon, labelled).
- `/` (`+page.server.ts` loads the home model): sections Rooms and Zones of `GroupCard` (name links to the detail page, `Switch`, brightness `Slider`). Unreachable model shows `BridgeStatusView` with retry and a settings link. Empty model uses `Empty`.
- `/rooms/[id]`, `/zones/[id]`: shared `GroupDetail` with group controls, `ColorTemperatureControl` (slider in kelvin, shown when supported), `ColorControl` (hue and saturation sliders, shown when supported), and `LightRow` per light. Unknown id shows a not-found state with a link home.
- `/settings`: the bridge status and `ForgetBridge` that bridge-pairing put on the home page.

Optimistic updates: each control keeps a local value, sends the command, and on failure restores the previous value and shows a toast (shadcn `sonner`). After a successful command the page calls `refreshAll()`; a `visibilitychange` listener in the layout calls `refreshAll()` when the tab becomes visible.

### Mock bridge
Fixtures gain a small home: rooms "Kitchen" (color light "Ceiling", ambiance light "Counter") and "Living room" (color light "Lamp", on/off plug "Plug" that is unreachable), and zone "Downstairs" (Ceiling and Lamp). Handlers for the six reads plus `PUT` on `grouped_light` and `light` update the fixture state and record each command in a log that tests can read and reset. The e2e HTTPS mock uses the same handlers.

## Risks / Trade-offs

- [Six reads per page load] → All in parallel on the LAN; typical homes return within tens of milliseconds. Live updates later replace most reloads.
- [Trailing throttle delays the last slider value by up to 1 s] → Matches Hue guidance; the optimistic UI already shows the value.
- [Color conversion ignores per-light gamut] → The bridge clamps to each light's gamut; colors outside it appear as the nearest supported color, as in the Hue app.
- [Zones can contain lights from several rooms] → Model handles lights in multiple groups; a light appears in each group's detail page.
- [`refreshAll` after every command reloads the whole model] → Acceptable until live updates; commands already show their result optimistically.

## Changes found during implementation

- shadcn's `sonner` component pulls in `svelte-sonner` 1.2.2 (published 2026-10-27) and `mode-watcher` 1.1.0 (last published 2025-06) for its theme. Kept as the shadcn default; `mode-watcher` only reads the color mode.
- The shadcn `Slider` put `aria-label` on its root, so the focusable thumb (`role="slider"`) had no accessible name. The generated `slider.svelte` gained a `thumbLabel` prop that labels the thumb.
- Brightness and color changes also send `on: true`, as in the Hue app: dimming or coloring a room that is off turns it on.
- Kelvin and mirek conversion lives in `src/lib/color-temperature.ts`, so client components can use it; `culori` stays in server code.
- `/api/*` requests are excluded from the setup redirect. Without a bridge they answer `409` themselves instead of redirecting a `fetch` to the setup HTML.
- A group command held by the throttle is sent up to one second later. If the user changes a single light in that second, the late group command can override it (seen in e2e). Rare in normal use; live updates will show the real state. E2E tests wait for each command response before the next step.
