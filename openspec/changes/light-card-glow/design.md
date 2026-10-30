# Design

## Context

`LightCard` is an `<li>` with `bg-card`. Its open button stretches over the card with an `after:` overlay, and the switch and slider sit above it. `LightIndicator` decides "lit" as `on && swatch !== null` and passes the color as the `--swatch` CSS variable. Home Assistant tiles tint the card in the tile color only on hover (4 % opacity, 12 % on press); we keep a faint glow at rest as well, see proposal.md.

## Goals / Non-Goals

**Goals:**

- Glow only where the indicator is lit, from the same data.
- Animate only `transform` and `opacity`.

**Non-Goals:**

- Glow on room and zone headers. A group has many colors and needs its own idea.
- A pressed state with a stronger tint.

## Decisions

### Same "lit" rule as the indicator

The card computes `lit` the same way as `LightIndicator`: reachable, on, and a swatch. The card sets `--swatch` and `data-glow` on the `<li>`, so tests can read them like the indicator's `data-lit`.

### Default white for dim-only lights

Bulbs like the Hue White Luster support dimming but report no white or color, so `light.swatch` is null. `lightSwatch(light)` in `control-target.svelte.ts` returns `light.swatch`, or `GENERIC_LIGHT` (the `--light` token the room slider already uses) when the light supports dimming. The card passes it to the indicator and the glow. Plugs have no dimming and stay muted, because they give off no light.

Alternative: `target.swatch`. It falls back to `GENERIC_LIGHT` for every light, plugs included. Alternative: a default swatch on the server. It would also change the sidebar and room header dots, which is outside this change.

### Glow on a `before:` pseudo-element

The `<li>` gets `isolate overflow-hidden` and is a named group `group/card` (the slider and switch already use named groups). The indicator gets a `relative` wrapper. Its `before:` element with `-z-10` sits above the card background and below the content. It holds a radial gradient from `color-mix(in oklab, var(--swatch) var(--glow), transparent)` to transparent, centered on the indicator by the wrapper, so no offsets are hard-coded.

- At rest the element is small, so the glow ends around the middle of the card.
- On `group-hover/card` and `group-has-[button:focus-visible]/card` it scales up and fades a little until it covers the card.
- `transition` on `scale` and `opacity`, about 500 ms with `ease-out`, so the fill grows slowly and settles softly. `motion-reduce:transition-none` drops it.

CSS cannot transition between two gradients, and transitioning `background-size` repaints on every frame. Scaling a pseudo-element is cheap and keeps the markup unchanged.

Alternative: an extra `<span>` element. Same result, one more node, and the pseudo-element is enough.

### Separate strength for light and dark mode

A few percent of a color is clear on a dark card but invisible on white. The mix percentage uses a `dark:` variant. Exact values are tuned in the browser during apply; the spec does not fix them. After review the glow was reduced to stay subtle, closer to the Home Assistant tint.

### No library

The effect is a few Tailwind utility classes with `color-mix`. No maintained library would remove code here.

## Risks / Trade-offs

- [Light colors like warm white barely show on a white card] → Tune the light mode percentage on white, warm white, and a saturated color before finishing.
- [`overflow-hidden` could clip the slider thumb or focus ring] → The ring is a `box-shadow` on the `<li>` and the thumb sits inside the padding; check both in the browser.
- [Touch devices have no hover] → The glow at rest still shows the color there.
