<script lang="ts">
	import { applyChange } from '#lib/commands.ts';
	import { groupOn } from '#lib/group-state.svelte.ts';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import type { HomeGroup } from '#lib/server/hue/home.ts';

	let { group }: { group: HomeGroup } = $props();

	let on = $derived(groupOn(group));

	function setOn(next: boolean) {
		const previous = on;
		on = next;
		applyChange(
			{ kind: 'groups', id: group.groupedLightId, name: group.name },
			{ on: next },
			() => (on = previous)
		);
	}
</script>

<Switch checked={on} onCheckedChange={setOn} aria-label={group.name} />
