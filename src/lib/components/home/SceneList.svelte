<script lang="ts">
	import PlayIcon from '@lucide/svelte/icons/play';
	import { toast } from 'svelte-sonner';
	import { sendCommand } from '#lib/commands.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { live } from '#lib/live.svelte.ts';
	import type { SceneStatus } from '#lib/live-updates.ts';
	import type { HomeGroup, HomeScene } from '#lib/server/hue/home.ts';

	// The live update can arrive shortly after the command succeeds.
	const CONFIRM_MS = 2000;

	let { group }: { group: HomeGroup } = $props();

	let pending = $state<Record<string, SceneStatus>>({});

	const statusOf = (scene: HomeScene): SceneStatus =>
		pending[scene.id] ?? live.scenes.get(scene.id) ?? scene.active;

	function strip(colors: string[]): string {
		if (colors.length === 0) return 'var(--muted)';
		if (colors.length === 1) return colors[0];
		return `linear-gradient(to right, ${colors.join(', ')})`;
	}

	async function recall(scene: HomeScene, mode: 'active' | 'dynamic') {
		const started: SceneStatus = mode === 'dynamic' ? 'dynamic_palette' : 'static';
		pending = Object.fromEntries(
			group.scenes.map((s) => [s.id, s.id === scene.id ? started : 'inactive'])
		);

		if (await sendCommand({ kind: 'scenes', id: scene.id, name: scene.name }, { mode })) {
			setTimeout(() => (pending = {}), CONFIRM_MS);
			return;
		}
		pending = {};
		toast.error(`Couldn't start ${scene.name}. Check that the bridge is on, then try again.`);
	}
</script>

{#if group.scenes.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>No scenes yet</Empty.Title>
			<Empty.Description>Create scenes for {group.name} in the Hue app.</Empty.Description>
		</Empty.Header>
	</Empty.Root>
{:else}
	<ul class="flex flex-col gap-2" aria-label="Scenes">
		{#each group.scenes as scene (scene.id)}
			{@const status = statusOf(scene)}
			<li class="flex items-center gap-2">
				<button
					type="button"
					class="flex flex-1 items-center gap-3 rounded-lg border p-2 text-left hover:bg-muted"
					aria-pressed={status !== 'inactive'}
					onclick={() => recall(scene, 'active')}
				>
					<span
						class="h-8 w-12 shrink-0 rounded-md border"
						style:background={strip(scene.colors)}
						aria-hidden="true"
					></span>
					<span class="flex-1 font-medium">{scene.name}</span>
					{#if status === 'static'}
						<Badge>Active</Badge>
					{:else if status === 'dynamic_palette'}
						<Badge>Playing</Badge>
					{/if}
				</button>
				{#if scene.dynamic}
					<Button
						variant="outline"
						size="icon"
						aria-label="Play {scene.name}"
						onclick={() => recall(scene, 'dynamic')}
					>
						<PlayIcon />
					</Button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
