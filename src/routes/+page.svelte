<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import GroupCard from '#lib/components/home/GroupCard.svelte';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
	{#if data.result.status !== 'ok'}
		<div class="flex flex-col gap-4">
			<BridgeStatusView name={data.bridgeName} status={data.result.status} />
			<div class="flex gap-2">
				<Button onclick={() => refreshAll()}>Try again</Button>
				<a href={resolve('/settings')} class={buttonVariants({ variant: 'outline' })}>
					Open settings
				</a>
			</div>
		</div>
	{:else if data.result.home.rooms.length === 0 && data.result.home.zones.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No rooms yet</Empty.Title>
				<Empty.Description>
					Create rooms and zones in the Hue app. They show up here.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		{#each [{ title: 'Rooms', groups: data.result.home.rooms }, { title: 'Zones', groups: data.result.home.zones }] as section (section.title)}
			{#if section.groups.length > 0}
				<section class="flex flex-col gap-4" aria-labelledby="section-{section.title}">
					<h2 id="section-{section.title}" class="text-lg font-semibold">{section.title}</h2>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each section.groups as group (group.id)}
							<GroupCard {group} />
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{/if}
</main>
