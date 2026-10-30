<script lang="ts">
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import ColorPad from './ColorPad.svelte';

	let { control }: { control: ControlTarget } = $props();

	// Without a reported color, for example for a group, the pad starts at white.
	const hue = new SmoothValue(() => control.hueSaturation?.hue ?? 30);
	const saturation = new SmoothValue(() => control.hueSaturation?.saturation ?? 0);
</script>

<ColorPad
	hue={hue.current}
	saturation={saturation.current}
	label="{control.name} color"
	onValueChange={(color) => {
		hue.input(color.hue);
		saturation.input(color.saturation);
	}}
	onValueCommit={(color) => {
		hue.commit(color.hue);
		saturation.commit(color.saturation);
		control.apply({ on: true, color });
	}}
/>
