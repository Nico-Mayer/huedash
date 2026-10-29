<script lang="ts">
	import { page } from '$app/state';
	import LiveStatus from '#lib/components/live/LiveStatus.svelte';
	import AppSidebar from '#lib/components/shell/AppSidebar.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { live } from '#lib/live.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const title = $derived(
		page.data.group?.name ?? (page.route.id === '/(app)/settings' ? 'Settings' : 'huedash')
	);

	$effect(() => {
		live.connect();
	});

	// Catches anything missed while the tab was in the background.
	function refreshWhenVisible() {
		if (document.visibilityState === 'visible') live.reload();
	}
</script>

<svelte:document onvisibilitychange={refreshWhenVisible} />

<Sidebar.Provider>
	<AppSidebar bridgeName={data.bridgeName} result={data.result} />
	<Sidebar.Inset data-live={live.open ? 'open' : 'closed'}>
		<header class="flex items-center gap-2 border-b px-4 py-2 md:hidden">
			<Sidebar.Trigger aria-label="Open menu" />
			<span class="truncate font-semibold">{title}</span>
		</header>
		<LiveStatus connected={live.connected} />
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
