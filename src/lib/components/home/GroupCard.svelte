<script lang="ts">
	import { resolve } from '$app/paths';
	import { applyChange } from '#lib/commands.ts';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import type { HomeGroup } from '#lib/server/hue/home.ts';

	let { group, link = true }: { group: HomeGroup; link?: boolean } = $props();

	let on = $derived(group.on);
	let brightness = $derived(group.brightness);

	const target = $derived({ kind: 'groups' as const, id: group.groupedLightId, name: group.name });
	const href = $derived(
		group.kind === 'room'
			? resolve('/rooms/[id]', { id: group.id })
			: resolve('/zones/[id]', { id: group.id })
	);

	function setOn(next: boolean) {
		const previous = on;
		on = next;
		applyChange(target, { on: next }, () => (on = previous));
	}

	function commitBrightness(value: number) {
		const previous = { on, brightness };
		on = true;
		applyChange(target, { on: true, brightness: value }, () => ({ on, brightness } = previous));
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			{#if link}
				<a {href} class="hover:underline">{group.name}</a>
			{:else}
				<h1>{group.name}</h1>
			{/if}
		</Card.Title>
		<Card.Description class="tabular-nums">
			{on ? `On, ${brightness} %` : 'Off'}
		</Card.Description>
		<Card.Action>
			<Switch checked={on} onCheckedChange={setOn} aria-label={group.name} />
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Slider
			type="single"
			bind:value={brightness}
			min={1}
			max={100}
			onValueCommit={commitBrightness}
			thumbLabel="{group.name} brightness"
		/>
	</Card.Content>
</Card.Root>
