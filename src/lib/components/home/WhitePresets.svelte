<script lang="ts">
	import { kelvinToMirek } from '#lib/color-temperature.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { clampMirek, type ControlTarget } from '#lib/control-target.svelte.ts';
	import type { MirekRange } from '#lib/server/hue/home.ts';

	let { control, range }: { control: ControlTarget; range: MirekRange } = $props();

	const presets = [
		{ label: 'Warm', kelvin: 2200 },
		{ label: 'Soft', kelvin: 2700 },
		{ label: 'Neutral', kelvin: 4000 },
		{ label: 'Daylight', kelvin: 6500 }
	];
</script>

<div class="grid grid-cols-4 gap-2" role="group" aria-label="White presets">
	{#each presets as preset (preset.label)}
		<Button
			variant="outline"
			size="sm"
			onclick={() =>
				control.apply({ on: true, mirek: clampMirek(kelvinToMirek(preset.kelvin), range) })}
		>
			{preset.label}
		</Button>
	{/each}
</div>
