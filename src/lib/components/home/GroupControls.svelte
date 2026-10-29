<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { activeScene, changeGroup, groupBrightness, groupOn } from '#lib/group-state.svelte.ts';
	import type { HomeGroup } from '#lib/server/hue/home.ts';
	import GroupSwitch from './GroupSwitch.svelte';

	let { group }: { group: HomeGroup } = $props();

	const on = $derived(groupOn(group));
	let brightness = $derived(groupBrightness(group));
	const scene = $derived(activeScene(group));
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-4">
		<p class="text-sm text-muted-foreground tabular-nums">
			{#if !on}
				Off
			{:else if scene}
				{scene.name}, {brightness} %
			{:else}
				On, {brightness} %
			{/if}
		</p>
		<GroupSwitch {group} />
	</div>
	<Slider
		type="single"
		bind:value={brightness}
		min={1}
		max={100}
		onValueCommit={(value) => changeGroup(group, { on: true, brightness: value })}
		thumbLabel="{group.name} brightness"
	/>
</div>
