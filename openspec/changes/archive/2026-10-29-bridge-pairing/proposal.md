# Proposal

## Why

huedash cannot talk to a Hue bridge yet. Every feature (rooms, scenes, live updates) needs a paired bridge, a stored app key, and a trusted connection. This change adds the first-run setup, so a user can go from `docker compose up` to a connected bridge without the command line.

## What Changes

- Add a setup flow at `/setup`. Every page except `/healthz` and the setup flow redirects there while no bridge is configured.
- Find bridges with Philips' cloud discovery service, or enter a bridge IP by hand.
- Pair with the bridge: the user presses the link button, huedash waits up to 60 seconds and receives an app key.
- Trust the bridge's TLS certificate on first contact and pin its SHA-256 fingerprint. Later connections with a different certificate fail with a clear error.
- Store the pairing (bridge IP, bridge ID, name, app key, client key, certificate fingerprint) in `/data/config.json`.
- Support configuration by env vars (`HUE_BRIDGE_IP`, `HUE_APP_KEY`, optional `HUE_BRIDGE_CERT_SHA256`). When set, they win over `/data` and the setup flow is disabled.
- Replace the placeholder home page with a "Connected to <bridge name>" view that checks the bridge live, plus a "Forget bridge" action.
- Add a typed Hue client generated from the openhue-api OpenAPI spec (v1.2), with the certificate pin applied to every request.
- Extend the mock bridge with discovery, pairing, and config handlers, and use typed handlers.

## Capabilities

### New Capabilities

- `bridge-pairing`: finding a bridge, pairing with the link button, the setup redirect, and forgetting a bridge.
- `bridge-config`: where the bridge configuration comes from (env vars or `/data`), how it is stored, and errors when storage fails.
- `bridge-connection`: how huedash connects to the bridge: certificate pinning and reporting whether the bridge is reachable.

### Modified Capabilities

None. `health-check` is unchanged: `/healthz` stays reachable without a configured bridge.

## Impact

- New dependencies: `openapi-fetch` (runtime), `undici@7` (runtime, matches Node 24's bundled undici), `openapi-typescript` (dev), `openapi-msw` (dev).
- New files: `src/lib/server/hue/` (client, TLS pinning, discovery, pairing, config store), `src/routes/setup/`, vendored `openhue.yaml` and generated types, mock handlers and fixtures.
- Modified files: `src/routes/+page.svelte`, `src/hooks.server.ts` (new), mock bridge, `compose.yaml` (env var comments), `README.md`, `AGENTS.md`.
- Runtime behavior: the container now writes `/data/config.json`. Calls to `discovery.meethue.com` only happen when the user clicks "Find bridge".
- Out of scope: multiple bridges, mDNS discovery, authentication for the dashboard, removing the app key from the bridge (only possible in the Hue app).
