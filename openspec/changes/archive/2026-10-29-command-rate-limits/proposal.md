# Proposal

## Why

The server already limits how often it sends commands to the bridge: 1 s per room or zone, 100 ms per light, and 1 s per scene. Only the group limit is in a spec (`room-control`). The light and scene limits exist only in code, so a change could drop them without breaking a spec.

## What Changes

- Document the existing per-light limit (100 ms) in `light-control`.
- Document the existing per-scene limit (1 s) in `scenes`.
- Add tests that check the light and scene timings. No behavior changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `light-control`: adds a requirement that limits commands per light.
- `scenes`: adds a requirement that limits recalls per scene.

## Impact

- `src/lib/server/hue/commands.test.ts`: new timing tests.
- No production code changes.
