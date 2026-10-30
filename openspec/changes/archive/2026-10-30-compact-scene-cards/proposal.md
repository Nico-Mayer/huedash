# Proposal

## Why

Scene cards use the same grid as light cards, so a few scenes fill the whole width. The brightness label and the play button add little value: the color strip already says what the scene looks like, and dynamic mode should be the default for scenes that support it. The cards also do not show the pointer cursor, so they do not look clickable.

## What Changes

- Scene cards become narrower: the scene grid shows about twice as many cards per row as the light grid, with a smaller color strip.
- Remove the brightness label from scene cards. The home model no longer computes scene brightness.
- **BREAKING** (behavior): remove the play button. Selecting a scene with a color palette starts it in dynamic mode. Scenes without a palette recall as before.
- The status badge of the active scene becomes an icon badge in the bottom right corner, next to the name: one icon for dynamic ("Playing"), one for static ("Active"). For scenes with a palette it is a toggle that switches between dynamic and static without leaving the scene.
- The scene API accepts a `static` mode, so switching off dynamic mode sends a static recall to the bridge.
- Scene cards and the badge toggle show the pointer cursor on hover.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scenes`: the scene list no longer shows brightness; selecting a palette scene starts it dynamically; the play control is replaced by a dynamic/static toggle on the active scene's badge; the rate limit scenario uses the toggle.

## Impact

- `src/lib/components/home/SceneList.svelte`: layout, badge toggle, no play button, no brightness, cursor.
- `src/lib/server/hue/commands.ts`: `sceneCommandSchema` adds `static`, mapped to the `static` recall action.
- `src/lib/server/hue/home.ts`: drop `brightness` from `HomeScene` and `averageBrightness`.
- `src/mocks/bridge/`: the mock recall already supports `static`.
- Tests: `scenes.svelte.test.ts`, `scenes.e2e.ts`, `commands.test.ts`, `home.test.ts`, `api/scenes/server.test.ts`, and fixtures that build a `HomeScene` with `brightness`.
