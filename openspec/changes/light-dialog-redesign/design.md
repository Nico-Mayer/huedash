# Design

## Context

See proposal.md - Why. Today `ControlDialog` renders `Controls`, which stacks a `Switch`, a horizontal `LevelSlider` for brightness, `BrightnessPresets`, and White/Color `Tabs` with `ColorTemperatureControl`, `WhitePresets`, and `ColorControl` (two shadcn `Slider`s for hue and saturation). `LevelSlider` wraps the bits-ui `Slider` and fills with `bg-primary` on `bg-muted`. It is also used in `RoomHeader` and `LightCard`.

Constraints that shape the approach:

- Light colors (`swatch`) are computed on the server from mirek or xy (`swatchOf` in `scene-colors.ts`, using `chroma-js` and `culori`) and reach the browser in the home model and in live updates (`lightSwatch`). `culori` and `chroma-js` stay on the server.
- Hue and saturation map to xy as HSV with full value (`hueSaturationToXy`). Brightness is separate.
- `groupTarget` has no `mirek` or `hueSaturation`, because the bridge does not report a group's white or color.
- `SmoothValue` already handles animation for outside changes and direct input.

## Goals / Non-Goals

**Goals:**

- One `LevelSlider` for both orientations and both looks (brightness and white).
- A color pad that matches the server's color model exactly, so what the user sees is what the bridge gets (within the lamp's gamut).
- Keep one `Controls` component for lights, rooms, and zones.

**Non-Goals:**

- A history or "x seconds ago" line like the screenshots. huedash has no state history.
- Showing the lamp's color gamut on the pad. Colors outside the gamut are clamped by the bridge, as today.
- Color presets or swatches on the pad.
- Changing the command API, throttling, or `SmoothValue`.

## Decisions

### Color pad: built in-house on CSS gradients

The pad is a rectangle: hue from 0 to 360 left to right, saturation from 100 % at the top to 0 % at the bottom. The background is two layers: `linear-gradient(to top, white, transparent)` over a horizontal hue gradient of `hsl(h 100% 50%)` stops. That is HSV with full value, the same model as `hueSaturationToXy`, so no color math is needed in the browser. A round marker shows the current color.

Input: pointer events with `setPointerCapture` for dragging, `onValueChange` while moving and `onValueCommit` on release, matching the slider callbacks so `SmoothValue` and `control.apply` work as today. The element is focusable, has `role="slider"`, `aria-valuenow` for hue, and `aria-valuetext` like "hue 30, 70 % saturation". Arrow keys step by 1 (hue) and 1 % (saturation), Shift by 10, and each key press commits.

Library search (October 2026):

- `svelte-awesome-color-picker` 4.1.3, published 2026-05-28, Svelte 5, built on `colord`. Rejected: its square is saturation x value, and value has no meaning for a Hue color, because brightness is its own control. The user could pick "dark red", and we would have to drop or misuse the value.
- `@jaames/iro` 5.5.2: has a hue and saturation wheel like the screenshot, but its last release is from 2022-04.
- `svelte-color-wheel` 1.0.2: hue ring only, no saturation, four releases on 2026-04-29 and 2026-04-30 by one author.
- `@simonwep/pickr` 1.10.2 (2026-09): saturation x value square as well; vanilla JS with its own popup UI.
- `colord` 2.10.0 (2026-08): color math, no UI. Not needed, because the pad needs no conversion in the browser.
- bits-ui 2.20.2 has no two-axis primitive. The pad uses bits-ui nowhere, which is why the project rule falls back to custom code.

Alternative: a disc (angle = hue, radius = saturation) like the screenshot. A rectangle needs only linear gradients and a linear pointer mapping, and the arrow keys map directly to its axes.

### `LevelSlider` gets `orientation` and a `tone`

`orientation: 'horizontal' | 'vertical'` passes through to the bits-ui `Slider`, which already supports vertical sliders and keeps the thumb inside the track. The fill uses `height` and `bottom: 0` instead of `width`, with the same `calc` that ends the fill at the thumb's edge. A vertical slider has one size, 96 px wide and `clamp(15rem, 40svh, 18rem)` high, so it never drops below 240 px and still fits short phones; a separate `xl` size was not needed. Vertical sliders do not render `ThumbLabel`.

`tone` decides the colors:

- `{ kind: 'light'; color: string | null }` for brightness: fill `var(--tone)`, track `color-mix(in oklab, var(--tone) 20%, transparent)`. A `null` color (off, or a light without swatch) uses `bg-muted-foreground/40` on `bg-muted`.
- `{ kind: 'white'; stops: string[] }` for white: the track is a linear gradient of the stops, warm at the start; there is no separate fill, the thumb marks the value.

The thumb is a white bar with a 1.5 px dark ring and a soft shadow, so it stays visible on a near-white fill and on a dark or saturated fill, in both themes. The track also gets a faint inset outline drawn above the fill, so a near-white light still shows its edges on a white page.

Callers pass the color through `ControlTarget.swatch`: a light uses `lightSwatch(light)`, a group `var(--light)`. A light that is on but has no swatch (a dim-only bulb) also uses `var(--light)`, so it does not look off. `RoomHeader` and `LightCard` pass `null` while off.

### Generic light color as a theme token

`layout.css` gets `--light` (a warm amber, about `oklch(0.8 0.15 70)`) in `:root` and `.dark`, and Tailwind exposes it through `@theme inline` as `--color-light`. One token keeps rooms and zones consistent and lets dark mode tune it.

Alternative: the average of the group's light colors. The user chose one generic color, because a mix of red and blue lights would give a muddy fill.

### White gradient from the server

The home model gets `whiteStops: string[] | null` on lights and groups: five hex colors spread evenly in mirek over the target's range, made with the existing `mirekToHex`. `ControlTarget` exposes it. The browser only builds a CSS gradient from them.

Alternative: a kelvin-to-RGB formula in `color-temperature.ts`. That duplicates what `chroma-js` already does on the server and could look different from the swatches.

### `Controls` becomes a mode view

State: `mode = $state<'brightness' | 'color' | 'white'>`, starting at `brightness` when the target is dimmable, else `white`, else `color`, else no mode (plug). The layout from top to bottom:

```
+---------------------------+
|           70 %            |  value: K in white mode, else % (or "Off")
|         +------+          |
|         |      |          |  one control:
|         |------|          |  LevelSlider vertical (brightness or white)
|         |######|          |  or ColorPad
|         +------+          |
|  (o) | [B]  [C]  [K]      |  mode bar
+---------------------------+
```

The mode bar is a bits-ui `ToggleGroup` (single) for the modes, next to a power `Toggle` with `aria-pressed` for on/off. In single mode the primitive renders the items as radios with `aria-checked` and arrow-key focus. A function binding ignores the empty value bits-ui sends when the selected item is clicked again, so one mode always stays selected. Each is a round icon button with an `aria-label` (`Brightness`, `Color`, `White`, `Power`). The color and white buttons show small gradients as icons, as in the screenshots. The primitives are used directly; shadcn-svelte's `toggle-group` would add two files for styling we override anyway.

`Controls` owns the brightness and kelvin `SmoothValue`s, because the value at the top needs both. The white slider therefore lives in `Controls`, and `ColorTemperatureControl` is deleted instead of trimmed. `ColorControl` is reduced to the pad. `BrightnessPresets`, `WhitePresets`, and the `tabs` use go away. The start mode is read once with `untrack`, like the start tab before.

While the user drags the pad, nothing else in the dialog shows the color, so the light's swatch updating on the bridge's confirmation is enough. The pad marker itself follows the pointer.

### Dialog content size

The `Dialog` keeps its default width. The value, the control, and the bar are centered. In the bottom `Sheet` the same layout is used; the slider and the pad share the `clamp(15rem, 40svh, 18rem)` height. The pad's marker moves inside a 14 px inset, the marker's radius, so it never sits half outside the pad; pointer positions map through the same inset.

## Risks / Trade-offs

- [Thumb contrast differs per color] → Thumb has both a light line and a dark ring; check red, yellow, 6500 K, and off in both themes in a component screenshot test and by eye.
- [Vertical drag on phones scrolls the sheet] → bits-ui sets `touch-action: none` on the slider; set it on the pad too, and test at 390 px.
- [Removing presets slows down "set to 100 %"] → Keyboard `End` and `Home` on the slider still jump to the ends. Accepted by the user.
- [Group color pad starts at white] → A group has no reported color. Starting at saturation 0 makes a click anywhere choose a color the user sees.
- [`role="slider"` on a two-axis control is not a perfect fit] → `aria-valuetext` names both values. Check with a screen reader; if it reads poorly, switch to two visually hidden range inputs, one per axis.

## Migration Plan

UI and home model only, no stored data. Ship in one release. Roll back by reverting the merge.
