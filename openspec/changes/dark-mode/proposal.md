# Proposal

## Why

huedash always renders in light mode, even though the theme already defines dark colors (`.dark` in `layout.css`). A dashboard used in the evening or on a wall tablet should follow the device theme, and users should be able to pick a fixed theme per device.

## What Changes

- Apply light or dark mode with `mode-watcher`, as the shadcn-svelte dark mode guide describes. `<ModeWatcher />` goes in the root layout.
- The default follows the system theme (`prefers-color-scheme`) and updates live when the system theme changes.
- The settings page gets an Appearance section with three choices: Light, Dark, System. The choice is stored per device in localStorage and applies right away.
- The page renders in the right mode on first paint, without a light flash.

## Capabilities

### New Capabilities

- `appearance`: light and dark mode, the system default, and the per-device theme setting.

### Modified Capabilities

None.

## Impact

- `src/routes/+layout.svelte`: add `<ModeWatcher />`.
- `src/routes/settings/+page.svelte`: new Appearance card with a theme picker.
- New shadcn-svelte `radio-group` component.
- `mode-watcher` is already a dependency (used by the sonner toaster); no new package.
- New component and e2e tests.
