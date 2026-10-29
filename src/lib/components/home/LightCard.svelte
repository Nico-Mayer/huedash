<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { changeLight, lightBrightness, lightOn } from '#lib/group-state.svelte.ts';
	import type { HomeLight } from '#lib/server/hue/home.ts';

	let { light }: { light: HomeLight } = $props();

	const on = $derived(lightOn(light));
	let brightness = $derived(lightBrightness(light));
</script>

<li
	class={[
		'flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground',
		!light.reachable && 'opacity-60'
	]}
>
	<div class="flex items-center justify-between gap-3">
		<div class="flex min-w-0 flex-col">
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
		</div>
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
