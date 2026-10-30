<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import LiveStatus from '#lib/components/live/LiveStatus.svelte';
	import AppSidebar from '#lib/components/shell/AppSidebar.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { findGroup } from '#lib/group-page.ts';
	import { setHomeResult } from '#lib/home-context.ts';
	import { live } from '#lib/home.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const result = $derived(live.current(data.result));
	setHomeResult(() => result);

	const title = $derived.by(() => {
		if (page.data.kind && page.data.id) {
			return (
				findGroup(data.bridgeName, result, page.data.kind, page.data.id).group?.name ?? 'huedash'
			);
		}
		return page.route.id === '/(app)/settings' ? 'Settings' : 'huedash';
	});

	$effect(() => {
		live.connect();
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Sidebar.Provider>
	<AppSidebar bridgeName={data.bridgeName} {result} />
	<Sidebar.Inset class="[view-transition-name:page]" data-live={live.open ? 'open' : 'closed'}>
		<header class="flex items-center gap-2 border-b px-4 py-2 md:hidden">
			<Sidebar.Trigger aria-label="Open menu" />
			<span class="truncate font-semibold">{title}</span>
		</header>
		<LiveStatus connected={live.connected} />
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
