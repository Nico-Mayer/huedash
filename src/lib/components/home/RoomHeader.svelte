<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		activeScene,
		changeGroup,
		groupBrightness,
		lightsSummary,
		onSwatches
	} from '#lib/group-state.svelte.ts';
	import type { HomeGroup } from '#lib/server/hue/home.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import GroupSwitch from './GroupSwitch.svelte';
	import LevelSlider from './LevelSlider.svelte';

	let { group, onOpenColor }: { group: HomeGroup; onOpenColor: () => void } = $props();

	const brightness = new SmoothValue(() => groupBrightness(group));
	const scene = $derived(activeScene(group));
	const status = $derived(scene ? `${scene.name} · ${lightsSummary(group)}` : lightsSummary(group));
	const swatches = $derived(onSwatches(group).filter((swatch) => swatch !== null));
</script>

<section
	class="flex flex-col gap-4 border-b bg-background px-6 py-4 md:sticky md:top-0 md:z-10"
	aria-label="{group.name} controls"
>
	<div class="flex items-start justify-between gap-4">
		<div class="flex min-w-0 flex-col gap-1">
			<h1 class="truncate text-2xl font-semibold">{group.name}</h1>
			<p class="text-sm text-muted-foreground tabular-nums">{status}</p>
		</div>
		<div class="flex shrink-0 items-center gap-3">
			{#if group.colorTemperature || group.color}
				<Button
					variant="outline"
					size="sm"
					onclick={onOpenColor}
					aria-haspopup="dialog"
					aria-label="Color and white for {group.name}"
				>
					{#if swatches.length > 0}
						<span class="flex -space-x-1" aria-hidden="true">
							{#each swatches as swatch, i (i)}
								<span
									class="size-3 rounded-full bg-(--swatch) ring-2 ring-background"
									style:--swatch={swatch}
								></span>
							{/each}
						</span>
					{/if}
					Color and white
				</Button>
			{/if}
			<GroupSwitch {group} />
		</div>
	</div>
	<div class="flex items-center gap-4">
		<LevelSlider
			value={brightness.current}
			min={1}
			max={100}
			format={(value) => `${value} %`}
			onValueChange={(value) => brightness.input(value)}
			onValueCommit={(value) => {
				brightness.commit(value);
				changeGroup(group, { on: true, brightness: value });
			}}
			thumbLabel="{group.name} brightness"
		/>
		<span class="w-12 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
			{brightness.current} %
		</span>
	</div>
</section>
