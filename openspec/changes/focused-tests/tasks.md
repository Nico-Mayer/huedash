# Tasks

## 1. Test rule

- [x] 1.1 Add the test rule from design.md to the Tests section of `AGENTS.md` (assert behavior, roles, ARIA, `data-*` state, commands; no computed styles, colors, positions, cursors, or animations; e2e for main flows) and verify `pnpm lint` passes

## 2. Component tests

- [x] 2.1 Remove the style and layout tests from `level-slider.svelte.test.ts` listed in design.md, keep the name, range, and value test, and verify the file passes with `pnpm test:unit --run src/lib/components/home/level-slider.svelte.test.ts`
- [x] 2.2 Remove the badge position and cursor tests from `scenes.svelte.test.ts` and verify the file passes
- [x] 2.3 Remove the slider fill color test from `RoomHeader.svelte.test.ts` and verify the file passes
- [x] 2.4 Remove the `--swatch` style checks and slider fill tests from `LightCard.svelte.test.ts`, keep the `data-glow` and `data-lit` checks, and verify the file passes
- [x] 2.5 Search the component tests for `getComputedStyle`, `getPropertyValue`, `getAttribute('style')`, and `cursor`, and verify that no matches are left; `getBoundingClientRect` only remains where it computes click or drag points

## 3. e2e tests

- [x] 3.1 Remove the 8 e2e tests listed in design.md from `navigation.e2e.ts`, `appearance.e2e.ts`, and `details.e2e.ts`, remove helpers and imports they leave unused, and verify `pnpm lint` and `pnpm check` pass
- [x] 3.2 Set `retries: process.env.CI ? 1 : 0` in `playwright.config.ts` and verify `pnpm test:e2e` passes locally without retries

## 4. CI

- [x] 4.1 Add `.vitest/attachments/` to the upload-artifact paths in `ci.yml` and `.vitest` to `.gitignore`, and verify with actionlint and `git status` after a forced local component test failure
- [ ] 4.2 Run `pnpm lint`, `pnpm check`, and `pnpm test` locally, push, and verify the CI run passes (`gh run list --workflow ci.yml`)

## Workflow follow-up

- Archive `light-card-glow` before applying this change.
- Archive this change after review.
