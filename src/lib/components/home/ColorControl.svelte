<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';

	let { control }: { control: ControlTarget } = $props();

	// Without a reported color, for example for a group, the picker starts neutral.
	let hue = $derived(control.hueSaturation?.hue ?? 30);
	let saturation = $derived(control.hueSaturation?.saturation ?? 0);

	function commit() {
		control.apply({ on: true, color: { hue, saturation } });
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between text-sm">
		<span class="font-medium">Color</span>
		<span
			class="size-6 rounded-full border"
			style:background-color={`hsl(${hue} ${saturation}% 50%)`}
			aria-hidden="true"
		></span>
	</div>
	<Slider
		type="single"
		bind:value={hue}
		min={0}
		max={360}
		onValueCommit={commit}
		thumbLabel="{control.name} hue"
	/>
	<Slider
		type="single"
		bind:value={saturation}
		min={0}
		max={100}
		onValueCommit={commit}
		thumbLabel="{control.name} saturation"
	/>
</div>
