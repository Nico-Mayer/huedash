# Proposal

## Why

The inspector does three jobs in one panel: control the room, control one light, and control several selected lights. It is not clear what it controls at a given moment, opening one light replaces the room controls, and the multi-light case is hard to get right because selected lights support different features and ranges. Multi-select is rarely used; zones already group lights that belong together.

## What Changes

- **BREAKING** Remove light selection: single select, Shift and Cmd/Ctrl select, select mode, "Back to room", and the "Control N lights" bar.
- **BREAKING** Remove the inspector column.
- Add a room and zone header with the name, the status line, an on/off switch, a brightness slider, and a "Color and white" button. The header stays at the top while the page scrolls, on screens 768 px and wider.
- Add a control dialog for one target, a room, a zone, or a light, with brightness, brightness presets, white, and color. On screens narrower than 768 px it opens as a bottom sheet.
- The "Color and white" button opens the dialog for the room or zone. Clicking a light card opens it for that light.
- Scenes and lights use the full page width.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `light-control`: remove selection requirements, add opening a light's dialog, move start state and presets to the dialog.
- `room-control`: add the room header and the room dialog, move group presets to the dialog.
- `navigation`: replace the inspector layout with the header and dialog layout.
- `control-sliders`: slider sizes and first value refer to the header and dialog instead of the inspector.
- `live-updates`: the light color scenario uses the dialog instead of the inspector.

## Impact

- Components: `GroupDetail.svelte`, `Controls.svelte`, `LightCard.svelte`; a new header component; a dialog that reuses `Controls`.
- Removed: `src/lib/selection.svelte.ts`, `lightsTarget` and `sharedRange` in `src/lib/control-target.svelte.ts` (replaced by a single-light target).
- New shadcn-svelte component: `dialog`.
- Tests: `selection.e2e.ts` and `details.e2e.ts` change or go away; component tests for the header and dialog.
- No server or API changes.
