<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-svh flex-col">
	<header class="border-b px-6 py-3 font-semibold">huedash</header>
	{@render children()}
</div>
