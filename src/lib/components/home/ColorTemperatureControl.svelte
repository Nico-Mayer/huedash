<script lang="ts">
	import { kelvinToMirek, mirekToKelvin } from '#lib/color-temperature.ts';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import type { MirekRange } from '#lib/server/hue/home.ts';

	let { control, range }: { control: ControlTarget; range: MirekRange } = $props();

	const warmest = $derived(mirekToKelvin(range.maxMirek));
	const coolest = $derived(mirekToKelvin(range.minMirek));
	let kelvin = $derived(
		control.mirek !== null ? mirekToKelvin(control.mirek) : Math.round((warmest + coolest) / 2)
	);
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between text-sm">
		<span class="font-medium">White</span>
		<span class="text-muted-foreground tabular-nums">{kelvin} K</span>
	</div>
	<Slider
		type="single"
		bind:value={kelvin}
		min={warmest}
		max={coolest}
		step={50}
		onValueCommit={(value) => control.apply({ on: true, mirek: kelvinToMirek(value) })}
		thumbLabel="{control.name} color temperature"
	/>
	<div class="flex justify-between text-xs text-muted-foreground">
		<span>Warm</span>
		<span>Cool</span>
	</div>
</div>
