# Proposal

## Why

The brightness and white sliders are thin (12 px track, 16 px thumb) and hard to hit, and the value shows only in the status text away from the thumb. When a scene, another tab, or the Hue app changes a light, every slider jumps to the new position, which is hard to follow. Home Assistant shows a better pattern: a thick bar, a value next to the thumb, and smooth movement.

## What Changes

- New slider component on the bits-ui `Slider` primitive, in the style of Home Assistant: a thick filled bar with a large variant for the inspector and a smaller one for light cards.
- The new slider is used for brightness (inspector and light cards) and white (color temperature). Hue and saturation keep the current shadcn slider.
- A value label ("40 %", "2700 K") shows above the thumb while the user drags, hovers, or focuses the slider with the keyboard.
- All four sliders (brightness, white, hue, saturation) move smoothly to a new value when it changes from outside, for example a scene, a preset, another tab, or the Hue app. They do not animate while the user drags, on the first render, or after the user's own change, and they move at once when the browser asks for reduced motion.
- The status text next to a slider ("On, 40 %", "2700 K") follows the moving value, so text and thumb match.
- Decided against for now: tick marks on the track.

## Capabilities

### New Capabilities

- `control-sliders`: how the brightness, white, hue, and saturation sliders look and behave: size, value label, and smooth movement on outside changes.

### Modified Capabilities

None. Commands, ranges, and when commands are sent stay as `light-control` and `room-control` describe them.

## Impact

- Browser: a new slider component next to `#lib/components/ui/slider`, a shared helper for smooth movement, and the call sites `Controls`, `LightCard`, `ColorTemperatureControl`, and `ColorControl`.
- Dependencies: none new. Uses `Slider.ThumbLabel` from `bits-ui` (installed) and `Tween` and `prefersReducedMotion` from `svelte/motion`.
- Tests: component tests for the slider and the helper; existing slider tests keep their accessible names.
