# Tasks

## 1. Follow the system theme

- [ ] 1.1 Add `<ModeWatcher />` to `src/routes/+layout.svelte`; verify with the Svelte autofixer, and in `pnpm dev` with the OS in dark mode that `<html>` has the `dark` class on first paint and toasts are dark
- [ ] 1.2 Add e2e test: with `colorScheme: 'dark'` the home page has `html.dark`, with `light` it does not, and `page.emulateMedia({ colorScheme })` switches the class without reload; verify `pnpm test:e2e` passes

## 2. Theme picker in settings

- [ ] 2.1 Add the radio group with `pnpm dlx shadcn-svelte@latest add radio-group`; verify `src/lib/components/ui/radio-group/` exists and `pnpm check` passes
- [ ] 2.2 Build `src/lib/components/settings/ThemePicker.svelte` (radio group bound to `userPrefersMode.current`, `setMode` on change, Light / Dark / System with Sun / Moon / Monitor icons, `field` choice-card layout); verify with the Svelte autofixer
- [ ] 2.3 Add an "Appearance" card ("Theme for this device") with `ThemePicker` to `src/routes/settings/+page.svelte`; verify in `pnpm dev` that picking each option applies right away
- [ ] 2.4 Add component tests for `ThemePicker`: System selected by default, Dark sets `html.dark` and stores `dark`, System again follows the preference; reset localStorage and the class between tests; verify `pnpm test:unit --run` passes
- [ ] 2.5 Add e2e test: under `colorScheme: 'dark'` pick Light in settings, reload, `html` has no `dark` class and Light is checked; verify `pnpm test:e2e` passes

## 3. Dark mode review, docs, verification

- [ ] 3.1 Check home, room, zone, settings, setup, toasts, and scene color strips in dark mode with `playwright-cli`; replace any hard-coded light colors with semantic tokens; verify by screenshots in both modes
- [ ] 3.2 Update `README.md` features and `AGENTS.md` (`ModeWatcher` in the layout, theme stored in localStorage); verify `pnpm lint` passes
- [ ] 3.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`, and `pnpm check:standalone` exit 0; commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Push the commits (needs the user) and check CI runs on `main`.
- Archive the change with `/opsx:archive` after review.
