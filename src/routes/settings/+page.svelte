<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
	import ForgetBridge from './ForgetBridge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		await refreshAll();
		retrying = false;
	}
</script>

<main class="flex flex-1 justify-center p-6">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>{data.name}</Card.Title>
			<Card.Description>Your Hue bridge</Card.Description>
		</Card.Header>

		<Card.Content>
			{#await data.status}
				<BridgeStatusView name={data.name} status="checking" />
			{:then status}
				<BridgeStatusView name={data.name} {status} />
			{/await}
		</Card.Content>

		<Card.Footer class="flex flex-wrap justify-between gap-2">
			{#if data.source === 'env'}
				<p class="text-sm text-muted-foreground">
					Set by env vars. Change HUE_BRIDGE_IP and HUE_APP_KEY to use another bridge.
				</p>
			{:else}
				<ForgetBridge name={data.name} />
			{/if}

			{#await data.status then status}
				{#if status === 'unreachable'}
					<Button onclick={retry} disabled={retrying}>
						{#if retrying}<Spinner data-icon="inline-start" />{/if}
						Try again
					</Button>
				{/if}
			{/await}
		</Card.Footer>
	</Card.Root>
</main>
