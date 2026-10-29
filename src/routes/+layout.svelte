<script lang="ts">
	import './layout.css';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { ModeWatcher } from 'mode-watcher';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import LiveStatus from '#lib/components/live/LiveStatus.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { live } from '#lib/live.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const inSetup = $derived(page.url.pathname.startsWith('/setup'));

	// Without a bridge the events endpoint answers 409 and the browser would stop retrying.
	$effect(() => {
		if (!inSetup) live.connect();
	});

	// Catches anything missed while the tab was in the background.
	function refreshWhenVisible() {
		if (document.visibilityState === 'visible') live.reload();
	}
</script>

<svelte:document onvisibilitychange={refreshWhenVisible} />

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-svh flex-col" data-live={live.open ? 'open' : 'closed'}>
	<header class="flex items-center justify-between border-b px-6 py-3">
		<a href={resolve('/')} class="font-semibold">huedash</a>
		{#if !inSetup}
			<a
				href={resolve('/settings')}
				class={buttonVariants({ variant: 'ghost', size: 'icon' })}
				aria-label="Settings"
			>
				<SettingsIcon />
			</a>
		{/if}
	</header>
	{#if !inSetup}
		<LiveStatus connected={live.connected} />
	{/if}
	{@render children()}
</div>

<Toaster />
