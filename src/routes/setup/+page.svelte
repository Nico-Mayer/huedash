<script lang="ts">
	import { deserialize, enhance, type ActionResult } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import type { DiscoveryResult } from '#lib/server/hue/discovery.ts';
	import type { PairResult } from '#lib/server/setup.ts';
	import PairingStatus from './PairingStatus.svelte';
	import {
		checkErrorMessage,
		discoveryMessage,
		pairErrorMessage,
		type CheckError
	} from './messages.ts';

	type Bridge = { id: string; name: string; certSha256: string };

	const PAIRING_SECONDS = 60;
	const POLL_MS = 2000;

	let address = $state('');
	let checking = $state(false);
	let checkError = $state<CheckError | null>(null);
	let discovering = $state(false);
	let discovery = $state<DiscoveryResult | null>(null);
	let bridge = $state<Bridge | null>(null);
	let pairing = $state<'waiting' | 'timed-out' | 'failed'>('waiting');
	let pairError = $state<string | null>(null);
	let secondsLeft = $state(PAIRING_SECONDS);
	let checkForm = $state<HTMLFormElement>();

	const discoveryNote = $derived(discovery ? discoveryMessage(discovery) : null);

	async function requestPair(): Promise<ActionResult> {
		const response = await fetch('?/pair', {
			method: 'POST',
			body: new FormData(),
			headers: { 'x-sveltekit-action': 'true' }
		});
		return deserialize(await response.text());
	}

	let stopPairing: (() => void) | undefined;

	function startPairing() {
		stopPairing?.();
		secondsLeft = PAIRING_SECONDS;
		pairError = null;
		pairing = 'waiting';

		const started = Date.now();
		let stopped = false;
		const countdown = setInterval(() => {
			secondsLeft = Math.max(0, PAIRING_SECONDS - Math.floor((Date.now() - started) / 1000));
			if (secondsLeft === 0) finish('timed-out');
		}, 250);

		function finish(state: 'timed-out' | 'failed', error?: PairResult) {
			stopped = true;
			clearInterval(countdown);
			pairing = state;
			if (error) pairError = pairErrorMessage(error);
		}

		stopPairing = () => {
			stopped = true;
			clearInterval(countdown);
		};

		(async () => {
			while (!stopped) {
				const result = await requestPair();
				if (stopped) return;

				if (result.type === 'redirect') {
					stopPairing?.();
					await goto(resolve('/'), { invalidateAll: true });
					return;
				}
				if (result.type === 'failure')
					return finish('failed', result.data?.pairError as PairResult);
				if (result.type === 'error') {
					return finish('failed', { status: 'failed', reason: 'unreachable' });
				}
				await new Promise((resolve) => setTimeout(resolve, POLL_MS));
			}
		})();
	}

	$effect(() => () => stopPairing?.());

	function chooseBridge(discovered: string) {
		address = discovered;
		queueMicrotask(() => checkForm?.requestSubmit());
	}

	function changeAddress() {
		stopPairing?.();
		bridge = null;
		checkError = null;
	}
</script>

<main class="flex min-h-svh items-center justify-center p-6">
	<Card.Root class="w-full max-w-md">
		{#if !bridge}
			<Card.Header>
				<Card.Title>Connect your Hue bridge</Card.Title>
				<Card.Description>huedash controls your lights through your Hue bridge.</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-6">
				<form
					method="POST"
					action="?/check"
					bind:this={checkForm}
					use:enhance={() => {
						checking = true;
						checkError = null;
						return async ({ result, update }) => {
							checking = false;
							if (result.type === 'success' && result.data?.bridge) {
								bridge = result.data.bridge as Bridge;
								startPairing();
							} else if (result.type === 'failure') {
								checkError = result.data?.checkError as CheckError;
							} else {
								await update({ reset: false });
							}
						};
					}}
				>
					<Field.FieldGroup>
						<Field.Field data-invalid={checkError ? true : undefined}>
							<Field.FieldLabel for="address">Bridge IP address</Field.FieldLabel>
							<Input
								id="address"
								name="address"
								bind:value={address}
								placeholder="192.168.1.20"
								autocomplete="off"
								aria-invalid={checkError ? true : undefined}
								required
							/>
							{#if checkError}
								<Field.FieldError>{checkErrorMessage(checkError, address)}</Field.FieldError>
							{:else}
								<Field.FieldDescription>
									Find it in your router or in the Hue app.
								</Field.FieldDescription>
							{/if}
						</Field.Field>
						<Button type="submit" disabled={checking}>
							{#if checking}<Spinner data-icon="inline-start" />{/if}
							Connect
						</Button>
					</Field.FieldGroup>
				</form>

				<form
					method="POST"
					action="?/discover"
					class="flex flex-col gap-3"
					use:enhance={() => {
						discovering = true;
						return async ({ result }) => {
							discovering = false;
							if (result.type === 'success') {
								discovery = result.data?.discovery as DiscoveryResult;
							}
						};
					}}
				>
					<Button type="submit" variant="outline" disabled={discovering}>
						{#if discovering}<Spinner data-icon="inline-start" />{/if}
						Find bridge
					</Button>

					{#if discovery?.status === 'found' && discovery.bridges.length > 0}
						<ul class="flex flex-col gap-2" aria-label="Bridges found">
							{#each discovery.bridges as found (found.id)}
								<li>
									<Button
										variant="secondary"
										class="w-full justify-between"
										onclick={() => chooseBridge(found.address)}
									>
										<span>{found.address}</span>
										<span class="text-muted-foreground tabular-nums">{found.id}</span>
									</Button>
								</li>
							{/each}
						</ul>
					{:else if discoveryNote}
						<p class="text-sm text-muted-foreground" role="status">{discoveryNote}</p>
					{/if}
				</form>
			</Card.Content>
		{:else}
			<PairingStatus
				{bridge}
				{pairing}
				{secondsLeft}
				error={pairError}
				onretry={startPairing}
				onchangeaddress={changeAddress}
			/>
		{/if}
	</Card.Root>
</main>
