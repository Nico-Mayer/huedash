<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '#lib/utils.js';

	let {
		value,
		min = 0,
		max = 100,
		size = 'lg',
		format,
		thumbLabel,
		class: className,
		...restProps
	}: Omit<SliderPrimitive.RootProps, 'type' | 'value' | 'onValueChange' | 'onValueCommit'> & {
		value: number;
		size?: 'sm' | 'lg';
		format: (value: number) => string;
		thumbLabel: string;
		onValueChange?: (value: number) => void;
		onValueCommit?: (value: number) => void;
	} = $props();

	const fraction = $derived(max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0);
</script>

<SliderPrimitive.Root
	type="single"
	{value}
	{min}
	{max}
	class={cn(
		'group/slider relative flex w-full cursor-pointer touch-none items-center select-none has-data-active:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			class={[
				'relative w-full grow overflow-hidden rounded-lg bg-muted',
				size === 'lg' ? 'h-10' : 'h-6'
			]}
		>
			<!-- Ends at the right edge of the thumb, which bits-ui keeps inside the track. -->
			<span
				class="absolute inset-y-0 left-0 rounded-lg bg-primary"
				style:width="calc({fraction} * (100% - 1.5rem) + 1.5rem)"
			></span>
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				index={thumb.index}
				aria-label={thumbLabel}
				aria-valuetext={format(value)}
				class={[
					'flex w-6 cursor-grab items-center justify-center rounded-lg ring-ring/50 outline-hidden transition-shadow focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-active:cursor-grabbing',
					'after:w-1 after:rounded-full after:bg-primary-foreground',
					size === 'lg' ? 'h-10 after:h-5' : 'h-6 after:h-3'
				]}
			/>
			<SliderPrimitive.ThumbLabel
				index={thumb.index}
				position="top"
				aria-hidden="true"
				class="pointer-events-none mb-2 rounded-md bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground tabular-nums opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity group-hover/slider:opacity-100 group-has-focus-visible/slider:opacity-100 group-data-disabled/slider:hidden data-active:opacity-100"
			>
				{format(value)}
			</SliderPrimitive.ThumbLabel>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
