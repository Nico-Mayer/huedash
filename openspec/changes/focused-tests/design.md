# Design

## Context

- Component tests run in Vitest browser mode (Playwright, Chromium). All test files share one browser page, so the real mouse stays where the last file left it.
- The value label in `LevelSlider.svelte` shows on hover, on keyboard focus, and while dragging. The flaky test focuses and blurs the thumb, then polls the computed opacity. On CI it read exactly `1` after blur in two runs in a row, both times right after `controls.svelte.test.ts`. It did not fail locally.
- About 20 assertions in 5 component test files read computed styles, inline style values, or element positions.
- e2e runs 10 files on one worker against one shared mock bridge. Playwright has no retries configured.
- The CI failure artifact uploads `playwright-report/` and `test-results/`, not Vitest's `__screenshots__/`.

## Goals / Non-Goals

**Goals:**

- One clear rule for what frontend tests check, written in `AGENTS.md`.
- No assertion that depends on hover, layout, color values, or animation timing.
- Fewer e2e tests that overlap with component tests.

**Non-Goals:**

- Visual regression testing (screenshot comparison).
- Changes to server or unit tests, or making CI optional.
- Fixing app code. The flaky test is a test problem, not an app bug.

## Decisions

### Test rule

Frontend tests assert what a user or the bridge can observe:

- roles, accessible names, ARIA values and states
- `data-*` state attributes the component already sets (`data-glow`, `data-lit`, `data-live`)
- text and visible or hidden elements
- commands sent to the mock bridge

They do not assert computed styles, inline style values (custom properties), colors, element positions or sizes, cursors, transitions, or animations. Positions are still fine as input, for example to click a point on the color pad.

Alternative: keep style tests and make them stable (reset the mouse before each test with a custom Playwright command). That fixes this one flake, but keeps tests whose failures say little about bugs.

### Component tests to change

| File | Remove | Keep |
| --- | --- | --- |
| `level-slider.svelte.test.ts` | value label opacity on focus (the flaky test), vertical fill position, fill and track colors, muted fill, white gradient | name, range, and value |
| `scenes.svelte.test.ts` | badge below the color strip, pointer cursor | all behavior tests, "no brightness and no play button" |
| `RoomHeader.svelte.test.ts` | slider fill color, muted when off | the other 5 |
| `LightCard.svelte.test.ts` | `--swatch` style checks, slider fill color and muted fill | `data-glow` and `data-lit` checks, opening tests, product text |

`color-pad.svelte.test.ts` keeps its `getBoundingClientRect` calls, because it only uses them to click and drag.

If a removed test leaves a component's `describe` block with no test, delete the block.

### e2e tests to remove

| File | Test | Reason |
| --- | --- | --- |
| `navigation.e2e.ts` | cross-fades the page when switching rooms | animation |
| `navigation.e2e.ts` | switches rooms without a transition for reduced motion | animation |
| `navigation.e2e.ts` | tablet: puts the header above the scenes and keeps it on screen | layout |
| `navigation.e2e.ts` | gives scenes and lights the full width on wide screens | layout |
| `navigation.e2e.ts` | short phone: scrolls the header with the page | layout |
| `appearance.e2e.ts` | follows a light system theme | mirror of the dark test |
| `appearance.e2e.ts` | applies each theme right away | `theme.svelte.test.ts` checks applying Dark and going back to System; "remembers the theme after a reload" covers the e2e path |
| `details.e2e.ts` | a light card shows its product | covered by `LightCard.svelte.test.ts` |

The phone menu, lost connection on phone, and the phone bottom sheet stay, because they change what the user can do, not only how it looks. "applies the theme before the app scripts run" stays, because a flash of the wrong theme is a real bug that only e2e can catch.

### e2e retries on CI only

`playwright.config.ts` sets `retries: process.env.CI ? 1 : 0`. Locally a failure shows at once. On CI Playwright lists a test that passes on retry as flaky, so it stays visible in the log.

Alternative: Vitest `retry` for component tests. Not needed once the style tests are gone, and it would hide the next flake.

### Screenshots in the CI artifact

Add `src/**/__screenshots__/` to the `upload-artifact` paths in `ci.yml`, and `__screenshots__` to `.gitignore`, because a local failure writes them next to the test file.

## Risks / Trade-offs

- [Visual regressions (colors, glow, layout) are no longer caught by CI] -> Check by eye in `pnpm dev`. The spec requirements stay; only their automated check goes.
- [A retried e2e test runs against bridge state that the first try already changed] -> Most tests set the state they need first. A test that passes only on retry shows as flaky and gets fixed then.
- [Retries make a slow failure take twice as long] -> One retry, CI only.
