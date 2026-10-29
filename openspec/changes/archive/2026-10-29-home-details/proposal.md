# Proposal

## Why

The pages show what a light is set to only as text ("On, 70 %"). The design mockup adds small visual details that make the state readable at a glance: how many lights are on in the whole home, each light's real color, which lights a card stands for, and how bright a scene is. This is the third change in the mockup stack, after `app-shell` and `light-selection`.

## What Changes

- Sidebar header: a home summary, for example "9 of 17 lights on".
- Sidebar entries: small color dots for the lights that are on in the room or zone.
- Light cards: a round indicator with a lightbulb icon, both in the light's current color with a soft glow; muted when the light is off or unreachable. Below the name, the product name (for example "Hue Signe") next to the state.
- Scene cards: the scene's brightness in percent.
- Light colors and the indicator follow live updates.
- Decided against: a "Turn off entire home" button. Rooms keep their own switches.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `navigation`: the sidebar shows a home summary.
- `room-control`: sidebar entries show color dots for lights that are on.
- `light-control`: light cards show a color indicator and the product name.
- `scenes`: scene cards show the scene's brightness.

## Impact

- Server: `HomeLight` gains `swatch` (CSS color of the current white or color) and `product`; `HomeScene` gains `brightness`; live updates carry `swatch`. Colors are computed on the server with the helpers that already draw scene strips.
- Browser: `AppSidebar` header and entries, `LightCard`, `SceneList`.
- Mock bridge: devices get `product_data`.
- Tests: unit tests for the model and updates, component tests for the cards and sidebar, e2e checks.
