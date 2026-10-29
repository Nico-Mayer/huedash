<script lang="ts">
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';

	type Theme = 'light' | 'dark' | 'system';

	const themes = [
		{ value: 'light', label: 'Light', icon: SunIcon },
		{ value: 'dark', label: 'Dark', icon: MoonIcon },
		{ value: 'system', label: 'System', icon: MonitorIcon }
	] satisfies { value: Theme; label: string; icon: typeof SunIcon }[];
</script>

<RadioGroup.Root
	value={userPrefersMode.current}
	onValueChange={(value) => setMode(value as Theme)}
	aria-label="Theme"
	class="grid-cols-3"
>
	{#each themes as theme (theme.value)}
		<Field.Label for="theme-{theme.value}">
			<Field.Field orientation="horizontal" class="justify-center">
				<RadioGroup.Item value={theme.value} id="theme-{theme.value}" class="sr-only absolute" />
				<Field.Title>
					<theme.icon />
					{theme.label}
				</Field.Title>
			</Field.Field>
		</Field.Label>
	{/each}
</RadioGroup.Root>
