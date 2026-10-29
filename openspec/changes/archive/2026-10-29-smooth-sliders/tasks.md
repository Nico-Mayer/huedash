# Tasks

## 1. Setup

- [x] 1.1 Create the branch `smooth-sliders` on top of `main` with `git-spice branch create smooth-sliders`; verify `git-spice log short` shows it

## 2. Smooth value helper

- [x] 2.1 Build `SmoothValue` in `src/lib/smooth-value.svelte.ts` on `Tween` and `prefersReducedMotion` (design: Shared helper); verify `smooth-value.svelte.test.ts` covers first value without animation, outside change with in-between values, local value while interacting, no move back after commit, and reduced motion

## 3. Level slider

- [x] 3.1 Build `LevelSlider` on the bits-ui `Slider` with `size` `sm` / `lg`, filled range, bar thumb, and `Slider.ThumbLabel` shown on hover, focus, and drag (design: New component); verify with the Svelte autofixer and a component test for accessible name, range, `aria-valuetext`, and the label on focus and hidden on blur

## 4. Call sites

- [x] 4.1 Use `SmoothValue` and `LevelSlider` `lg` for brightness in `Controls`, with the status text reading the smooth value; verify `controls.svelte.test.ts` passes and a new test checks that a live brightness change ends at the new value
- [x] 4.2 Use `SmoothValue` and `LevelSlider` `sm` for brightness in `LightCard`, keeping it above the select button; verify the LightCard tests pass and clicking the slider does not select the card
- [x] 4.3 Use `SmoothValue` and `LevelSlider` `lg` for kelvin in `ColorTemperatureControl`; verify the color temperature range tests pass
- [x] 4.4 Use `SmoothValue` for hue and saturation in `ColorControl` with the shadcn `Slider`, and the preview dot reading the smooth values; verify the hue and saturation tests pass

## 5. End to end and verification

- [x] 5.1 Add an e2e check: starting a scene moves the inspector brightness slider to the scene value without a reload; verify `pnpm test:e2e` passes
- [x] 5.2 Take screenshots of the Kitchen inspector and light cards at 1440 and 390 px in light and dark, with the label shown on focus; fix contrast or layout issues with shadcn tokens; verify by the screenshots
- [x] 5.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, and `pnpm build` exit 0 on the final state; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit with `git-spice branch submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
