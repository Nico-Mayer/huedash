<script lang="ts">
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import GroupSwitch from '#lib/components/home/GroupSwitch.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { groupSummary, homeSummary, onSwatches } from '#lib/group-state.svelte.ts';
	import { live } from '#lib/home.svelte.ts';
	import { lightsOf } from '#lib/group-page.ts';
	import type { HomeGroup, HomeResult } from '#lib/server/hue/home.ts';

	let { bridgeName, result }: { bridgeName: string; result: HomeResult } = $props();

	const sidebar = Sidebar.useSidebar();

	const sections = $derived(
		result.status === 'ok'
			? [
					{ title: 'Rooms', groups: result.home.rooms },
					{ title: 'Zones', groups: result.home.zones }
				].filter((section) => section.groups.length > 0)
			: []
	);

	function href(group: HomeGroup) {
		return group.kind === 'room'
			? resolve('/(app)/rooms/[id]', { id: group.id })
			: resolve('/(app)/zones/[id]', { id: group.id });
	}

	const closeOnPhone = () => sidebar.setOpenMobile(false);
</script>

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header>
		<div class="flex flex-col px-2 py-1">
			<a href={resolve('/(app)')} class="font-semibold" onclick={closeOnPhone}>huedash</a>
			{#if result.status === 'ok'}
				<span class="text-xs text-muted-foreground tabular-nums">{homeSummary(result.home)}</span>
			{/if}
		</div>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each sections as section (section.title)}
			<Sidebar.Group role="group" aria-label={section.title}>
				<Sidebar.GroupLabel>{section.title}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each section.groups as group (group.id)}
							{@const current = page.url.pathname === href(group)}
							{@const lights = result.status === 'ok' ? lightsOf(result.home, group) : []}
							<Sidebar.MenuItem class="flex items-center gap-2">
								<Sidebar.MenuButton size="lg" isActive={current}>
									{#snippet child({ props })}
										<a
											href={href(group)}
											aria-current={current ? 'page' : undefined}
											onclick={closeOnPhone}
											{...props}
										>
											<span class="flex min-w-0 flex-col">
												<span class="truncate">{group.name}</span>
												<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
													{#each onSwatches(lights) as swatch, i (i)}
														<span
															class={[
																'size-1.5 shrink-0 rounded-full',
																swatch ? 'bg-(--swatch)' : 'bg-foreground/60'
															]}
															style:--swatch={swatch}
															data-swatch={swatch ?? 'none'}
															aria-hidden="true"
														></span>
													{/each}
													<span class="truncate">{groupSummary(group, lights)}</span>
												</span>
											</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
								<GroupSwitch {group} />
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton isActive={page.url.pathname === resolve('/(app)/settings')}>
					{#snippet child({ props })}
						<a href={resolve('/(app)/settings')} onclick={closeOnPhone} {...props}>
							<SettingsIcon />
							<span>Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<p class="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground" role="status">
			<span
				class={['size-2 rounded-full', live.connected ? 'bg-primary' : 'bg-muted-foreground']}
				aria-hidden="true"
			></span>
			{live.connected ? `${bridgeName} · connected` : 'Reconnecting…'}
		</p>
	</Sidebar.Footer>
</Sidebar.Root>
