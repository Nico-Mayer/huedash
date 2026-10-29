# Proposal

## Why

huedash is mainly a desktop app: Philips has a mobile app but no desktop experience. On a room page today, single lights can only be switched and dimmed. White and color work only for the whole room. The design mockup lets the user select one or several lights and control them in the inspector, with quick presets. This is the second change in the mockup stack, after `app-shell`.

## What Changes

- Select a light by clicking its card. Shift-click or Cmd/Ctrl-click adds or removes lights. A "Select" button in the Lights header starts a select mode for touch screens, in which a tap adds or removes a light; "Done" ends it.
- While lights are selected, the inspector controls them: on/off, brightness, white, and color, limited to what the selected lights support. Without a selection it controls the whole room as today. A "Back to room" control clears the selection.
- The inspector starts at the light's current brightness, white temperature, or color. For several lights it starts at the first selected light.
- Presets in the inspector: brightness 10, 25, 50, 100 %, and white Warm, Soft, Neutral, Daylight. They work for the room and for selected lights.
- Below 1280 px, controls for selected lights open in a bottom sheet, so the page keeps its scroll position. The room controls stay at the top of the page.
- Single-light commands accept color temperature and color, like group commands.
- Live updates carry each light's color temperature and color, so the inspector follows changes from the Hue app.
- The selection ends when the user opens another room or zone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `light-control`: select one or several lights; control white and color of selected lights; presets for lights.
- `room-control`: presets for the whole room.
- `navigation`: the inspector shows the selection when there is one; below 1280 px a bottom sheet holds it.
- `live-updates`: light color temperature and color change in place.

## Impact

- Server: `HomeLight` gains the current color temperature and color; `lightCommandSchema` accepts `mirek` and `color`; `toUpdates` maps light color temperature and color.
- Browser: new selection state, `LightCard` selection behavior, inspector for a selection, presets, bottom sheet. `ColorTemperatureControl` and `ColorControl` take a target instead of a group.
- Components: no new ones. Presets are plain buttons. `sheet` is already installed.
- Tests: unit tests for schemas, model, and updates; component tests for selection and presets; e2e tests for desktop selection, select mode, and the bottom sheet.
