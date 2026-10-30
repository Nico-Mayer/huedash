# Proposal

## Why

The control dialog stacks a switch, a brightness slider, presets, White/Color tabs, and two more sliders, so it is long and busy. The sliders use the theme's dark or light primary color, so at first glance they do not look like they control light. Hue and saturation as two separate sliders make picking a color slow.

## What Changes

- **BREAKING** Redesign the control dialog for lights, rooms, and zones: the current value large at the top, one large control at a time, and a mode bar with a power button and buttons for brightness, color, and white. The dialog always opens on brightness.
- Add a vertical orientation to `LevelSlider`, used by the dialog.
- Restyle `LevelSlider` in all places (dialog, room header, light cards) to look like light: the fill uses the light's current color, the track the same color faded, and a group uses one generic warm light color. An off light shows a muted fill. The white slider shows a warm-to-cool gradient.
- Replace the hue and saturation sliders with a color pad: hue on one axis, saturation on the other, one drag sets both. Built in-house.
- **BREAKING** Remove the brightness presets (10, 25, 50, 100 %) and white presets (Warm, Soft, Neutral, Daylight) from the dialog.
- **BREAKING** Remove the White and Color tabs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `control-sliders`: sliders look like light (colors, vertical size in the dialog), value label only on horizontal sliders, new color pad, smooth movement covers the pad.
- `light-control`: remove light presets; the dialog opens on brightness and offers modes instead of tabs.
- `room-control`: remove group presets; drop the header's preset sentence.
- `navigation`: the control dialog shows a mode bar instead of tabs.
- `live-updates`: the light color scenario uses the slider fill and the color mode instead of the Color tab.

## Impact

- Components: `Controls.svelte`, `LevelSlider.svelte`, `ColorControl.svelte`, `ColorTemperatureControl.svelte`, `ControlDialog.svelte`, `RoomHeader.svelte`, `LightCard.svelte`.
- Removed: `BrightnessPresets.svelte`, `WhitePresets.svelte`, the `tabs` use in `Controls`.
- New: a color pad component; a theme token for the generic light color in `src/routes/layout.css`.
- Server: the home model gives white gradient colors for each mirek range, so `culori` and `chroma-js` stay on the server.
- Tests: `dialog.e2e.ts`, `details.e2e.ts`, `controls.svelte.test.ts`, `level-slider.svelte.test.ts`, `ControlDialog.svelte.test.ts` change.
- No new dependencies. No command API changes.
