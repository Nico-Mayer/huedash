<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '#lib/utils.js';

	let {
		value,
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
</script>

<SliderPrimitive.Root
	type="single"
	{value}
	class={cn(
		'group/slider relative flex w-full cursor-pointer touch-none items-center select-none has-data-active:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			class={[
				'relative w-full grow overflow-hidden rounded-md bg-muted',
				size === 'lg' ? 'h-10' : 'h-6'
			]}
		>
			<SliderPrimitive.Range class="absolute h-full bg-primary" />
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				index={thumb.index}
				aria-label={thumbLabel}
				aria-valuetext={format(value)}
				class={[
					'block w-3 cursor-grab rounded-full border-2 border-primary bg-primary-foreground shadow-sm ring-ring/50 outline-hidden transition-shadow ring-inset focus-visible:ring-4 data-disabled:cursor-not-allowed data-active:cursor-grabbing',
					size === 'lg' ? 'h-7' : 'h-4.5'
				]}
			/>
			<SliderPrimitive.ThumbLabel
				index={thumb.index}
				position="top"
				aria-hidden="true"
				class="pointer-events-none mb-2 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground tabular-nums opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity group-hover/slider:opacity-100 group-has-focus-visible/slider:opacity-100 group-data-disabled/slider:hidden data-active:opacity-100"
			>
				{format(value)}
			</SliderPrimitive.ThumbLabel>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
