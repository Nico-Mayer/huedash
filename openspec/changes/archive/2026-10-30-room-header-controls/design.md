# Design

## Context

See proposal.md for motivation. Today `GroupDetail.svelte` renders `Controls.svelte` in an inspector column at 1280 px and wider, and in a bottom `Sheet` for selected lights on narrower screens. `Controls` takes a `ControlTarget` (`groupTarget` or `lightsTarget`) and already hides white or color when the target does not support them. Selection state lives in `src/lib/selection.svelte.ts`. The small-screen top bar in `(app)/+layout.svelte` shows below 768 px, the same breakpoint as `IsMobile`'s default.

## Goals / Non-Goals

**Goals:**

- One control component for rooms, zones, and lights, shown in one dialog.
- The room header is the only place with inline group controls.
- Remove all selection code and its tests.

**Non-Goals:**

- New light features in the dialog (effects, gradients, identify, rename). The dialog leaves room for them later.
- Changing the light card itself, apart from what a click does.
- A Hue-style color wheel with one dot per light.

## Decisions

### Dialog: shadcn-svelte `dialog` on wide screens, the existing `sheet` below 768 px

Both are built on the bits-ui `Dialog` primitive, so focus trap, Escape, and focus return behave the same. One `ControlDialog` component picks `Dialog` or `Sheet` (`side="bottom"`) with `IsMobile()` and renders `Controls` inside.

- bits-ui 2.20.2, already a dependency, published 2026-10-23.
- Alternative: shadcn-svelte `drawer` (vaul-svelte). Its latest release is 0.3.2 from 2025-03, so it looks unmaintained, and it adds a dependency for a swipe gesture we do not need.
- Alternative: dialog on all screens. A centered dialog on a phone leaves little room for the color picker.

### One dialog per page, keyed by target id

`GroupDetail` holds `open: { kind: 'group' } | { kind: 'light'; id: string } | null`. The light is looked up by id in the current group data, so live updates and data reloads keep the dialog on the same light. If the light disappears or becomes unreachable, the dialog closes.

- Alternative: one dialog per light card. That means N dialog instances and harder focus handling.

### `ControlTarget` stays, `lightsTarget` becomes `lightTarget`

`lightTarget(light)` returns the light's own range, color support, and live values. `sharedRange` and the "first light by name" logic go away. `groupTarget` does not change, so the room dialog keeps today's group behavior (union of capabilities, group commands).

### `Controls` drops its card chrome

The dialog header shows the title (target name) and description (`Room · 3 lights`, `Zone · 2 lights`, or the product name). `Controls` keeps the switch, brightness, brightness presets, and the White/Color tabs. The "Controlling" label and `onBack` go away.

### `RoomHeader` component

It holds the name, the status line (`activeScene` name, then `lightsSummary`), the switch, a brightness slider with its % value, and the "Color and white" button. The swatch on the button reuses `onSwatches(group)`, the same dots the sidebar shows. The header is `md:sticky md:top-0` with a background and bottom border, so content scrolls under it. Below 768 px it scrolls with the page, under the existing top bar.

### Light card click opens the dialog

The card's stretched button drops `aria-pressed` and gets `aria-haspopup="dialog"`. Modifier keys do nothing special. The switch and slider stay above the button, as today.

## Risks / Trade-offs

- [Sticky header covers the live connection notice, or the notice pushes the header] → Check the `LiveStatus` notice position at 1024 px in an e2e test. Put the notice above the header in the same sticky stack if needed.
- [Sticky header takes vertical space on short desktop windows] → Keep it to two rows (title and status, then the slider). Presets stay in the dialog.
- [Live updates reset dialog sliders while open] → `Controls` already uses `SmoothValue` and reads the start tab once. The dialog is keyed by target id, so it does not remount on live changes.
- [Removing multi-select is a breaking change for anyone who used it] → The specs name zones as the migration path. This is a single-user, self-hosted app.

## Migration Plan

UI-only change, no stored data. Ship in one release. Roll back by reverting the merge.
