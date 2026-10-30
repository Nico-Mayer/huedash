# Proposal

## Why

CI failed on the last two pushes because of one component test that reads the computed opacity of the slider value label. The label also shows on hover, and on CI the real mouse from the previous test file sat over the slider. Several frontend tests check colors, layout, and animations like this. They break on timing and layout, rarely catch real bugs, and now block releases, because the release task needs a green CI run.

## What Changes

- Frontend tests check behavior: roles, names, ARIA values, `data-*` state, and the commands sent. They no longer assert computed styles, inline style values, colors, layout positions, cursors, or animations. Those are checked by eye.
- Remove the style and layout assertions from the component tests for the level slider, scene cards, room header, and light card. This removes the flaky value-label test.
- Remove e2e tests that only check layout, animation, or repeat a component test. e2e keeps the main flows: pairing, rooms, light dialog, scenes, live updates, navigation, theme.
- Playwright retries a failed e2e test once on CI. Tests that pass on retry are reported as flaky.
- The CI failure artifact includes Vitest failure screenshots (`.vitest/attachments/`), and `.gitignore` ignores `.vitest`.
- Add the test rules to `AGENTS.md`.
- Server and unit tests stay as they are. CI stays a blocking check.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No app behavior changes. Some spec requirements about looks (for example the pointer cursor on scene cards) are no longer covered by automated tests.

## Impact

- Test files: `level-slider.svelte.test.ts`, `scenes.svelte.test.ts`, `RoomHeader.svelte.test.ts`, `LightCard.svelte.test.ts`, `navigation.e2e.ts`, `appearance.e2e.ts`, `details.e2e.ts`.
- Config: `playwright.config.ts`, `.github/workflows/ci.yml`, `.gitignore`.
- Docs: `AGENTS.md` (Tests section).
- The `light-card-glow` change is complete but not archived, and it added some of the light card tests touched here. Archive it first.
