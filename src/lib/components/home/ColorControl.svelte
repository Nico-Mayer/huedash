<script lang="ts">
	import { applyChange } from '#lib/commands.ts';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import type { HomeGroup } from '#lib/server/hue/home.ts';

	let { group }: { group: HomeGroup } = $props();

	// The bridge does not report a group's color, so the picker starts neutral.
	let hue = $state(30);
	let saturation = $state(0);

	function commit() {
		const previous = { hue, saturation };
		applyChange(
			{ kind: 'groups', id: group.groupedLightId, name: group.name },
			{ on: true, color: { hue, saturation } },
			() => ({ hue, saturation } = previous)
		);
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
		thumbLabel="{group.name} hue"
	/>
	<Slider
		type="single"
		bind:value={saturation}
		min={0}
		max={100}
		onValueCommit={commit}
		thumbLabel="{group.name} saturation"
	/>
</div>
