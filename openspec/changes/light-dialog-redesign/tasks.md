# Tasks

## 1. Setup

- [x] 1.1 Create the branch `light-dialog-redesign` on top of `main` with `git-spice branch create light-dialog-redesign`; verify `git-spice log short` shows it

## 2. Home model and theme

- [x] 2.1 Add `whiteStops` (five hex colors over the mirek range, from `mirekToHex`) to lights and groups in `src/lib/server/hue/home.ts`, `null` without white support, and expose it on `ControlTarget` (design: White gradient from the server); verify `home.test.ts` checks Ceiling's stops run from warm (more red than blue) to cool (more blue than red), and the plug has `null`
- [ ] 2.2 Add the `--light` token to `:root` and `.dark` in `src/routes/layout.css` and map it in `@theme inline` (design: Generic light color); verify `pnpm check` passes and `bg-light` renders amber in both themes

## 3. LevelSlider

- [ ] 3.1 Add `orientation` and an `xl` size to `LevelSlider`: fill by height from the bottom, no `ThumbLabel` when vertical (spec: control-sliders "Large brightness and white sliders", "Value label while in use"); verify `level-slider.svelte.test.ts` checks a vertical slider at 70 % fills 70 % of its height, is at least 240 px high, and shows no label on focus
- [ ] 3.2 Add the `tone` prop: light color fill and faded track, muted when the color is `null`, white gradient track from stops (spec: "Brightness slider shows the light color", "White slider shows the white range"); verify component tests for a red fill, a muted fill, and a gradient background
- [ ] 3.3 Restyle the thumb as a bar with a light line and a dark ring (spec: "Visible thumb"); verify with component screenshots of red, yellow, 6500 K, and off in light and dark mode
- [ ] 3.4 Pass the tone in `LightCard` (`lightSwatch` when on) and `RoomHeader` (`var(--light)` when on); verify `LightCard.svelte.test.ts` and `RoomHeader.svelte.test.ts` check the fill color for on and off

## 4. Color pad

- [ ] 4.1 Build `ColorPad.svelte`: hue x saturation gradients, marker, pointer drag with capture, `onValueChange` and `onValueCommit`, `touch-action: none` (spec: "Color pad"; design: Color pad); verify with the Svelte autofixer and a component test that a click at the top left commits hue 0 and saturation 100
- [ ] 4.2 Add keyboard and screen reader support: arrow keys, Shift for steps of 10, `role="slider"`, `aria-valuetext` (spec: "Color pad keyboard use"); verify a component test for each arrow key and the announced text
- [ ] 4.3 Replace the two sliders in `ColorControl` with `ColorPad` using `SmoothValue` for hue and saturation, starting at saturation 0 for groups (spec: "Smooth movement on outside changes", "No animation for the user's own input"); verify a component test that an outside color change moves the marker and a release sends one `color` change

## 5. Dialog

- [ ] 5.1 Rework `Controls` into the mode view: value at the top (K in white, else %, or "Off"), one vertical control, mode bar with a power toggle and a bits-ui or shadcn-svelte `toggle-group` for brightness, color, and white; start on brightness, else white, else color; only the power button for a plug (spec: navigation "Control dialog", "Dialog mode bar"; light-control "Start at the current light state", "Open a light's controls"); verify `controls.svelte.test.ts` covers each scenario of these requirements
- [ ] 5.2 Remove the label rows from `ColorTemperatureControl` and pass the white tone; delete `BrightnessPresets.svelte`, `WhitePresets.svelte`, and `presets.svelte.test.ts`; verify `rg -i "preset" src/lib` finds no remaining use and `pnpm check` passes
- [ ] 5.3 Fit the layout in `ControlDialog` for the dialog and the bottom sheet, with the slider height `min(240px, 40svh)`; verify `ControlDialog.svelte.test.ts` passes and a browser check at 1440 and 390 px shows the full layout without scrolling

## 6. End to end

- [ ] 6.1 Update `dialog.e2e.ts`: opens on brightness, mode bar per light type, power button, color pad sends a color to the light only, live red change turns the fill red, Escape returns focus; remove the preset test; verify `pnpm test:e2e` passes
- [ ] 6.2 Update `details.e2e.ts`, `rooms.e2e.ts`, and `live.e2e.ts` for removed tabs and presets and the room dialog's white slider; verify `pnpm test:e2e` passes

## 7. Verification

- [ ] 7.1 Take screenshots of both dialogs in each mode, the Kitchen header, and light cards at 1440 and 390 px in light and dark; fix contrast and layout with shadcn tokens; verify by the screenshots
- [ ] 7.2 Verify `pnpm test`, `pnpm check`, `pnpm lint`, and `pnpm build` exit 0 on the final state; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit with `git-spice branch submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
