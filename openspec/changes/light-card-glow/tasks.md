# Tasks

## 1. Light card glow

- [x] 1.1 Compute `lit` in `LightCard` with the same rule as `LightIndicator` and set `--swatch` and `data-glow` on the `<li>` (design: Same "lit" rule as the indicator); verify `LightCard.svelte.test.ts` covers a lit card, an off card, an unreachable card, and "Plug" without a swatch
- [x] 1.2 Add the `before:` glow with resting size, hover and focus fill, transition, `motion-reduce:transition-none`, and separate light and dark strength (design: Glow on a `before:` pseudo-element); verify with the Svelte autofixer and `pnpm check`
- [x] 1.3 Tune the glow in the browser with `pnpm dev` in light and dark mode for white, warm white, and a saturated color; verify at rest, on hover, on keyboard focus, and that the slider thumb and focus ring are not clipped

## 2. Integration

- [x] 2.1 Extend the existing live color e2e test to check that the card glow follows a color change from the event stream; verify `pnpm test:e2e` passes
- [x] 2.2 Run `pnpm lint`, `pnpm check`, and `pnpm test:unit --run`; verify all pass

## 3. Review findings

- [x] 3.1 Add `lightSwatch(light)` with the default white for dim-only lights and use it for the indicator and glow in `LightCard` (design: Default white for dim-only lights); verify `control-target.svelte.test.ts` and `LightCard.svelte.test.ts` cover a dim-only light and a plug without dimming
- [x] 3.2 Reduce the glow strength and slow the hover transition to about 500 ms with `ease-out`; verify in the browser in light and dark mode
