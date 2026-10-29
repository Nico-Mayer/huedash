<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import type { HomeGroup } from '#lib/server/hue/home.ts';
	import ColorControl from './ColorControl.svelte';
	import ColorTemperatureControl from './ColorTemperatureControl.svelte';
	import GroupControls from './GroupControls.svelte';

	let { group }: { group: HomeGroup } = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Description>Controlling</Card.Description>
		<Card.Title>{group.name}</Card.Title>
	</Card.Header>
	<Card.Content class="flex flex-col gap-6">
		<GroupControls {group} />

		{#if group.colorTemperature && group.color}
			<Tabs.Root value="white">
				<Tabs.List class="w-full">
					<Tabs.Trigger value="white">White</Tabs.Trigger>
					<Tabs.Trigger value="color">Color</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="white" class="pt-4">
					<ColorTemperatureControl {group} range={group.colorTemperature} />
				</Tabs.Content>
				<Tabs.Content value="color" class="pt-4">
					<ColorControl {group} />
				</Tabs.Content>
			</Tabs.Root>
		{:else if group.colorTemperature}
			<ColorTemperatureControl {group} range={group.colorTemperature} />
		{:else if group.color}
			<ColorControl {group} />
		{/if}
	</Card.Content>
</Card.Root>
