# Tasks

## 1. Setup

- [ ] 1.1 Create the stacked branch `home-details` on top of `light-selection` with `git-spice branch create home-details`; verify `git-spice log short` shows it

## 2. Server data

- [ ] 2.1 Add `product_data` to the mock devices, and `swatch` and `product` to `HomeLight`; verify `home.test.ts` covers white, color, no color, and product names
- [ ] 2.2 Add `brightness` to `HomeScene` (average of action brightness, or null); verify `home.test.ts` covers average and none
- [ ] 2.3 Add `swatch` to `StateUpdate` and set it in `toUpdates`; verify `updates.test.ts` covers white and color

## 3. Browser

- [ ] 3.1 Add `lightSwatch`, `homeSummary`, and `onSwatches` to `group-state.svelte.ts`; verify unit tests cover unique lights, unreachable lights, live overrides, and lights without a swatch
- [ ] 3.2 Build `LightIndicator` and add it and the product name to `LightCard`; verify with the Svelte autofixer and component tests for on with a swatch, on without, and off
- [ ] 3.3 Show the home summary in the sidebar header and color dots in the entries; verify with the Svelte autofixer
- [ ] 3.4 Show scene brightness in `SceneList`; verify a component test

## 4. End to end, docs, verification

- [ ] 4.1 Add e2e checks: home summary in the sidebar follows a switch, a light card shows its product, a color set through the API changes the indicator without a reload; verify `pnpm test:e2e` passes
- [ ] 4.2 Take screenshots of the Kitchen and Living room at 1440 and 390 px in light and dark; fix contrast or layout issues with shadcn tokens; verify by the screenshots
- [ ] 4.3 Update `README.md` features; verify `pnpm lint` passes
- [ ] 4.4 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0 on the final state; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit the stack with `git-spice stack submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
- Next change in the stack: `shortcuts`.
