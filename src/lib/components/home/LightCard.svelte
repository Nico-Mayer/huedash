<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { changeLight, lightBrightness, lightOn } from '#lib/group-state.svelte.ts';
	import { lightSwatch, lightTarget } from '#lib/control-target.svelte.ts';
	import type { HomeLight } from '#lib/server/hue/home.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import LevelSlider from './LevelSlider.svelte';
	import LightIndicator from './LightIndicator.svelte';

	let { light, onOpen }: { light: HomeLight; onOpen: () => void } = $props();

	const on = $derived(lightOn(light));
	const brightness = new SmoothValue(() => lightBrightness(light));
	const target = $derived(lightTarget(light));
	const swatch = $derived(lightSwatch(light));
	const lit = $derived(light.reachable && on && swatch !== null);
</script>

<!-- The open button stretches over the whole card; the switch and slider sit above it. -->
<li
	class={[
		'group/card relative isolate flex min-w-0 flex-col gap-4 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground [--glow:22%] dark:[--glow:15%]',
		!light.reachable && 'opacity-60',
		'has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50'
	]}
	style:--swatch={swatch}
	data-glow={lit}
>
	<div class="flex items-center justify-between gap-3">
		<button
			type="button"
			class="flex min-w-0 flex-1 items-center gap-3 text-left outline-none after:absolute after:inset-0 after:rounded-xl enabled:cursor-pointer"
			aria-haspopup="dialog"
			disabled={!light.reachable}
			onclick={onOpen}
		>
			<span
				class={[
					'relative shrink-0 before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:-z-10 before:size-48 before:-translate-1/2 before:rounded-full before:bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--swatch)_var(--glow),transparent),transparent)] before:opacity-0 before:transition-[scale,opacity] before:duration-500 before:ease-out motion-reduce:before:transition-none',
					lit &&
						'before:opacity-100 group-hover/card:before:scale-600 group-hover/card:before:opacity-40 group-has-[button:focus-visible]/card:before:scale-600 group-has-[button:focus-visible]/card:before:opacity-40'
				]}
			>
				<LightIndicator {swatch} on={light.reachable && on} />
			</span>
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
			tone={{ kind: 'light', color: light.reachable && on ? target.swatch : null }}
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
