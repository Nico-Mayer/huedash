# Proposal

## Why

The light cards show the bulb color only in the small indicator and the slider. A soft glow in the card background makes the room page show at a glance which lights shine and in which color, like the tile cards in Home Assistant.

## What Changes

- A light card that is on and has a white or color shows a faint glow in that color, coming from its indicator.
- On hover, the glow grows and fills the whole card with a light tint.
- The glow follows live color changes and disappears when the light turns off or becomes unreachable.
- Lights without a white or color (plugs, dim-only bulbs) show no glow, the same as their muted indicator.
- With reduced motion, the glow changes without a transition.
- Room and zone headers do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `light-control`: adds requirements for the light card glow and for a default warm white on dim-only lights.

## Impact

- `src/lib/components/home/LightCard.svelte` and its component test.
- No new dependencies, no server or API changes.
