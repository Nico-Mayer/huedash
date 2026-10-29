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
	<ul class="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4" aria-label="Scenes">
		{#each group.scenes as scene (scene.id)}
			{@const status = statusOf(scene)}
			<li class="relative">
				<button
					type="button"
					class={[
						'flex w-full flex-col gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted',
						status !== 'inactive' && 'border-primary'
					]}
					aria-pressed={status !== 'inactive'}
					onclick={() => recall(scene, 'active')}
				>
					<span
						class="h-10 w-full rounded-md border"
						style:background={strip(scene.colors)}
						aria-hidden="true"
					></span>
					<span class="flex items-center justify-between gap-2">
						<span class="truncate font-medium">{scene.name}</span>
						{#if status === 'static'}
							<Badge>Active</Badge>
						{:else if status === 'dynamic_palette'}
							<Badge>Playing</Badge>
						{/if}
					</span>
				</button>
				{#if scene.dynamic}
					<Button
						variant="secondary"
						size="icon-sm"
						class="absolute top-4 right-4"
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
