<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';

	let { control }: { control: ControlTarget } = $props();

	const levels = [10, 25, 50, 100];
</script>

<div class="grid grid-cols-4 gap-2" role="group" aria-label="Brightness presets">
	{#each levels as level (level)}
		<Button
			variant="outline"
			size="sm"
			class="tabular-nums"
			onclick={() => control.apply({ on: true, brightness: level })}
		>
			{level} %
		</Button>
	{/each}
</div>
