# Tasks

## 1. Setup

- [x] 1.1 Create the branch `room-header-controls` on top of `main` with `git-spice branch create room-header-controls`; verify `git-spice log short` shows it
- [x] 1.2 Add the shadcn-svelte `dialog` component with `pnpm dlx shadcn-svelte@latest add dialog`; verify `src/lib/components/ui/dialog/index.ts` exists and `pnpm check` passes

## 2. Control target

- [x] 2.1 Replace `lightsTarget` and `sharedRange` with `lightTarget(light)` in `src/lib/control-target.svelte.ts` (design: `ControlTarget` stays); verify `control-target.svelte.test.ts` covers a white-only light, a color light, and the light's own range

## 3. Controls and dialog

- [x] 3.1 Remove the card chrome, the "Controlling" label, and `onBack` from `Controls` (design: `Controls` drops its card chrome); verify `controls.svelte.test.ts` passes without the "Back to room" test
- [x] 3.2 Build `ControlDialog`: `Dialog` at 768 px and wider, bottom `Sheet` below, title and description per target (`Room · 3 lights`, `Zone · 2 lights`, product name); verify with the Svelte autofixer and a component test for title, description, Escape closing, and focus return

## 4. Room header

- [x] 4.1 Build `RoomHeader` with name, status line (scene, then lights summary), switch, brightness slider with % value, and the "Color and white" button with swatch and accessible name "Color and white for <name>", hidden without white or color support (spec: room-control); verify a component test for each scenario of "Room header" and "Color and white button"
- [x] 4.2 Make the header sticky at 768 px and wider (design: `RoomHeader` component); verify in the browser at 1024 px that the header stays visible while scrolling and the live connection notice is not covered

## 5. Page and light cards

- [x] 5.1 Rework `GroupDetail`: header on top, scenes and lights at full width, one `ControlDialog` driven by `open` state, closing when the light disappears or becomes unreachable (design: One dialog per page); verify `pnpm check` passes
- [x] 5.2 Make the light card's button open the dialog with `aria-haspopup="dialog"` and no `aria-pressed`; drop modifier-key handling; verify `LightCard.svelte.test.ts` covers opening, switch and slider not opening, and unreachable cards
- [x] 5.3 Delete `src/lib/selection.svelte.ts` and `selection.svelte.test.ts`; verify `rg selection src` finds no remaining use

## 6. End to end

- [x] 6.1 Replace `selection.e2e.ts` with a light dialog e2e test: open "Ceiling", dim it, a preset, Color tab for a color light, live color change, unreachable "Plug"; verify `pnpm test:e2e` passes
- [x] 6.2 Update `rooms.e2e.ts`, `navigation.e2e.ts`, and `scenes.e2e.ts` from the inspector to the header and room dialog, including the sticky header at 1024 px and the bottom sheet at 390 px; verify `pnpm test:e2e` passes

## 7. Verification

- [x] 7.1 Take screenshots of the Kitchen page and both dialogs at 1440 and 390 px in light and dark; fix layout or contrast issues with shadcn tokens; verify by the screenshots
- [x] 7.2 Verify `pnpm test`, `pnpm check`, `pnpm lint`, and `pnpm build` exit 0 on the final state; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Submit with `git-spice branch submit` (needs the user) and check CI.
- Archive with `/opsx:archive` after review.
- After archive, rename the `control-sliders` scenarios "Inspector brightness" and "Opening the inspector" in the main spec.
