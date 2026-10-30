<script lang="ts">
	import PowerIcon from '@lucide/svelte/icons/power';
	import SunDimIcon from '@lucide/svelte/icons/sun-dim';
	import { Toggle, ToggleGroup } from 'bits-ui';
	import { untrack } from 'svelte';
	import { kelvinToMirek, mirekToKelvin } from '#lib/color-temperature.ts';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import ColorControl from './ColorControl.svelte';
	import LevelSlider from './LevelSlider.svelte';

	type Mode = 'brightness' | 'color' | 'white';

	let { control, class: className }: { control: ControlTarget; class?: string } = $props();

	const modes = $derived<Mode[]>([
		...(control.dimmable ? (['brightness'] as const) : []),
		...(control.color ? (['color'] as const) : []),
		...(control.mirekRange ? (['white'] as const) : [])
	]);
	// Read once: the dialog opens on brightness and keeps the user's choice through live changes.
	let mode = $state<Mode | null>(
		untrack(() => {
			if (modes.includes('brightness')) return 'brightness';
			return modes.includes('white') ? 'white' : (modes[0] ?? null);
		})
	);

	const brightness = new SmoothValue(() => control.brightness);
	const warmest = $derived(control.mirekRange ? mirekToKelvin(control.mirekRange.maxMirek) : 0);
	const coolest = $derived(control.mirekRange ? mirekToKelvin(control.mirekRange.minMirek) : 0);
	const kelvin = new SmoothValue(() =>
		control.mirek !== null ? mirekToKelvin(control.mirek) : Math.round((warmest + coolest) / 2)
	);

	const value = $derived.by(() => {
		if (!control.on) return 'Off';
		if (mode === 'white') return `${kelvin.current} K`;
		return control.dimmable ? `${brightness.current} %` : 'On';
	});

	const modeLabels: Record<Mode, string> = {
		brightness: 'Brightness',
		color: 'Color',
		white: 'White'
	};
</script>

<div class={['flex flex-col items-center gap-6', className]}>
	<p class="text-4xl font-medium tabular-nums" data-control-value>{value}</p>

	{#if mode === 'brightness'}
		<LevelSlider
			orientation="vertical"
			value={brightness.current}
			min={1}
			max={100}
			tone={{ kind: 'light', color: control.on ? control.swatch : null }}
			format={(value) => `${value} %`}
			onValueChange={(value) => brightness.input(value)}
			onValueCommit={(value) => {
				brightness.commit(value);
				control.apply({ on: true, brightness: value });
			}}
			thumbLabel="{control.name} brightness"
		/>
	{:else if mode === 'white'}
		<LevelSlider
			orientation="vertical"
			value={kelvin.current}
			min={warmest}
			max={coolest}
			step={50}
			tone={{ kind: 'white', stops: control.whiteStops ?? [] }}
			format={(value) => `${value} K`}
			onValueChange={(value) => kelvin.input(value)}
			onValueCommit={(value) => {
				kelvin.commit(value);
				control.apply({ on: true, mirek: kelvinToMirek(value) });
			}}
			thumbLabel="{control.name} color temperature"
		/>
	{:else if mode === 'color'}
		<div class="w-full max-w-72">
			<ColorControl {control} />
		</div>
	{/if}

	<div class="flex items-center gap-1 rounded-full bg-muted p-1">
		<Toggle.Root
			pressed={control.on}
			onPressedChange={(on) => control.apply({ on })}
			aria-label="Power"
			class="flex size-10 items-center justify-center rounded-full text-muted-foreground ring-ring/50 transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
		>
			<PowerIcon class="size-5" />
		</Toggle.Root>
		{#if modes.length > 0}
			<span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>
			<ToggleGroup.Root
				type="single"
				bind:value={
					() => mode ?? '',
					(next) => {
						if (next) mode = next as Mode;
					}
				}
				aria-label="Mode"
				class="flex items-center gap-1"
			>
				{#each modes as item (item)}
					<ToggleGroup.Item
						value={item}
						aria-label={modeLabels[item]}
						class="flex size-10 items-center justify-center rounded-full ring-ring/50 transition-colors outline-none hover:bg-background/60 focus-visible:ring-[3px] data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:ring-2 data-[state=on]:ring-foreground"
					>
						{#if item === 'brightness'}
							<SunDimIcon class="size-5" />
						{:else}
							<span
								class={[
									'size-6 rounded-full ring-1 ring-foreground/15',
									item === 'color'
										? 'bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]'
										: 'bg-linear-to-b from-[#ff9a3c] via-white to-[#cfe0ff]'
								]}
							></span>
						{/if}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		{/if}
	</div>
</div>
