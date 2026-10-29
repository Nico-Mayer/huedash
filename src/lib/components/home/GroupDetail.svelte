<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { lightCounts } from '#lib/group-state.svelte.ts';
	import type { GroupPageData } from '#lib/server/group-page.ts';
	import GroupInspector from './GroupInspector.svelte';
	import LightCard from './LightCard.svelte';
	import SceneList from './SceneList.svelte';

	let { data }: { data: GroupPageData } = $props();

	const noun = $derived(data.kind === 'room' ? 'room' : 'zone');
</script>

<div class="flex flex-col gap-6 p-6">
	{#if data.status !== 'ok'}
		<BridgeStatusView name={data.bridgeName} status={data.status} />
		<Button class="self-start" onclick={() => refreshAll()}>Try again</Button>
	{:else if !data.group}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>{noun === 'room' ? 'Room' : 'Zone'} not found</Empty.Title>
				<Empty.Description>
					This {noun} no longer exists on your bridge. It may have been removed in the Hue app.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		{@const group = data.group}
		{@const counts = lightCounts(group)}
		<header class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">{group.name}</h1>
			<p class="text-sm text-muted-foreground tabular-nums">
				{counts.on} of {counts.total} lights on{#if counts.unreachable > 0}
					· {counts.unreachable} unreachable{/if}
			</p>
		</header>

		<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
			<aside class="xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1" aria-label="Controls">
				<GroupInspector {group} />
			</aside>

			<div class="flex min-w-0 flex-col gap-8">
				<section class="flex flex-col gap-3" aria-labelledby="scenes-heading">
					<h2 id="scenes-heading" class="text-sm font-medium text-muted-foreground">Scenes</h2>
					<SceneList {group} />
				</section>

				<section class="flex flex-col gap-3" aria-labelledby="lights-heading">
					<h2 id="lights-heading" class="text-sm font-medium text-muted-foreground">Lights</h2>
					<ul class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Lights">
						{#each group.lights as light (light.id)}
							<LightCard {light} />
						{/each}
					</ul>
				</section>
			</div>
		</div>
	{/if}
</div>
