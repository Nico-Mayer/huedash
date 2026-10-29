<script lang="ts">
	import { Spinner } from '#lib/components/ui/spinner/index.js';

	let { connected }: { connected: boolean } = $props();
</script>

{#if !connected}
	<p
		class="flex items-center justify-center gap-2 border-b bg-muted px-6 py-2 text-sm text-muted-foreground"
		role="status"
	>
		<Spinner />
		Live updates paused. Reconnecting…
	</p>
{/if}
