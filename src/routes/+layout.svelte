<script lang="ts">
	import './layout.css';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const inSetup = $derived(page.url.pathname.startsWith('/setup'));

	// No polling: changes made elsewhere show up when the user comes back to the tab.
	function refreshWhenVisible() {
		if (document.visibilityState === 'visible') refreshAll();
	}
</script>

<svelte:document onvisibilitychange={refreshWhenVisible} />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-svh flex-col">
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
	{@render children()}
</div>

<Toaster />
