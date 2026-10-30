<script lang="ts">
	import { afterNavigate, refreshAll } from '$app/navigation';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { groupTarget, lightTarget } from '#lib/control-target.svelte.ts';
	import { findGroup } from '#lib/group-page.ts';
	import { getHomeResult } from '#lib/home-context.ts';
	import type { HomeGroup } from '#lib/server/hue/home.ts';
	import ControlDialog from './ControlDialog.svelte';
	import LightCard from './LightCard.svelte';
	import RoomHeader from './RoomHeader.svelte';
	import SceneList from './SceneList.svelte';

	let { bridgeName, kind, id }: { bridgeName: string; kind: HomeGroup['kind']; id: string } =
		$props();

	const result = getHomeResult();
	const data = $derived(findGroup(bridgeName, result(), kind, id));

	const noun = $derived(data.kind === 'room' ? 'room' : 'zone');

	type Target = { kind: 'group' } | { kind: 'light'; id: string };
	let target = $state<Target | null>(null);
	let dialogOpen = $state(false);

	// The light is looked up again on every data change, so the dialog closes when it goes away.
	const openLightId = $derived(target?.kind === 'light' ? target.id : null);
	const openLight = $derived(
		data.lights.find((light) => light.id === openLightId && light.reachable)
	);
	const control = $derived(
		!target || !data.group
			? null
			: target.kind === 'group'
				? groupTarget(data.group)
				: openLight
					? lightTarget(openLight)
					: null
	);

	function groupDescription(group: HomeGroup): string {
		const count = group.lightIds.length;
		return `${group.kind === 'room' ? 'Room' : 'Zone'} · ${count === 1 ? '1 light' : `${count} lights`}`;
	}

	const description = $derived(
		target?.kind === 'group' && data.group
			? groupDescription(data.group)
			: (openLight?.product ?? undefined)
	);

	function open(next: Target) {
		target = next;
		dialogOpen = true;
	}

	afterNavigate(() => (dialogOpen = false));
</script>

<div class="flex flex-col">
	{#if data.status !== 'ok'}
		<div class="flex flex-col gap-6 p-6">
			<BridgeStatusView name={data.bridgeName} status={data.status} />
			<Button class="self-start" onclick={() => refreshAll()}>Try again</Button>
		</div>
	{:else if !data.group}
		<Empty.Root class="m-6">
			<Empty.Header>
				<Empty.Title>{noun === 'room' ? 'Room' : 'Zone'} not found</Empty.Title>
				<Empty.Description>
					This {noun} no longer exists on your bridge. It may have been removed in the Hue app.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		{@const group = data.group}
		{#key group.id}
			<RoomHeader {group} lights={data.lights} onOpenColor={() => open({ kind: 'group' })} />
		{/key}

		<div class="flex flex-col gap-8 p-6">
			<section class="flex flex-col gap-3" aria-labelledby="scenes-heading">
				<h2 id="scenes-heading" class="text-sm font-medium text-muted-foreground">Scenes</h2>
				<SceneList {group} />
			</section>

			<section class="flex flex-col gap-3" aria-labelledby="lights-heading">
				<h2 id="lights-heading" class="text-sm font-medium text-muted-foreground">Lights</h2>
				<ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Lights">
					{#each data.lights as light (light.id)}
						<LightCard {light} onOpen={() => open({ kind: 'light', id: light.id })} />
					{/each}
				</ul>
			</section>
		</div>

		<ControlDialog
			{control}
			{description}
			open={dialogOpen && control !== null}
			onOpenChange={(next) => (dialogOpen = next)}
		/>
	{/if}
</div>
