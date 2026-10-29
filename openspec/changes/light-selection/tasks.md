# Tasks

## 1. Setup

- [ ] 1.1 Create the stacked branch `light-selection` on top of `app-shell` with `git-spice branch create light-selection`; verify `git-spice log short` shows it above `app-shell`
- [ ] 1.2 Add `pnpm dlx shadcn-svelte@latest add checkbox` (restore any overwritten existing files with `git restore`), then `pnpm format`; verify `src/lib/components/ui/checkbox/` exists and `pnpm check` passes

## 2. Light state on the server

- [ ] 2.1 Change `HomeLight` to `mirekRange`, `mirek` (null while `mirek_valid` is false), and `hueSaturation` (xy to hue/saturation with `culori`); update group range code; verify `home.test.ts` covers white mode, color mode, and lights without color, and `pnpm check` passes
- [ ] 2.2 Let `lightCommandSchema` accept `mirek` and `color`; verify `commands.test.ts` and the `PUT /api/lights/[id]` tests cover both
- [ ] 2.3 Map light `color_temperature` and `color` events in `toUpdates` and add the fields to `StateUpdate`; make the mock bridge publish them; verify `updates.test.ts` covers mirek, xy, and `mirek_valid: false`

## 3. Selection

- [ ] 3.1 Add `src/lib/selection.svelte.ts` (`only`, `toggle`, `clear`, `start`, `done`, `forGroup`); verify unit tests
- [ ] 3.2 Add the selection button, checkbox in select mode, and selected ring to `LightCard`, and "Select" / "Done" to the Lights header in `GroupDetail`; clear on group change; verify with the Svelte autofixer and component tests for click, Shift-click, Cmd/Ctrl-click, select mode, unreachable, and switch not selecting

## 4. Inspector for group and lights

- [ ] 4.1 Add `ControlTarget`, `groupTarget`, and `lightsTarget` (first light by name, range intersection, color only when all support it, one command per light); verify unit tests
- [ ] 4.2 Make `ColorTemperatureControl` and `ColorControl` take a target and start at its current values; build `Controls` (header, switch and brightness, tabs starting on Color for a light in color mode, "Back to room") replacing `GroupInspector` and `GroupControls`; verify with the Svelte autofixer and updated component tests
- [ ] 4.3 Add `BrightnessPresets` and `WhitePresets` with mirek clamping; verify component tests for group (one group command) and lights (one command per light, clamped Warm on "Counter")

## 5. Placement

- [ ] 5.1 Wide screens: the right column shows the selection or the group; narrow screens: group controls on top and a bottom `Sheet` for the selection, a "Control N lights" bar in select mode, and closing the sheet clears the selection; verify with the Svelte autofixer

## 6. End to end, docs, verification

- [ ] 6.1 Add `selection.e2e.ts`: click and Shift-click on desktop, inspector says "2 lights", a brightness preset reaches both lights and not the group, select mode with checkboxes, room change clears the selection, 1024 px sheet keeps the scroll position, 390 px "Control 2 lights" bar, and a light color change from another tab shows in the inspector; verify `pnpm test:e2e` passes
- [ ] 6.2 Take screenshots of a selection at 1440, 1024, and 390 px in light and dark; fix layout issues with shadcn tokens only; verify by the screenshots
- [ ] 6.3 Update `README.md` features (select lights, presets); verify `pnpm lint` passes
- [ ] 6.4 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0 on every commit (`git rebase --exec`); commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit the stack with `git-spice stack submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
- Next changes in the stack: `home-actions`, `shortcuts`.
