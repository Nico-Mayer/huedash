<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
	{#if data.result.status !== 'ok'}
		<div class="flex flex-col gap-4">
			<BridgeStatusView name={data.bridgeName} status={data.result.status} />
			<div class="flex gap-2">
				<Button onclick={() => refreshAll()}>Try again</Button>
				<a href={resolve('/(app)/settings')} class={buttonVariants({ variant: 'outline' })}>
					Open settings
				</a>
			</div>
		</div>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No rooms yet</Empty.Title>
				<Empty.Description>
					Create rooms and zones in the Hue app. They show up here.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}
</div>
