<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';

	let { control }: { control: ControlTarget } = $props();

	// Without a reported color, for example for a group, the picker starts neutral.
	const hue = new SmoothValue(() => control.hueSaturation?.hue ?? 30);
	const saturation = new SmoothValue(() => control.hueSaturation?.saturation ?? 0);

	function commit(smooth: SmoothValue, value: number) {
		smooth.commit(value);
		control.apply({ on: true, color: { hue: hue.current, saturation: saturation.current } });
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between text-sm">
		<span class="font-medium">Color</span>
		<span
			class="size-6 rounded-full border"
			style:background-color={`hsl(${hue.current} ${saturation.current}% 50%)`}
			aria-hidden="true"
		></span>
	</div>
	<Slider
		type="single"
		value={hue.current}
		min={0}
		max={360}
		onValueChange={(value) => hue.input(value)}
		onValueCommit={(value) => commit(hue, value)}
		thumbLabel="{control.name} hue"
	/>
	<Slider
		type="single"
		value={saturation.current}
		min={0}
		max={100}
		onValueChange={(value) => saturation.input(value)}
		onValueCommit={(value) => commit(saturation, value)}
		thumbLabel="{control.name} saturation"
	/>
</div>
