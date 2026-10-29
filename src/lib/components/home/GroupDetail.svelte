<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import type { GroupPageData } from '#lib/server/group-page.ts';
	import ColorControl from './ColorControl.svelte';
	import ColorTemperatureControl from './ColorTemperatureControl.svelte';
	import GroupCard from './GroupCard.svelte';
	import LightRow from './LightRow.svelte';
	import SceneList from './SceneList.svelte';

	let { data }: { data: GroupPageData } = $props();

	const noun = $derived(data.kind === 'room' ? 'room' : 'zone');
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
	<a href={resolve('/(app)')} class="text-sm text-muted-foreground hover:underline">← All rooms</a>

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
			<Empty.Content>
				<a href={resolve('/(app)')} class={buttonVariants({ variant: 'outline' })}
					>Go to all rooms</a
				>
			</Empty.Content>
		</Empty.Root>
	{:else}
		{@const group = data.group}
		<GroupCard {group} link={false} />

		<Card.Root>
			<Card.Header>
				<Card.Title>Scenes</Card.Title>
			</Card.Header>
			<Card.Content>
				<SceneList {group} />
			</Card.Content>
		</Card.Root>

		{#if group.colorTemperature || group.color}
			<Card.Root>
				<Card.Content class="flex flex-col gap-6">
					{#if group.colorTemperature}
						<ColorTemperatureControl {group} range={group.colorTemperature} />
					{/if}
					{#if group.color}
						<ColorControl {group} />
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<Card.Root>
			<Card.Header>
				<Card.Title>Lights</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul class="flex flex-col divide-y">
					{#each group.lights as light (light.id)}
						<LightRow {light} />
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
