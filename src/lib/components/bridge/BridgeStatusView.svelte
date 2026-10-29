<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import type { BridgeStatus } from '#lib/server/hue/bridge.ts';

	let { name, status }: { name: string; status: BridgeStatus | 'checking' } = $props();
</script>

{#if status === 'checking'}
	<p class="flex items-center gap-2 text-sm text-muted-foreground">
		<Spinner />
		Checking the bridge…
	</p>
{:else if status === 'ok'}
	<p class="text-sm">Connected to {name}</p>
{:else if status === 'unreachable'}
	<Alert.Root>
		<Alert.Title>Bridge not reachable</Alert.Title>
		<Alert.Description>
			Couldn't reach {name}. Check that it's on and connected, then try again.
		</Alert.Description>
	</Alert.Root>
{:else if status === 'unauthorized'}
	<Alert.Root variant="destructive">
		<Alert.Title>Bridge refused access</Alert.Title>
		<Alert.Description>
			The bridge no longer accepts huedash. Forget the bridge and pair it again.
		</Alert.Description>
	</Alert.Root>
{:else}
	<Alert.Root variant="destructive">
		<Alert.Title>Bridge certificate changed</Alert.Title>
		<Alert.Description>
			The device at this address shows a different certificate, so huedash stopped. If you replaced
			or reset your bridge, forget it and pair it again.
		</Alert.Description>
	</Alert.Root>
{/if}
