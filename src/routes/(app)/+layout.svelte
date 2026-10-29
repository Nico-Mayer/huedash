<script lang="ts">
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { resolve } from '$app/paths';
	import LiveStatus from '#lib/components/live/LiveStatus.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { live } from '#lib/live.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => {
		live.connect();
	});

	// Catches anything missed while the tab was in the background.
	function refreshWhenVisible() {
		if (document.visibilityState === 'visible') live.reload();
	}
</script>

<svelte:document onvisibilitychange={refreshWhenVisible} />

<div class="flex min-h-svh flex-col" data-live={live.open ? 'open' : 'closed'}>
	<header class="flex items-center justify-between border-b px-6 py-3">
		<a href={resolve('/(app)')} class="font-semibold">huedash</a>
		<a
			href={resolve('/(app)/settings')}
			class={buttonVariants({ variant: 'ghost', size: 'icon' })}
			aria-label="Settings"
		>
			<SettingsIcon />
		</a>
	</header>
	<LiveStatus connected={live.connected} />
	{@render children()}
</div>
