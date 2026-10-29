<script lang="ts">
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';

	let { swatch, on }: { swatch: string | null; on: boolean } = $props();

	const lit = $derived(on && swatch !== null);
</script>

<span
	class={[
		'flex size-9 shrink-0 items-center justify-center rounded-full',
		lit
			? 'bg-(--swatch)/20 text-(--swatch) shadow-[0_0_12px_color-mix(in_oklab,var(--swatch)_50%,transparent)]'
			: 'bg-muted',
		!lit && (on ? 'text-foreground' : 'text-muted-foreground')
	]}
	style:--swatch={swatch}
	data-lit={lit}
	aria-hidden="true"
>
	<LightbulbIcon class="size-4" />
</span>
