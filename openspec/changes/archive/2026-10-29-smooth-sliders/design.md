# Design

## Context

- `#lib/components/ui/slider/slider.svelte` is the shadcn wrapper around the bits-ui `Slider`: 12 px track, 16 px round thumb. Four call sites use it: `Controls` (brightness), `LightCard` (brightness), `ColorTemperatureControl` (kelvin), and `ColorControl` (hue, saturation).
- Every call site uses the same pattern: `let value = $derived(<live value>)`, `bind:value`, and a command in `onValueCommit`. The `$derived` value resets to the live value on every change, so the thumb jumps.
- `onValueCommit` fires on pointer release and on every arrow key press. Commands go through `ControlTarget.apply` / `changeLight`, which update live state optimistically; the bridge confirms through the live stream later.
- Tests find sliders by accessible name (`Kitchen brightness`, `Ceiling color temperature`, `Kitchen saturation`) and read `aria-valuemin`, `aria-valuemax`, and the sent body.

Library evidence (2026-10-29), no new packages:
- `bits-ui` 2.20.2 (installed, latest, published 2026-10-23): `Slider.Root`, `Range`, `Thumb`, and `Slider.ThumbLabel`, which places a label next to a thumb by index and position.
- `svelte` 5.57 (installed; 5.57.3 published 2026-10-26): `Tween` and `prefersReducedMotion` from `svelte/motion`.
- Alternatives: `svelte/motion` `Spring` (overshoot and settle time do not fit a value bar), CSS transitions on the range width and thumb position (the bits-ui thumb is placed with inline `left` styles, and the value label and status text would not follow), and `motion` / GSAP (new dependency for a single tween).

## Goals / Non-Goals

**Goals:**
- One place for the "follow live value, but not while the user is using it" logic, used by all four sliders.
- Keep the accessible names, ranges, and commit behavior, so commands and existing tests stay the same.

**Non-Goals:**
- Tick marks (decided against for now).
- Gradient tracks for white, hue, or saturation.
- Changing the shadcn `Slider`; hue and saturation keep it.

## Decisions

### Shared helper: `SmoothValue`
A class in `src/lib/smooth-value.svelte.ts` built on `Tween`:

```
 live value --(outside change)--> tween.target --> current (shown)
                                                     ^
 user input --(drag / keys)----> local value --------+ while interacting
 commit -----------------------> tween.set(v, { duration: 0 })
```

- Created with a getter for the live value: `new SmoothValue(() => control.brightness)`. The tween starts at the live value, so nothing animates on first render.
- `Tween.of` follows the live value. Its `duration` is a function that returns 0 while `prefersReducedMotion.current` is true, otherwise 300 ms, `cubicOut`.
- `current` returns the user's input while interacting, otherwise `tween.current` rounded to a whole number.
- `input(v)` comes from `onValueChange`, which bits-ui calls only on user input, so no two-way binding is needed. It stores the local value and marks interacting.
- `commit(v)` jumps the tween to `v` with `duration: 0` and ends interacting. The optimistic update then sets the same target, so nothing moves back toward the old value (spec: No animation for the user's own input).

Alternative: put the logic inside the new slider component. Rejected: hue and saturation keep the shadcn slider and need the same behavior, and the status text outside the slider must read the same moving value.

### New component: `LevelSlider`
`src/lib/components/home/LevelSlider.svelte`, a custom component on `SliderPrimitive` (bits-ui), not a shadcn component, so `pnpm dlx shadcn-svelte add slider` cannot overwrite it.

```
 size="lg" (inspector, h-10)          size="sm" (card, h-6)
         +------+
         | 40 % |  <- ThumbLabel, while in use
 +-------+--+---+----------------+   +###########|---------+
 |##########|                    |
 +----------+--------------------+
  Fill is a rounded pill; thumb is a short light line inside its end
```

- Props: `value` (bindable), `min`, `max`, `step`, `size: 'sm' | 'lg'`, `format: (value) => string` for the label, `thumbLabel` (accessible name), `onValueCommit`, `disabled`, and rest props to the root.
- Track `rounded-lg bg-muted`. The fill is our own `bg-primary` span, not `Slider.Range`: bits-ui sets the range end as `right: x%`, which cannot round the end. The thumb is a transparent `w-6` box with a `bg-primary-foreground` line inside; `thumbPositioning="contain"` places that box so its right edge is at `fraction * (100% - 1.5rem) + 1.5rem`, the fill width. Semantic shadcn tokens only.
- Label: `Slider.ThumbLabel` with `position="top"`, a small popover style (`bg-popover text-popover-foreground`, `text-xs tabular-nums`). Shown with CSS: `group-hover`, `group-focus-within`, and the root's `data-active` / pointer state while dragging. It is `aria-hidden`, because the thumb already exposes `aria-valuenow`; `aria-valuetext` carries the formatted value.

Alternative: the shadcn slider with larger classes. Rejected: the shadcn file is generated and gets overwritten by updates, and its round thumb does not fit the filled-bar look.

### Call sites
- `Controls` and `LightCard`: brightness `SmoothValue`, `LevelSlider` `size="lg"` / `"sm"`, `format: (v) => \`${v} %\``. The status text reads `smooth.value`.
- `ColorTemperatureControl`: kelvin `SmoothValue` over `mirekToKelvin(control.mirek)`, `LevelSlider` `size="lg"`, `format: (v) => \`${v} K\``.
- `ColorControl`: hue and saturation `SmoothValue`s with the shadcn `Slider`; the preview dot reads the smooth values.
- `LightCard` keeps `class="relative"` so the slider stays above the card's select button.

### Tests
- Unit (`smooth-value.svelte.test.ts`, browser project for runes and `Tween`): first value without animation, outside change passes values in between and ends at the target, local value wins while interacting, commit does not move back, reduced motion jumps.
- Component: `LevelSlider` keeps the accessible name and range, shows the label on focus and hides it on blur; existing `controls.svelte.test.ts` tests keep passing.
- E2E: after starting a scene, the inspector brightness slider ends at the scene value (existing scene flow). Animation timing is covered by unit tests, not e2e.

## Risks / Trade-offs

- [`onValueCommit` fires on every arrow key, so keyboard use ends interacting after each key] → fine: commit jumps the tween to the key value, so there is no visible animation.
- [Live update during a drag is ignored until release] → by design (spec); after release, the next live update moves the slider normally.
- [Tests that read a value right after a live change may see an in-between value] → use `expect.poll` / `expect.element` retries; unit tests can use reduced motion or `duration: 0`.
- [Hue animates across the whole range, for example 350 to 10] → the slider is linear, so moving across it is correct for this control.
