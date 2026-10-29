# Design

## Context

- `src/routes/layout.css` already defines dark tokens under `.dark` and `@custom-variant dark (&:is(.dark *))`. Nothing sets the `.dark` class today, so the app is always light.
- `mode-watcher` 1.1.0 is already installed. The shadcn-svelte sonner component reads `mode.current` from it, but `<ModeWatcher />` is not mounted, so toasts are always light too.
- The settings page (`src/routes/settings/+page.svelte`) has one card for the bridge. It is only reachable once a bridge is paired; the header hides the settings link during setup.
- Project rule: per-device UI preferences live in localStorage.

Library evidence (2026-10-29):

| Package | Version | Last publish / activity | Use |
|---|---|---|---|
| `mode-watcher` | 1.1.0 | 2025-06-28, repo pushed 2025-08-05, 608 stars, svecosystem org | `.dark` class, system preference, localStorage, no-flash head script |

Alternatives: `svelte-themes` 2.0.10 (2025-09, smaller, not what shadcn-svelte documents); a handwritten store with `matchMedia` and an inline head script (rejected by the library-first rule). `mode-watcher` is the library the shadcn-svelte dark mode guide names, and the sonner component already depends on it.

## Goals / Non-Goals

**Goals:**
- Follow the shadcn-svelte dark mode guide as written, so later shadcn-svelte components work without changes.

**Non-Goals:**
- A theme toggle in the header. The choice lives on the settings page only.
- Custom color themes (`setTheme`) or a `theme-color` meta tag.
- Storing the theme on the server or syncing it across devices.
- A theme picker in the setup wizard. Setup pages still follow the stored or system theme.

## Decisions

### Mount `<ModeWatcher />` in the root layout
Add `<ModeWatcher />` to `src/routes/+layout.svelte` with no props. Its defaults match the specs: `defaultMode: 'system'`, `.dark` class on `<html>`, localStorage key `mode-watcher-mode`, and a head script that sets the class before first paint. It also disables CSS transitions during a mode switch, so the colors do not animate.

Alternative: pass `defaultMode="system"` explicitly. Not needed; it is the default.

### Theme picker uses shadcn-svelte `radio-group`
New component `src/lib/components/settings/ThemePicker.svelte` (the settings page imports it inside a new "Appearance" card):

```
RadioGroup.Root value={userPrefersMode.current} onValueChange={setMode}
  Light  (SunIcon)
  Dark   (MoonIcon)
  System (MonitorIcon)
```

- `userPrefersMode.current` is the stored choice (`'light' | 'dark' | 'system'`), not the resolved mode, so System stays selected when the system is dark.
- `setMode('system')` stores `system` and goes back to following `prefers-color-scheme`. `resetMode()` would do the same; one call path is simpler.
- Each option is a labeled radio built with the existing `field` components (`Field.Label` wrapping the item, the shadcn-svelte "choice card" pattern), laid out in a row of three.

Alternatives:
- `toggle-group` (`type="single"`): looks like a segmented control, but a single toggle group can be cleared to no value, which needs a guard, and its items are toggle buttons rather than radios.
- A `select`: hides the three choices behind a click for no gain.

Add the component with `pnpm dlx shadcn-svelte@latest add radio-group`.

### Copy
Card title "Appearance", description "Theme for this device". Option labels "Light", "Dark", "System". "This device" tells the user the choice is not shared.

### Tests
- Component test (`ThemePicker`): System selected by default; picking Dark sets the `dark` class on `<html>` and stores `dark`; picking System again follows the emulated preference. Clear localStorage and the class between tests.
- E2E (`app` project): with `colorScheme: 'dark'` the home page has `html.dark`; pick Light in settings, reload, `html` has no `dark` class and Light is checked. Use `page.emulateMedia` to flip the system preference for the live-switch scenario.

## Risks / Trade-offs

- [`mode-watcher` has had no release since 2025-06] → The API is small and stable, shadcn-svelte still documents it, and it is already a dependency. Replacing it later only touches the layout and `ThemePicker`.
- [Some custom styles may look wrong in dark mode] → Check home, room, settings, setup, toasts, and the scene color strips in both modes during apply. Fix with semantic tokens, not hard-coded colors.
- [localStorage is per origin] → Opening huedash by IP and by hostname gives two separate stored themes. Acceptable for a per-device setting.
