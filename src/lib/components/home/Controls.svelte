<script lang="ts">
	import { untrack } from 'svelte';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import { SmoothValue } from '#lib/smooth-value.svelte.ts';
	import BrightnessPresets from './BrightnessPresets.svelte';
	import ColorControl from './ColorControl.svelte';
	import ColorTemperatureControl from './ColorTemperatureControl.svelte';
	import LevelSlider from './LevelSlider.svelte';
	import WhitePresets from './WhitePresets.svelte';

	let { control, class: className }: { control: ControlTarget; class?: string } = $props();

	const brightness = new SmoothValue(() => control.brightness);
	// Read once: the tab follows the light's mode when it is opened, not every live change.
	const startTab = untrack(() => (control.hueSaturation ? 'color' : 'white'));
</script>

<div class={['flex flex-col gap-6', className]}>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<p class="text-sm text-muted-foreground tabular-nums">
				{#if !control.on}
					Off
				{:else if control.dimmable}
					On, {brightness.current} %
				{:else}
					On
				{/if}
			</p>
			<Switch
				checked={control.on}
				onCheckedChange={(on) => control.apply({ on })}
				aria-label={control.name}
			/>
		</div>
		{#if control.dimmable}
			<LevelSlider
				value={brightness.current}
				min={1}
				max={100}
				format={(value) => `${value} %`}
				onValueChange={(value) => brightness.input(value)}
				onValueCommit={(value) => {
					brightness.commit(value);
					control.apply({ on: true, brightness: value });
				}}
				thumbLabel="{control.name} brightness"
			/>
			<BrightnessPresets {control} />
		{/if}
	</div>

	{#if control.mirekRange && control.color}
		<Tabs.Root value={startTab}>
			<Tabs.List class="w-full">
				<Tabs.Trigger value="white">White</Tabs.Trigger>
				<Tabs.Trigger value="color">Color</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="white" class="flex flex-col gap-4 pt-4">
				<ColorTemperatureControl {control} range={control.mirekRange} />
				<WhitePresets {control} range={control.mirekRange} />
			</Tabs.Content>
			<Tabs.Content value="color" class="pt-4">
				<ColorControl {control} />
			</Tabs.Content>
		</Tabs.Root>
	{:else if control.mirekRange}
		<div class="flex flex-col gap-4">
			<ColorTemperatureControl {control} range={control.mirekRange} />
			<WhitePresets {control} range={control.mirekRange} />
		</div>
	{:else if control.color}
		<ColorControl {control} />
	{/if}
</div>
