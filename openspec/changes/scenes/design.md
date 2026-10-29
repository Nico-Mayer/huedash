# Design

## Context

The home model (`loadHome`, six parallel CLIP v2 reads) builds `HomeGroup`s with lights. Commands go through `PUT /api/groups|lights/[id]` with per-id throttling; the browser uses `applyChange` (optimistic, toast on failure) and `live` overrides fed by `/api/events`. `toUpdates` maps bridge events and currently drops `scene` resources. Color conversion to CIE xy uses `culori` on the server.

From the generated types:
- `scene` has `group` (room or zone rid), `metadata.name`, `actions[]` (per light: `on`, `dimming`, `color.xy`, `color_temperature.mirek`), optional `palette` (`color[]`, `color_temperature[]`, `dimming[]`), `speed`, `auto_dynamic`, and `status.active` (`inactive` | `static` | `dynamic_palette`).
- `PUT /resource/scene/{id}` with `recall: { action: 'active' | 'dynamic_palette' | 'static' }` recalls a scene. `active` follows the scene's `auto_dynamic` setting, like the Hue app.
- Scene status changes arrive on the event stream as `scene` updates with `status`.

Library evidence (2026-10-29):

| Package | Version | Last publish / activity | Use |
|---|---|---|---|
| `chroma-js` | 3.2.0 | 2025-11-28, repo pushed 2026-10-24, 10.6k stars | `chroma.temperature(kelvin)` for color-temperature actions |
| `culori` | 4.0.2 | (installed) | xyY to sRGB for color actions |

Alternatives: `color-temperature` 0.2.7 and `kelvin-to-rgb` 1.0.2 (both last published 2022); `colorjs.io` (no color temperature helper); a handwritten Planckian-locus approximation (rejected by the library-first rule).

## Goals / Non-Goals

**Goals:**
- Scenes appear on room and zone pages within the existing page load.
- One tap recalls a scene; the active scene stays correct through live updates.

**Non-Goals:**
- Creating, editing, or deleting scenes; smart scenes; scene photos.

## Decisions

### Scenes in the home model
`loadHome` adds a seventh parallel read, `GET /resource/scene`. `buildHome` attaches scenes to their group:

```
HomeScene { id, name, colors: string[], dynamic: boolean, active: 'inactive' | 'static' | 'dynamic_palette' }
HomeGroup { ..., scenes: HomeScene[] }   // sorted by name
```

`dynamic` is true when the scene's palette has at least one color. `colors` are up to five CSS hex colors, one per distinct action color, in action order; xy actions convert with `culori` (xyY with Y = 1, gamut-clipped to sRGB), mirek actions with `chroma.temperature(1e6 / mirek)`; actions with neither are skipped. Colors are computed on the server, so neither library reaches the browser.

### Activation endpoint
`PUT /api/scenes/[id]` with `{ mode: 'active' | 'dynamic' }` sends `recall: { action: 'active' | 'dynamic_palette' }`. It uses the same `commandEndpoint` helper and a 1 s per-scene throttle. Responses: `204`, `400`, `502`.

### Live updates for scenes
`toUpdates` handles `scene`:
- `update` with `status` and no `metadata` → `{ kind: 'scene', id, active }`;
- `add`, `delete`, or metadata changes → `reload`.

`live` gains a `scenes` `SvelteMap<id, active>`. Because the bridge sends separate updates per scene, the browser treats the newest non-inactive status as active and keeps the rest from data or updates.

### UI
- `SceneList` (on `GroupDetail`, between group controls and color controls): a list of buttons. Each shows a horizontal color strip (CSS `linear-gradient` from `colors`, inline style), the name, an "Active" or "Playing" badge, and, for dynamic scenes, a play icon button (`aria-label="Play <name>"`). Selecting the row recalls with `mode: 'active'`; the play button with `mode: 'dynamic'`.
- Optimistic: the selected scene shows as active at once; the live update confirms it; on failure the previous state returns with a toast.
- `GroupCard` shows the active scene's name in its description ("Relax · 60 %").
- Empty state when a group has no scenes, using `Empty`.

### Mock bridge
Fixtures add scenes: Kitchen "Bright" (color temperature), "Relax" (warm color temperature, dimmer), "Tropical" (colors and a palette); Living room "Reading". Recalling applies the actions to the lights, sets the scene's status (others in the same group become inactive), logs the command, and publishes light, grouped light, and scene status events.

## Risks / Trade-offs

- [Seventh read per page load] → One extra parallel request; live updates avoid most reloads.
- [Color strip differs from the Hue app's scene image] → The bridge does not expose scene images; colors come from the scene's own actions.
- [A light changed after a recall makes the bridge set the scene inactive] → Shown as such, matching the Hue app.
- [Two color libraries on the server] → Both are server-only and bundled; `chroma-js` is used for one function. Revisit if one library covers both later.
- `live` keeps a plain status per scene instead of "newest active wins per group": the bridge reports the previous scene as `inactive` when another starts, so per-scene status is already correct.
