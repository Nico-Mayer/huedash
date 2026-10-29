# UI standards

Interface rules for huedash. Based on the `interface-design` skill and shadcn-svelte defaults. Copy rules are in [ui-copy.md](ui-copy.md).

## Who and what

- **Who:** someone at home, often on a phone or a wall-mounted tablet, sometimes in a dark room.
- **Task:** change the light in a room fast. Turn on, dim, pick a scene. Most visits take seconds.
- **Feel:** calm and quiet, like a good wall switch. The interface stays dark and neutral so the light colors carry the meaning.

## Visual direction (proposed, confirm in project-setup)

- **Signature:** the only strong color on screen is the real current color of a light or room. A room's card shows its actual color and brightness. An off room is neutral.
- **Rejected defaults:** blue brand accent (replace with neutral UI plus real light colors), identical metric-card grid (replace with room rows where brightness is the main visual), sidebar-first admin layout (replace with rooms as the home screen).
- **Theme:** dark by default, light mode supported. Dark rooms at night are the common case.

## Layout

- Home screen = list of rooms and zones. This is the focal point. Settings and bridge info live behind a menu.
- Mobile first. One column on phones, two to three columns on tablet and desktop. Max content width around 1200px.
- Room detail = room controls on top (power, brightness, scenes), individual lights below.
- Spacing base unit 4px. Use Tailwind spacing steps only. Group related controls tightly (8-12px), separate groups clearly (24-32px).
- Use `flex` / `grid` with `gap-*`. No `space-x-*` / `space-y-*` (shadcn-svelte rule).

## Tokens

- Use shadcn-svelte semantic tokens only: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, and so on.
- No raw Tailwind colors (`bg-blue-500`, `text-gray-400`) and no hex values in components. No manual `dark:` color overrides.
- Light colors from the bridge are data, not theme. Apply them through a CSS variable on the element (for example `--light-color`), never as a new theme token.
- Pick the theme via a shadcn-svelte preset in project-setup. Changes to tokens go in the theme CSS, not in components.
- Depth: one strategy. Subtle borders plus surface color shifts. No heavy shadows.
- Numbers that change (brightness %, counts) use `tabular-nums`.

## Component states

Every interactive element has: default, hover, active (pressed), focus-visible, disabled.

Every data view has: loading, empty, error, and content. See [ui-copy.md](ui-copy.md) for the text.

| State | Rule |
|---|---|
| Loading | `Skeleton` in the shape of the content |
| Empty | `Empty` component with one action |
| Error | `Alert` (page level) or inline field message; always a next step |
| Pending action | `Spinner` inside the `Button`, button disabled |
| Bridge offline | One banner at the top, controls disabled, auto retry |
| Optimistic update | Show the new light state at once; revert and show an error if the bridge rejects it |

## Touch targets

- Minimum hit area 44x44px for every control. Visible element can be smaller if the hit area is extended.
- Sliders (brightness, color temperature) get a large thumb and full-width track on touch devices.
- No hover-only controls. Everything must work by tap and by keyboard.
- Keep at least 8px between separate hit areas.
- Respect `prefers-reduced-motion`. Motion under 300ms, `transform` and `opacity` only.

## shadcn-svelte vs. custom components

Order of choice:

1. **shadcn-svelte component** if one exists (`Button`, `Card`, `Slider`, `Switch`, `Tabs`, `Dialog`, `Sheet`, `Empty`, `Skeleton`, `Alert`, `Sonner`). Use its variants before custom classes. Add with the shadcn-svelte CLI, see the `shadcn-svelte` skill.
2. **Compose** several shadcn-svelte components into a feature component (for example `RoomCard` = `Card` + `Switch` + `Slider`).
3. **Custom component on a bits-ui primitive** when no shadcn-svelte component fits (for example a color picker on bits-ui `Slider` or `Popover`). Style it with the same tokens.
4. **Hand-rolled** only when no primitive fits. It must then cover keyboard, focus, and ARIA fully. Record the reason in the change's `design.md`.

Never use `<div onclick>` for something a `<button>` or a primitive already does.
