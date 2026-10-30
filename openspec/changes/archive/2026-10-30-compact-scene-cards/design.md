# Design

## Context

See proposal.md - Why. Today `SceneList` renders each scene as a `<button>` card in a `grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` grid, close to the light grid (`sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`). The card holds a `h-10` color strip, the name, a status `Badge` ("Active" or "Playing"), and the brightness. A separate play `Button` sits over the strip for scenes with `dynamic: true` (a palette).

Constraints:

- `sendCommand` posts `{ mode }` to `/api/scenes/[id]`. `sceneCommandSchema` accepts `active` and `dynamic`. `active` maps to the bridge action `active`, which respects the scene's `auto_dynamic` flag, so it can start a scene dynamically.
- `live.scenes.begin` sets the optimistic status; the live update confirms it.
- Tailwind v4 gives buttons the default cursor. `LightCard` already uses `enabled:cursor-pointer`.
- `HomeScene.brightness` is only read by the brightness label.

## Goals / Non-Goals

**Goals:**

- Narrow scene cards that fit about twice as many per row as light cards.
- One click starts a palette scene dynamically; one more click on its badge switches it to static and back.

**Non-Goals:**

- A static or dynamic preference per scene or per device.
- Changing the throttle or live update flow.
- Changing the sidebar or room header.

## Decisions

### Grid with a fixed minimum card width

Use `grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]` instead of breakpoint columns. Card width then follows the space next to the sidebar, not the viewport, and stays narrow on every screen: 2 cards on a phone, about 6 to 8 on a desktop. The strip shrinks to `h-6` and the card padding to `p-2`.

Alternative: breakpoint columns like `grid-cols-3 sm:grid-cols-4 lg:grid-cols-6`. Rejected: the sidebar takes part of the width, so breakpoints give uneven card widths.

### Icon badge toggle as a sibling button in the name row

A `<button>` inside the card `<button>` is invalid HTML. So the badge is a sibling of the card button inside the `<li>`, positioned absolutely at the bottom right of the card, in the name row, so it does not cover the strip. The name gets right padding while a badge shows, and the name row grows to the badge height (`size-6`). The badge shows only a lucide icon: `Sparkles` for dynamic, `Lightbulb` for static. The state word ("Playing" or "Active") stays in the accessible name and as screen reader text. For a palette scene it is a `<button>` styled with `badgeVariants`; for a scene without a palette it stays a plain `Badge` (`<span>`). Only the active scene shows a badge.

Accessible name starts with the visible text, for example "Playing: switch Tropical to static", and a `title` gives mouse users the same hint. No `aria-pressed`, because the visible text already changes with the state.

Alternative: a text badge over the strip. Rejected: it covers the strip colors, and text does not fit next to the name on narrow cards.

### Command modes

| Action                      | Mode sent | Bridge action     | Optimistic status |
| --------------------------- | --------- | ----------------- | ----------------- |
| Select a palette scene      | `dynamic` | `dynamic_palette` | `dynamic_palette` |
| Select a scene, no palette  | `active`  | `active`          | `static`          |
| Badge on a playing scene    | `static`  | `static`          | `static`          |
| Badge on a static scene     | `dynamic` | `dynamic_palette` | `dynamic_palette` |

Add `static` to `sceneCommandSchema` and map it to the `static` action. Alternative: send `active` to stop playing. Rejected: `active` respects `auto_dynamic`, so the scene could keep playing.

### Remove scene brightness from the home model

Drop `brightness` from `HomeScene` and `averageBrightness` from `home.ts`. Nothing else reads it, and keeping unused data in the event stream costs bytes on every update.

### No new library

The change uses the existing `Badge` variants and Tailwind classes. Nothing to handroll.

## Risks / Trade-offs

- [The toggle is only on the active scene's badge, so it is easy to miss] → The `title` hint and the pointer cursor show it is clickable.
- [Users who prefer static scenes need a second click] → Accepted; matches the user's request. A per-device preference can follow later.
- [Icons are less clear than words] → The `title` and accessible name give the state and the action.
