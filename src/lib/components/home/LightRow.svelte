<script lang="ts">
	import { applyChange } from '#lib/commands.ts';
	import { live } from '#lib/live.svelte.ts';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import type { HomeLight } from '#lib/server/hue/home.ts';

	let { light }: { light: HomeLight } = $props();

	let on = $derived(live.lights.get(light.id)?.on ?? light.on);
	let brightness = $derived(live.lights.get(light.id)?.brightness ?? light.brightness ?? 100);

	const target = $derived({ kind: 'lights' as const, id: light.id, name: light.name });

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

<li class="flex flex-col gap-3 py-3">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col">
			<span class="font-medium">{light.name}</span>
			<span class="text-sm text-muted-foreground tabular-nums">
				{#if !light.reachable}
					Unreachable
				{:else if !on}
					Off
				{:else if light.brightness !== null}
					On, {brightness} %
				{:else}
					On
				{/if}
			</span>
		</div>
		<Switch
			checked={on}
			onCheckedChange={setOn}
			disabled={!light.reachable}
			aria-label={light.name}
		/>
	</div>
	{#if light.brightness !== null}
		<Slider
			type="single"
			bind:value={brightness}
			min={1}
			max={100}
			onValueCommit={commitBrightness}
			disabled={!light.reachable}
			thumbLabel="{light.name} brightness"
		/>
	{/if}
</li>
