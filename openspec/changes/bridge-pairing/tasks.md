# Tasks

## 1. Hue client foundation

- [x] 1.1 Add `openapi-fetch`, `undici@^7`, `zod` (runtime) and `openapi-typescript`, `openapi-msw` (dev); verify `pnpm build` and `pnpm check` pass
- [x] 1.2 Vendor `openhue.yaml` from openhue-api release 1.2 into `src/lib/server/hue/`, add `pnpm gen:hue` (openapi-typescript), generate and commit `schema.d.ts`; verify `pnpm gen:hue` produces no diff on a second run and `paths` includes `/clip/v2/resource/bridge` and `/api`
- [x] 1.3 Implement `address.ts` (parse `host[:port]`, default 443, reject invalid input) with unit tests for IPv4, hostname, port, and invalid cases
- [x] 1.4 Generate test certificates in memory with `selfsigned` (`src/mocks/bridge/certificate.ts`, no committed keys); implement `tls.ts` (capture and pinned modes, normalized SHA-256) with unit tests against a local HTTPS server: capture records the fingerprint, matching pin succeeds, mismatched pin fails with `CertificateMismatchError` before the request body is sent
- [ ] 1.5 Implement `client.ts` (openapi-fetch with pinned dispatcher, `hue-application-key` header, 5 s timeout) and `bridge.ts` (`getPublicConfig`, `requestAppKey`, `checkBridge`) with unit tests against the MSW mock, including timeout and error 101

## 2. Configuration

- [ ] 2.1 Implement `config/store.ts` (zod schema, read with cache, atomic write with mode 0600, delete) with unit tests: round trip, invalid JSON treated as unconfigured with a log, unwritable directory error names the path
- [ ] 2.2 Implement `config/index.ts` (`HUE_BRIDGE_IP` + `HUE_APP_KEY` > `config.json` > null; warning when only one env var is set; `HUE_BRIDGE_CERT_SHA256` handling) with unit tests for each precedence case
- [ ] 2.3 Add `src/hooks.server.ts` setup redirect with unit tests: unconfigured `/` redirects, `/healthz` and `/setup` pass, configured `/setup` redirects to `/`

## 3. Mock bridge

- [ ] 3.1 Switch bridge handlers to origin wildcards and typed `openapi-msw` handlers for CLIP v2; add `/api/0/config`, stateful `POST /api` with `pressLinkButton()` and reset, and the discovery handler; verify existing mock tests still pass
- [ ] 3.2 Add the e2e mock servers to the preload without MSW interception: HTTPS mock bridge on `127.0.0.1:8443` (in-memory certificate) and HTTP discovery mock on `127.0.0.1:8080`, both answering via `getResponse(handlers, request)`; update `playwright.config.ts` (`HUE_DATA_DIR` temp dir, `HUE_DISCOVERY_URL=http://127.0.0.1:8080/`, no `HUE_BRIDGE_IP`); verify the existing e2e tests pass

## 4. Setup flow

- [ ] 4.1 Implement `discovery.ts` (`HUE_DISCOVERY_URL` override, 10 s timeout, 429 and errors mapped to a failure result) with unit tests for found, empty, error, and timeout
- [ ] 4.2 Implement `/setup` actions `discover`, `check`, `pair` (pending pairing in memory with httpOnly token cookie, 5 min expiry, `devicetype` truncation) with unit tests for each action's success and error results
- [ ] 4.3 Build the `/setup` page with shadcn-svelte components (address field, "Find bridge" list, bridge name and ID, link button countdown with 2 s polling, errors from the specs) and copy written with the `ux-writing` skill; verify with the Svelte autofixer and a component test for the countdown and error states

## 5. Home page

- [ ] 5.1 Implement `+page.server.ts` load (name, source, streamed status) and `forget` action (deletes config, redirects to `/setup`, unavailable in env mode) with unit tests; verify no load data contains the app or client key
- [ ] 5.2 Replace the placeholder `+page.svelte` with the connected view (name, live status, retry, certificate-changed message, Forget bridge with `AlertDialog`, env mode note); verify with the Svelte autofixer and a component test for each status

## 6. End to end and docs

- [ ] 6.1 Add e2e tests: unconfigured `/` redirects to `/setup`; "Find bridge" lists the mock bridge; pairing over real TLS reaches "Connected to"; forget returns to `/setup`; `/healthz` works without config. Verify `pnpm test:e2e` passes
- [ ] 6.2 Update `compose.yaml` comments (`HUE_BRIDGE_IP`, `HUE_APP_KEY`, `HUE_BRIDGE_CERT_SHA256`), `README.md` (pairing, env vars, certificate-changed recovery, `/data` permissions), and `AGENTS.md` (Hue client layout, `pnpm gen:hue`, mock bridge on `127.0.0.1:8443`); verify `pnpm lint` passes
- [ ] 6.3 Verify `pnpm test`, `pnpm check`, `pnpm lint`, and `pnpm build` all exit 0, then commit in atomic conventional commits with no co-author lines

## Workflow follow-up

- Push the commits (needs the user, auto mode blocks `git push`) and check the CI and image runs on `main`.
- Try pairing with a real bridge on the LAN before archiving.
- Archive the change with `/opsx:archive` after review.
