<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { changeLight, lightBrightness, lightOn } from '#lib/group-state.svelte.ts';
	import { selection } from '#lib/selection.svelte.ts';
	import type { HomeLight } from '#lib/server/hue/home.ts';

	let { light }: { light: HomeLight } = $props();

	const on = $derived(lightOn(light));
	let brightness = $derived(lightBrightness(light));
	const selected = $derived(selection.has(light.id));

	function select(event: MouseEvent) {
		if (selection.selecting || event.shiftKey || event.metaKey || event.ctrlKey)
			selection.toggle(light.id);
		else selection.only(light.id);
	}
</script>

<li
	class={[
		'flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground',
		!light.reachable && 'opacity-60',
		selected && 'ring-2 ring-primary'
	]}
>
	<div class="flex items-center justify-between gap-3">
		{#if selection.selecting}
			<Checkbox
				checked={selected}
				onCheckedChange={() => selection.toggle(light.id)}
				disabled={!light.reachable}
				aria-label="Select {light.name}"
			/>
		{/if}
		<button
			type="button"
			class="flex min-w-0 flex-1 flex-col rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
			aria-pressed={selected}
			disabled={!light.reachable}
			onclick={select}
		>
			<span class="truncate font-medium">{light.name}</span>
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
		</button>
		<Switch
			checked={on}
			onCheckedChange={(next) => changeLight(light, { on: next })}
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
			onValueCommit={(value) => changeLight(light, { on: true, brightness: value })}
			disabled={!light.reachable}
			thumbLabel="{light.name} brightness"
		/>
	{/if}
</li>
