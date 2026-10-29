<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { changeLight, lightBrightness, lightOn, lightSwatch } from '#lib/group-state.svelte.ts';
	import { selection } from '#lib/selection.svelte.ts';
	import type { HomeLight } from '#lib/server/hue/home.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import LevelSlider from './LevelSlider.svelte';
	import LightIndicator from './LightIndicator.svelte';

	let { light }: { light: HomeLight } = $props();

	const on = $derived(lightOn(light));
	const brightness = new SmoothValue(() => lightBrightness(light));
	const selected = $derived(selection.has(light.id));

	function select(event: MouseEvent) {
		if (selection.selecting || event.shiftKey || event.metaKey || event.ctrlKey)
			selection.toggle(light.id);
		else selection.only(light.id);
	}
</script>

<!-- The select button stretches over the whole card; the switch and slider sit above it. The card
     draws one ring: the selection, or the keyboard focus when not selected. -->
<li
	class={[
		'relative flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground',
		!light.reachable && 'opacity-60',
		selected
			? 'ring-2 ring-primary'
			: 'has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50'
	]}
>
	<div class="flex items-center justify-between gap-3">
		<button
			type="button"
			class="flex min-w-0 flex-1 items-center gap-3 text-left outline-none after:absolute after:inset-0 after:rounded-xl enabled:cursor-pointer"
			aria-pressed={selected}
			disabled={!light.reachable}
			onclick={select}
		>
			<LightIndicator swatch={lightSwatch(light)} on={light.reachable && on} />
			<span class="flex min-w-0 flex-col">
				<span class="truncate font-medium">{light.name}</span>
				<span class="truncate text-sm text-muted-foreground tabular-nums">
					{#if !light.reachable}
						Unreachable
					{:else if !on}
						Off
					{:else if light.brightness !== null}
						On, {brightness.current} %
					{:else}
						On
					{/if}
					{#if light.product}
						· {light.product}
					{/if}
				</span>
			</span>
		</button>
		<Switch
			class="relative"
			checked={on}
			onCheckedChange={(next) => changeLight(light, { on: next })}
			disabled={!light.reachable}
			aria-label={light.name}
		/>
	</div>
	{#if light.brightness !== null}
		<LevelSlider
			size="sm"
			value={brightness.current}
			min={1}
			max={100}
			format={(value) => `${value} %`}
			onValueChange={(value) => brightness.input(value)}
			onValueCommit={(value) => {
				brightness.commit(value);
				changeLight(light, { on: true, brightness: value });
			}}
			disabled={!light.reachable}
			thumbLabel="{light.name} brightness"
		/>
	{/if}
</li>
