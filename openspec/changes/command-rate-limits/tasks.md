# Tasks

## 1. Timing tests

- [ ] 1.1 Add `createCommandSender` tests with fake timers: three quick changes to one light send the first at once and the last after 100 ms; changes to two lights both go out at once; select then play Tropical within 1 s sends the dynamic recall only after 1 s. Verify `pnpm test:unit --run src/lib/server/hue/commands.test.ts` passes

## 2. Verification

- [ ] 2.1 Verify `openspec validate command-rate-limits --strict`, `pnpm lint`, and `pnpm check` pass; commit with no co-author lines

## Workflow follow-up

- Archive with `/opsx:archive`.
