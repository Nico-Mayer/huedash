<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Slider } from '#lib/components/ui/slider/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import BrightnessPresets from './BrightnessPresets.svelte';
	import ColorControl from './ColorControl.svelte';
	import ColorTemperatureControl from './ColorTemperatureControl.svelte';
	import WhitePresets from './WhitePresets.svelte';

	let { control, scene, onBack }: { control: ControlTarget; scene?: string; onBack?: () => void } =
		$props();

	let brightness = $derived(control.brightness);
	// Read once: the tab follows the light's mode when it is opened, not every live change.
	const startTab = untrack(() => (control.hueSaturation ? 'color' : 'white'));
</script>

<Card.Root>
	<Card.Header>
		<Card.Description>Controlling</Card.Description>
		<Card.Title>{control.name}</Card.Title>
		{#if onBack}
			<Card.Action>
				<Button variant="ghost" size="sm" onclick={onBack}>Back to room</Button>
			</Card.Action>
		{/if}
	</Card.Header>
	<Card.Content class="flex flex-col gap-6">
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between gap-4">
				<p class="text-sm text-muted-foreground tabular-nums">
					{#if !control.on}
						Off
					{:else if scene}
						{scene}, {brightness} %
					{:else}
						On, {brightness} %
					{/if}
				</p>
				<Switch
					checked={control.on}
					onCheckedChange={(on) => control.apply({ on })}
					aria-label={control.name}
				/>
			</div>
			<Slider
				type="single"
				bind:value={brightness}
				min={1}
				max={100}
				onValueCommit={(value) => control.apply({ on: true, brightness: value })}
				thumbLabel="{control.name} brightness"
			/>
			<BrightnessPresets {control} />
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
	</Card.Content>
</Card.Root>
