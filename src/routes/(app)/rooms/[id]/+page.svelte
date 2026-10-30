<script lang="ts">
	import GroupDetail from '#lib/components/home/GroupDetail.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<GroupDetail bridgeName={data.bridgeName} kind={data.kind} id={data.id} />
