<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import type { ControlTarget } from '#lib/control-target.svelte.ts';
	import { IsMobile } from '#lib/hooks/is-mobile.svelte.js';
	import Controls from './Controls.svelte';

	let {
		control,
		description,
		open,
		onOpenChange
	}: {
		control: ControlTarget | null;
		description?: string;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	} = $props();

	const narrow = new IsMobile();
</script>

{#if narrow.current}
	<Sheet.Root {open} {onOpenChange}>
		<Sheet.Content side="bottom" class="max-h-[85svh] overflow-y-auto">
			{#if control}
				<Sheet.Header>
					<Sheet.Title>{control.name}</Sheet.Title>
					{#if description}
						<Sheet.Description>{description}</Sheet.Description>
					{/if}
				</Sheet.Header>
				<Controls {control} class="px-6 pb-6" />
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Dialog.Root {open} {onOpenChange}>
		<Dialog.Content class="max-h-[90svh] overflow-y-auto">
			{#if control}
				<Dialog.Header>
					<Dialog.Title>{control.name}</Dialog.Title>
					{#if description}
						<Dialog.Description>{description}</Dialog.Description>
					{/if}
				</Dialog.Header>
				<Controls {control} />
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{/if}
