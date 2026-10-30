<script lang="ts" module>
	export type SliderTone =
		{ kind: 'light'; color: string | null } | { kind: 'white'; stops: string[] };
</script>

<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '#lib/utils.js';

	let {
		value,
		min = 0,
		max = 100,
		size = 'lg',
		orientation = 'horizontal',
		tone,
		format,
		thumbLabel,
		class: className,
		...restProps
	}: Omit<
		SliderPrimitive.RootProps,
		'type' | 'value' | 'onValueChange' | 'onValueCommit' | 'orientation'
	> & {
		value: number;
		size?: 'sm' | 'lg';
		orientation?: 'horizontal' | 'vertical';
		tone: SliderTone;
		format: (value: number) => string;
		thumbLabel: string;
		onValueChange?: (value: number) => void;
		onValueCommit?: (value: number) => void;
	} = $props();

	const vertical = $derived(orientation === 'vertical');
	const fraction = $derived(max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0);
	const lit = $derived(tone.kind === 'light' && tone.color !== null);
	const gradient = $derived(
		tone.kind === 'white'
			? `linear-gradient(to ${vertical ? 'top' : 'right'}, ${tone.stops.join(', ')})`
			: undefined
	);
	const behindThumb = $derived(
		tone.kind === 'light'
			? tone.color
			: (tone.stops[Math.round(fraction * (tone.stops.length - 1))] ?? null)
	);
	// White on dark or saturated colors, dark gray on pale ones such as yellow or daylight.
	const thumbLine = $derived(
		behindThumb ? `oklch(from ${behindThumb} clamp(0.3, (0.82 - l) * 1000, 1) 0 0)` : undefined
	);
</script>

<SliderPrimitive.Root
	type="single"
	{value}
	{min}
	{max}
	{orientation}
	class={cn(
		'group/slider relative flex cursor-pointer touch-none items-center select-none has-data-active:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:opacity-50',
		vertical ? 'h-[clamp(15rem,40svh,18rem)] w-24 flex-col' : 'w-full',
		className
	)}
	style={[
		lit && tone.kind === 'light' && `--tone: ${tone.color}`,
		thumbLine && `--thumb-line: ${thumbLine}`
	]
		.filter(Boolean)
		.join('; ')}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slider-track
			class={[
				'relative grow overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/10 after:ring-inset',
				vertical ? 'h-full w-full rounded-3xl' : 'w-full rounded-lg',
				!vertical && (size === 'sm' ? 'h-6' : 'h-10'),
				tone.kind === 'light' && (lit ? 'bg-(--tone)/20' : 'bg-muted')
			]}
			style:background-image={gradient}
		>
			{#if tone.kind === 'light'}
				<!-- Ends at the far edge of the thumb, which bits-ui keeps inside the track. -->
				<span
					data-slider-fill
					class={[
						'absolute',
						vertical ? 'inset-x-0 bottom-0 rounded-3xl' : 'inset-y-0 left-0 rounded-lg',
						lit ? 'bg-(--tone)' : 'bg-muted-foreground/40'
					]}
					style:width={vertical ? undefined : `calc(${fraction} * (100% - 1.5rem) + 1.5rem)`}
					style:height={vertical ? `calc(${fraction} * (100% - 1.5rem) + 1.5rem)` : undefined}
				></span>
			{/if}
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				index={thumb.index}
				aria-label={thumbLabel}
				aria-valuetext={format(value)}
				class={[
					'flex cursor-grab items-center justify-center rounded-lg ring-ring/50 outline-hidden transition-shadow focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-active:cursor-grabbing',
					'after:rounded-full after:bg-(--thumb-line,white) after:shadow-[0_1px_2px_rgb(0_0_0/0.25)]',
					vertical
						? 'h-6 w-full after:h-1 after:w-10'
						: ['w-6 after:w-1', size === 'sm' ? 'h-6 after:h-3' : 'h-10 after:h-5']
				]}
			/>
			{#if !vertical}
				<SliderPrimitive.ThumbLabel
					index={thumb.index}
					position="top"
					aria-hidden="true"
					class="pointer-events-none mb-2 rounded-md bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground tabular-nums opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity group-hover/slider:opacity-100 group-has-focus-visible/slider:opacity-100 group-data-disabled/slider:hidden data-active:opacity-100"
				>
					{format(value)}
				</SliderPrimitive.ThumbLabel>
			{/if}
		{/each}
	{/snippet}
</SliderPrimitive.Root>
