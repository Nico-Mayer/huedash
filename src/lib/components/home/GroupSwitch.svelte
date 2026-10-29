<script lang="ts">
	import { changeGroup, groupOn } from '#lib/group-state.svelte.ts';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import type { HomeGroup } from '#lib/server/hue/home.ts';

	let { group }: { group: HomeGroup } = $props();
</script>

<Switch
	checked={groupOn(group)}
	onCheckedChange={(on) => changeGroup(group, { on })}
	aria-label={group.name}
/>
