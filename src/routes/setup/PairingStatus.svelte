<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { formatFingerprint } from './messages.ts';

	type Props = {
		bridge: { id: string; name: string; certSha256: string };
		pairing: 'waiting' | 'timed-out' | 'failed';
		secondsLeft: number;
		error: string | null;
		onretry: () => void;
		onchangeaddress: () => void;
	};

	let { bridge, pairing, secondsLeft, error, onretry, onchangeaddress }: Props = $props();
</script>

<Card.Header>
	<Card.Title>Press the link button</Card.Title>
	<Card.Description>
		Press the round button on top of your bridge. huedash connects as soon as you do.
	</Card.Description>
</Card.Header>
<Card.Content class="flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<div class="flex items-center justify-between gap-2">
			<span class="font-medium">{bridge.name}</span>
			<Badge variant="secondary" class="tabular-nums">{bridge.id}</Badge>
		</div>
		<span class="text-xs text-muted-foreground tabular-nums">
			Certificate {formatFingerprint(bridge.certSha256)}
		</span>
	</div>

	{#if pairing === 'waiting'}
		<p class="flex items-center gap-2 text-sm" role="status" aria-live="polite">
			<Spinner />
			Waiting for the button. <span class="tabular-nums">{secondsLeft} s</span> left.
		</p>
	{:else if pairing === 'timed-out'}
		<Alert.Root>
			<Alert.Title>Time's up</Alert.Title>
			<Alert.Description>Press the link button, then select Try again.</Alert.Description>
		</Alert.Root>
	{:else if error}
		<Alert.Root variant="destructive">
			<Alert.Title>Couldn't connect</Alert.Title>
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}
</Card.Content>
<Card.Footer class="flex justify-between gap-2">
	<Button variant="ghost" onclick={onchangeaddress}>Use a different address</Button>
	{#if pairing !== 'waiting'}
		<Button onclick={onretry}>Try again</Button>
	{/if}
</Card.Footer>
