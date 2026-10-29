# Proposal

## Why

huedash can pair with a bridge but cannot control any lights yet. Turning rooms on and off, dimming them, and setting their color is the core of the Hue app and the main reason to open the dashboard.

## What Changes

- Replace the home page with a list of all rooms and zones. Each shows its name, whether it is on, and its brightness, with an on/off switch and a brightness slider.
- Add a detail page per room and per zone with:
  - group on/off, brightness, color temperature, and color;
  - every light in the group with its own on/off switch and brightness slider.
- Add a color picker (hue and saturation sliders) and a color temperature slider limited to what the lights support.
- Send commands from the server to the bridge. Sliders send their value when released, and group commands are throttled to about one per second, as Hue recommends.
- Update the UI at once (optimistic) and revert with an error message when the bridge rejects a command.
- Refresh state after each command and when the browser tab regains focus. No polling; live updates come in a later change.
- Move the bridge name, connection status, and "Forget bridge" from the home page to a new settings page. The home page shows a notice when the bridge is not reachable.
- Extend the mock bridge with rooms, zones, devices, lights, and grouped lights that keep their state.

## Capabilities

### New Capabilities

- `room-control`: listing rooms and zones and controlling them as a group (on/off, brightness, color temperature, color).
- `light-control`: controlling single lights inside a room or zone (on/off, brightness).

### Modified Capabilities

- `bridge-pairing`: "Show connected bridge" moves from the home page to the settings page; the home page shows a notice when the bridge is unreachable.

## Impact

- New dependencies: `culori` and `@types/culori` (color conversion between sRGB and CIE xy).
- New shadcn-svelte components: `slider`, `switch`, `sonner` (error toasts), `empty`.
- New routes: `/rooms/[id]`, `/zones/[id]`, `/settings`, and JSON endpoints under `/api/groups/[id]` and `/api/lights/[id]`.
- New server code in `src/lib/server/hue/` for reading the home model (rooms, zones, devices, lights, grouped lights) and sending commands.
- Modified files: home page, mock bridge handlers and fixtures, e2e tests, `README.md`, `AGENTS.md`.
- Out of scope: scenes (next change), live updates, gradients and effects, renaming or creating rooms, entertainment areas.
