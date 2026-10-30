# Tasks

## 1. Server

- [x] 1.1 Add `static` to `sceneCommandSchema` in `src/lib/server/hue/commands.ts` and map it to the bridge action `static` with optimistic status `static` (design: Command modes); verify `commands.test.ts` checks that `static` on Tropical sends `{ recall: { action: 'static' } }` and marks it `static`, and `api/scenes/server.test.ts` answers 200 for `{ mode: 'static' }`
- [x] 1.2 Update the throttle test in `commands.test.ts` to send `dynamic` then `static` for Tropical (spec: "Recall twice quickly"); verify the bridge gets the dynamic recall at once and the static recall after one second
- [x] 1.3 Remove `brightness` from `HomeScene` and `averageBrightness` from `src/lib/server/hue/home.ts`, and drop it from test fixtures (`scenes.svelte.test.ts`, `RoomHeader.svelte.test.ts`, others that build a `HomeScene`); verify `rg -n "averageBrightness" src` finds nothing, `home.test.ts` passes, and `pnpm check` passes

## 2. Scene cards

- [x] 2.1 In `SceneList.svelte`, switch the grid to `grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]`, use a `h-6` strip and `p-2` padding, add `cursor-pointer` to the card, and remove the brightness label and the play button (design: Grid with a fixed minimum card width; spec: "List scenes of a room or zone"); verify with the Svelte autofixer, and a component test that no card contains `%`, no "Play" button exists, and the card has `cursor: pointer`
- [x] 2.2 Select a palette scene with mode `dynamic` and a scene without a palette with `active`, with the matching optimistic status (spec: "Activate a scene"); verify component tests that a click on Tropical sends `{ mode: 'dynamic' }` and shows "Playing", and a click on Relax sends `{ mode: 'active' }` and shows "Active"
- [x] 2.3 Render the active scene's badge as a sibling `<button>` with `badgeVariants` and `cursor-pointer` over the strip for palette scenes, sending `static` when playing and `dynamic` when static, with the accessible name and `title` from the design; keep a plain `Badge` for scenes without a palette (spec: "Switch dynamic mode of the active scene"); verify component tests for "Stop playing", "Start playing again", and that Relax's badge is not a button
- [x] 2.4 Check the layout in a browser with `playwright-cli` at 1440 and 390 px in light and dark mode; verify cards are narrow, the badge does not cover the name, and hover shows the pointer on card and badge

## 3. Icon badge

- [x] 3.1 Replace the text badge with an icon badge (`Sparkles` dynamic, `Lightbulb` static) at the bottom right in the name row, with screen reader text, and pad the name while it shows (spec: "Switch dynamic mode of the active scene", "Badge does not cover the strip"); verify component tests still find "Playing" and "Active", a test that the badge sits below the strip, and the Svelte autofixer
- [x] 3.2 Check the layout in a browser at 1440 and 390 px in light and dark mode; verify the badge does not overlap the strip or the name

## 4. End-to-end

- [x] 4.1 Update `src/routes/scenes.e2e.ts`: replace the play test with "selecting Tropical plays it" and add a test that its "Playing" badge switches it to "Active" and the mock bridge logs a `static` recall; check `navigation.e2e.ts` for play or brightness use; verify `pnpm test:e2e` passes
- [x] 4.2 Run `pnpm lint`, `pnpm check`, and `pnpm test:unit --run`; verify all pass

## Workflow follow-up

- Archive the change with `/opsx:archive` after review.
