<script lang="ts">
	import { applyChange } from '#lib/commands.ts';
	import { kelvinToMirek, mirekToKelvin } from '#lib/color-temperature.ts';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import type { HomeGroup, MirekRange } from '#lib/server/hue/home.ts';

	let { group, range }: { group: HomeGroup; range: MirekRange } = $props();

	const warmest = $derived(mirekToKelvin(range.maxMirek));
	const coolest = $derived(mirekToKelvin(range.minMirek));
	let kelvin = $derived(Math.round((warmest + coolest) / 2));

	function commit(value: number) {
		const previous = kelvin;
		applyChange(
			{ kind: 'groups', id: group.groupedLightId, name: group.name },
			{ on: true, mirek: kelvinToMirek(value) },
			() => (kelvin = previous)
		);
	}
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
		onValueCommit={commit}
		thumbLabel="{group.name} color temperature"
	/>
	<div class="flex justify-between text-xs text-muted-foreground">
		<span>Warm</span>
		<span>Cool</span>
	</div>
</div>
