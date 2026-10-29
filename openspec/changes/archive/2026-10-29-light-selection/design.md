# Design

## Context

- After `app-shell`, `GroupDetail` renders `GroupInspector` (group switch and brightness, White/Color tabs) and a grid of `LightCard`s. `LightCard` has a switch and a brightness slider and uses `changeLight` from `group-state.svelte.ts`, which writes optimistic values into `live.lights` and restores them on failure.
- `lightCommandSchema` accepts only `on` and `brightness`. `groupCommandSchema` also accepts `mirek` (clamped to 153-500) and `color` (hue/saturation, converted to xy with `culori` on the server). `toClipBody` already maps all four.
- `HomeLight` has `colorTemperature: boolean` and `color: boolean`, but no current values. The bridge reports `color_temperature.mirek`, `mirek_valid` (false while the light shows a color), `mirek_schema`, and `color.xy`.
- `toUpdates` maps only `on` and `dimming` for lights; other light fields are dropped.
- `ColorTemperatureControl` and `ColorControl` take a `HomeGroup` and send group commands. The color picker starts neutral because the bridge does not report a group color.
- huedash is mainly a desktop app; phones must work, but desktop gets the best experience.

Library evidence (2026-10-29): no new packages. `culori` (installed) converts xy to hue/saturation on the server. `sheet` (bits-ui `Dialog`) is installed.

## Goals / Non-Goals

**Goals:**
- One inspector component path for group and selection, so presets and white/color controls are written once.
- Selection works with mouse, keyboard, and touch.

**Non-Goals:**
- Keyboard shortcuts (Space, arrows, Esc): the `shortcuts` change.
- Light glow, model names, home summary, "turn off entire home": the `home-actions` change.
- Remembering the selection across rooms or reloads.

## Decisions

### Light state in the home model
`HomeLight` changes to:
```
HomeLight {
  id, name, on, brightness, reachable,
  mirekRange: MirekRange | null      // replaces colorTemperature: boolean
  color: boolean
  mirek: number | null               // current, null while mirek_valid is false
  hueSaturation: { hue, saturation } | null   // current, only while the light shows a color
}
```
`hueSaturation` comes from `color.xy` with `culori` (xyY with Y = 1 to HSV), on the server only. `colorTemperature` becomes `mirekRange !== null`; group code that reads it changes accordingly.

### Live updates for light color
`StateUpdate` gains `mirek?: number | null` and `hueSaturation?: {hue, saturation} | null`. `toUpdates` reads `color_temperature.mirek`/`mirek_valid` and `color.xy` for lights: a valid mirek sets `mirek` and clears `hueSaturation`; an xy without a valid mirek sets `hueSaturation` and clears `mirek`. Groups keep only `on` and brightness.

### Light commands
`lightCommandSchema` accepts `mirek` and `color` like the group schema. The light's own range is not checked on the server; the browser clamps presets and sliders to `mirekRange`, and the bridge clamps anything else. `PUT /api/lights/[id]` needs no other change.

### Selection state
New `src/lib/selection.svelte.ts`: one `Selection` instance with `ids: SvelteSet<string>`, `selecting: boolean` (select mode), and `groupId`. `GroupDetail` calls `selection.forGroup(group.id)` in an effect, which clears the selection when the group changes. Methods: `only(id)`, `toggle(id)`, `clear()`, `start()`, `done()`.

`LightCard` gets a selection button that holds the name and state text (`aria-pressed`). Its `::after` stretches over the whole card, so a click anywhere on the card selects; the switch and slider are positioned above it, so they never change the selection. Click without modifiers calls `only`; Shift, Cmd, or Ctrl calls `toggle`; in select mode a plain click toggles. Unreachable cards disable the button.

The card draws exactly one ring: `ring-2 ring-primary` when selected, otherwise the focus ring while the button has keyboard focus. The button has no ring of its own, because holding Shift makes the browser treat a click as keyboard focus, which drew a second ring inside the selected card. Select mode shows no checkbox; the selection ring is enough (a first version had both, which repeated the same information).

Alternative: a `click` handler on the card that ignores clicks from the switch or slider. Rejected: not keyboard accessible without extra roles, and fragile with bits-ui's nested elements.

### One inspector for group and lights
```
Controls (target)
  header: "Controlling" + group name | light name | "N lights" (+ "Back to room")
  SwitchAndBrightness(target)  + BrightnessPresets(target)
  Tabs White | Color (when available)
    ColorTemperatureControl(target) + WhitePresets(target)
    ColorControl(target)
```
A `ControlTarget` describes what to control:
```
ControlTarget {
  name, on, brightness, mirekRange | null, mirek | null, hueSaturation | null, color: boolean,
  apply(change: { on?, brightness?, mirek?, color? }): void
}
```
`groupTarget(group)` sends one group command through `changeGroup`. `lightsTarget(lights)` uses the first selected light (name order) for current values, the intersection of the lights' ranges for `mirekRange`, `color` only when every light has color, and calls `changeLight` for each light. `ColorTemperatureControl` and `ColorControl` take a target instead of a group, as a prop named `control` (`target` collides with Svelte's mount option in component tests). The tab starts on Color when the target's current state is a color, otherwise White.

### Presets
`BrightnessPresets`: buttons 10/25/50/100 % → `apply({ on: true, brightness })`. `WhitePresets`: Warm 2200 K, Soft 2700 K, Neutral 4000 K, Daylight 6500 K → `apply({ on: true, mirek })` with `mirek = clamp(kelvinToMirek(k), range)`. Plain `Button variant="outline" size="sm"` in a 4-column grid with text labels only: the kelvin-to-color helper (`chroma-js`) is server only, and fixed swatch colors would bypass the theme. A toggle group does not fit, because a preset is an action, not a lasting state.

### Placement and bottom sheet
`IsMobile(1280)` (the existing hook with a custom breakpoint) decides the layout:
- **Wide:** the right column shows `Controls(selection ? lightsTarget : groupTarget)`.
- **Narrow:** the top card always shows `Controls(groupTarget)`. When the selection is not empty and select mode is off, a `Sheet side="bottom"` opens with `Controls(lightsTarget)`. In select mode, a sticky bar at the bottom shows "Control N lights"; it ends select mode and opens the sheet. Closing the sheet clears the selection.

The sheet is modal, which is why select mode on narrow screens collects lights first and opens the sheet afterwards. Inside the sheet there is no "Back to room" button: the sheet's own close button does the same and the two would overlap.

### Copy
"Select" / "Done" in the Lights header. "Controlling", "2 lights", "Back to room". Preset labels "10 %", "25 %", "50 %", "100 %", "Warm", "Soft", "Neutral", "Daylight". Sticky bar "Control 2 lights".

### Tests
- Unit: `lightCommandSchema` with mirek and color; `buildHome` current mirek and hue/saturation, including `mirek_valid: false`; `toUpdates` for light color temperature and color; mirek clamping helper.
- Component: `Selection`; `LightCard` click, Shift-click, select mode, disabled when unreachable, switch does not select; `lightsTarget` range intersection and color support; presets send the right commands; tab starts on Color for a light in color mode.
- E2E: desktop click and Shift-click, inspector says "2 lights", brightness preset reaches both lights and not the group; select mode with plain clicks; card selects from its padding; 1024 px sheet opens and scroll position stays; 390 px "Control 2 lights" bar; changing rooms clears the selection.

## Risks / Trade-offs

- [Several lights get several commands; 5 lights = 5 requests] → each light has its own 100 ms throttle, so the requests go out at once; rooms rarely have more than ~10 lights.
- [The mock bridge must report xy for color lights in events] → the mock already publishes light changes; extend it to include `color` and `color_temperature` in events.
- [A light's color from xy is approximate in HSV] → acceptable for a starting position; the bridge stays the source of truth.
- [`HomeLight.colorTemperature` is renamed] → all uses are in `home.ts` and the group range logic; the type checker finds them.
