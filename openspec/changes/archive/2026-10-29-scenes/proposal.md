# Proposal

## Why

Scenes are how most people use Hue: one tap for "Relax" or "Bright" instead of setting each light. huedash can switch and dim rooms but cannot recall the scenes users already made in the Hue app.

## What Changes

- Show a "Scenes" section on every room and zone page, listing the group's scenes by name with a color strip made from the scene's colors.
- Activate a scene with one tap, as the Hue app does. Scenes with a color palette get a play button that starts them in dynamic mode.
- Mark the active scene on the room or zone page, and show its name on the home page card.
- Keep the active scene up to date through live updates, including scenes started in the Hue app.
- Extend the mock bridge with scenes for the Kitchen and Living room that change light state when recalled.

## Capabilities

### New Capabilities

- `scenes`: listing a room's or zone's scenes, activating them (static and dynamic), and showing which scene is active.

### Modified Capabilities

- `live-updates`: adds scene status to the updates applied in place.

## Impact

- New dependency: `chroma-js` (color temperature to RGB for the color strips; server only).
- Home model gains scenes per group (an extra `scene` read on page load).
- New endpoint `PUT /api/scenes/[id]`.
- Modified: `home.ts`, `updates.ts`, `live.svelte.ts`, `GroupCard`, `GroupDetail`, mock bridge, e2e tests, docs.
- Out of scope: creating or editing scenes, smart scenes (time-based), scene photos from the Hue app (not available through the bridge API).
