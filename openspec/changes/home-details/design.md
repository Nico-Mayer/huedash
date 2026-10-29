# Design

## Context

- `HomeLight` has `mirek` (current white) and `hueSaturation` (current color) since `light-selection`. Colors for scene strips are computed on the server: `xyToHex` (`culori`) and `mirekToHex` (`chroma-js`) in `scene-colors.ts`; both libraries are server only.
- `toUpdates` already reads light `color_temperature` and `color` and sends `mirek` / `hueSaturation`.
- `HomeScene` has `colors` but no brightness. Scene actions carry `dimming.brightness`.
- Devices report `product_data.product_name`; `loadHome` already loads devices. The mock devices have no `product_data`.
- `group-state.svelte.ts` merges live overrides over loaded data (`lightOn`, `lightCounts`, `groupSummary`). The sidebar header shows only "huedash".

Library evidence (2026-10-29): no new packages. `@lucide/svelte` (installed) for the `Lightbulb` icon.

## Goals / Non-Goals

**Goals:**
- Show real light colors without bringing the mockup's own styling into the shadcn theme.
- Keep color math on the server, as for scene strips.

**Non-Goals:**
- "Turn off entire home" (decided against).
- Keyboard shortcuts (the `shortcuts` change).
- Device icons per archetype (bulb, strip, plug): every indicator uses the lightbulb icon.

## Decisions

### `swatch`: one CSS color per light, from the server
`HomeLight` gains `swatch: string | null` and `product: string | null`:
- `swatch` = `mirekToHex(mirek)` while the light shows a white, `xyToHex(xy)` while it shows a color, `null` for lights with neither (plugs, dim-only bulbs).
- `product` = the owning device's `product_data.product_name`.

`StateUpdate` gains `swatch?: string | null`; `toUpdates` sets it next to `mirek` / `hueSaturation` from the same event fields. A light command does not set `swatch` optimistically (the browser cannot convert mirek to a color without `chroma-js`); the live update brings the new swatch within about a second.

Alternative: send only `mirek` / `hueSaturation` and convert in the browser. Rejected: it would ship `chroma-js` and `culori` to the browser, against the server-only rule.

### Light indicator
New `LightIndicator` (`size-9` circle with a `Lightbulb` icon, `size-4`):
- On with a swatch: background `color-mix(in oklab, <swatch> 20%, transparent)`, icon color `<swatch>`, `box-shadow: 0 0 12px <swatch>` at reduced opacity for the glow.
- On without a swatch: `bg-muted` with `text-foreground` icon.
- Off or unreachable: `bg-muted` with `text-muted-foreground` icon, no glow.

The swatch is set through inline `style` with CSS custom properties, so the classes stay static. `LightCard` puts the indicator before the name and shows `product` after the state: "On, 70 % · Hue Signe".

### Sidebar
- Header: "huedash" and below it `homeSummary(home)`, "3 of 4 lights on". `homeSummary` counts unique light ids across rooms and zones; on means reachable and on, with live overrides.
- Entries: up to three `size-1.5` dots before the state line, from `onSwatches(group)`: swatches of reachable lights that are on, in name order, without duplicates; a light without a swatch adds a `bg-foreground/60` dot.

### Scene brightness
`buildHome` sets `HomeScene.brightness` to the rounded average of `action.dimming.brightness` over the scene's actions that have one, or `null`. `SceneList` shows it at the end of the name row, `tabular-nums text-muted-foreground`, next to the Active/Playing badge.

### Mock bridge
Devices get `product_data` with `product_name`: Ceiling "Hue White and Color Ambiance", Counter "Hue White Ambiance", Lamp "Hue Go", Plug "Hue Smart Plug".

### Tests
- Unit: `buildHome` `swatch` (white, color, none), `product`, scene `brightness` (average, none); `toUpdates` `swatch`; `homeSummary` (unique lights, unreachable, live) and `onSwatches`.
- Component: `LightCard` shows the product and an indicator styled with the swatch, muted when off; `SceneList` shows the brightness.
- E2E: the sidebar header shows the home summary and follows a switch; a light card shows its product; a color set through the API changes the indicator color without a reload.

## Risks / Trade-offs

- [Swatch lags the user's own command by up to a second] → acceptable; the slider and state text update at once.
- [Very dark or very light swatches on the theme background] → the 20 % tint and the icon color keep enough contrast in both themes; check screenshots in light and dark.
- [Product names are long ("Hue White and Color Ambiance")] → the state line truncates with an ellipsis.
