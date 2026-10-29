<script lang="ts">
	import { afterNavigate, refreshAll } from '$app/navigation';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { groupTarget, lightsTarget } from '#lib/control-target.svelte.ts';
	import { IsMobile } from '#lib/hooks/is-mobile.svelte.js';
	import { activeScene, lightsSummary } from '#lib/group-state.svelte.ts';
	import { selection } from '#lib/selection.svelte.ts';
	import type { GroupPageData } from '#lib/server/group-page.ts';
	import Controls from './Controls.svelte';
	import LightCard from './LightCard.svelte';
	import SceneList from './SceneList.svelte';

	let { data }: { data: GroupPageData } = $props();

	const noun = $derived(data.kind === 'room' ? 'room' : 'zone');

	// Below 1280 px the inspector sits above the lights, so selected lights get a bottom sheet.
	const narrow = new IsMobile(1280);
	const selected = $derived(data.group?.lights.filter((light) => selection.has(light.id)) ?? []);
	const selectionKey = $derived(selected.map((light) => light.id).join());
	const sheetOpen = $derived(narrow.current && selected.length > 0 && !selection.selecting);

	afterNavigate(() => selection.forGroup(data.group?.id ?? ''));
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
		<header class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">{group.name}</h1>
			<p class="text-sm text-muted-foreground tabular-nums">
				{lightsSummary(group)}
			</p>
		</header>

		<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
			<aside class="xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1" aria-label="Controls">
				{#key `${group.id}:${narrow.current ? '' : selectionKey}`}
					{#if selected.length > 0 && !narrow.current}
						<Controls control={lightsTarget(selected)} onBack={() => selection.clear()} />
					{:else}
						<Controls control={groupTarget(group)} scene={activeScene(group)?.name} />
					{/if}
				{/key}
			</aside>

			<div class="flex min-w-0 flex-col gap-8">
				<section class="flex flex-col gap-3" aria-labelledby="scenes-heading">
					<h2 id="scenes-heading" class="text-sm font-medium text-muted-foreground">Scenes</h2>
					<SceneList {group} />
				</section>

				<section class="flex flex-col gap-3" aria-labelledby="lights-heading">
					<div class="flex items-center justify-between gap-2">
						<h2 id="lights-heading" class="text-sm font-medium text-muted-foreground">Lights</h2>
						{#if selection.selecting}
							<Button variant="ghost" size="sm" onclick={() => selection.done()}>Done</Button>
						{:else}
							<Button variant="ghost" size="sm" onclick={() => selection.start()}>Select</Button>
						{/if}
					</div>
					<ul class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Lights">
						{#each group.lights as light (light.id)}
							<LightCard {light} />
						{/each}
					</ul>
				</section>
			</div>
		</div>

		{#if narrow.current && selection.selecting && selected.length > 0}
			<div class="sticky bottom-4 flex justify-center">
				<Button class="shadow-lg" onclick={() => selection.done()}>
					Control {selected.length === 1 ? '1 light' : `${selected.length} lights`}
				</Button>
			</div>
		{/if}

		<Sheet.Root
			open={sheetOpen}
			onOpenChange={(open) => {
				if (!open) selection.clear();
			}}
		>
			<Sheet.Content side="bottom" class="max-h-[85svh] overflow-y-auto">
				<Sheet.Header class="sr-only">
					<Sheet.Title>Controls for selected lights</Sheet.Title>
				</Sheet.Header>
				{#key selectionKey}
					{#if selected.length > 0}
						<Controls
							control={lightsTarget(selected)}
							class="border-0 bg-transparent shadow-none"
						/>
					{/if}
				{/key}
			</Sheet.Content>
		</Sheet.Root>
	{/if}
</div>
