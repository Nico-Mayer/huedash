<script lang="ts">
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { toast } from 'svelte-sonner';
	import { sendCommand } from '#lib/commands.ts';
	import { Badge, badgeVariants } from '#lib/components/ui/badge/index.js';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { sceneStatus } from '#lib/group-state.svelte.ts';
	import { live } from '#lib/home.svelte.ts';
	import type { SceneStatus } from '#lib/live-updates.ts';
	import type { HomeGroup, HomeScene } from '#lib/server/hue/home.ts';
	import { cn } from '#lib/utils.js';

	let { group }: { group: HomeGroup } = $props();

	function strip(colors: string[]): string {
		if (colors.length === 0) return 'var(--muted)';
		if (colors.length === 1) return colors[0];
		return `linear-gradient(to right, ${colors.join(', ')})`;
	}

	async function recall(scene: HomeScene, mode: 'active' | 'static' | 'dynamic') {
		const started: SceneStatus = mode === 'dynamic' ? 'dynamic_palette' : 'static';
		const token = live.scenes.begin(
			group.id,
			Object.fromEntries(group.scenes.map((s) => [s.id, s.id === scene.id ? started : 'inactive']))
		);

		const revision = await sendCommand(
			{ kind: 'scenes', id: scene.id, name: scene.name },
			{ mode }
		);
		live.scenes.settle(group.id, token, revision, live.revision);
		if (revision !== null) return;
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
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3" aria-label="Scenes">
		{#each group.scenes as scene (scene.id)}
			{@const status = sceneStatus(group, scene)}
			{@const label = status === 'dynamic_palette' ? 'Playing' : 'Active'}
			<li class="relative">
				<button
					type="button"
					class={[
						'flex w-full cursor-pointer flex-col gap-2 rounded-xl border bg-card p-2 text-left hover:bg-muted',
						status !== 'inactive' && 'border-primary'
					]}
					aria-pressed={status !== 'inactive'}
					onclick={() => recall(scene, scene.dynamic ? 'dynamic' : 'active')}
				>
					<span
						class="h-6 w-full rounded-md border"
						style:background={strip(scene.colors)}
						aria-hidden="true"
					></span>
					<span
						class={[
							'flex min-h-6 items-center text-sm font-medium',
							status !== 'inactive' && 'pr-7'
						]}
					>
						<span class="truncate">{scene.name}</span>
					</span>
				</button>
				{#if status !== 'inactive'}
					{@const badgeClass = 'absolute right-2.25 bottom-2.25 size-6 p-0 [&>svg]:size-3.5!'}
					{#snippet icon()}
						{#if status === 'dynamic_palette'}
							<SparklesIcon aria-hidden="true" />
						{:else}
							<LightbulbIcon aria-hidden="true" />
						{/if}
						<span class="sr-only">{label}</span>
					{/snippet}
					{#if scene.dynamic}
						{@const next = status === 'dynamic_palette' ? 'static' : 'dynamic'}
						<button
							type="button"
							class={cn(badgeVariants(), badgeClass, 'cursor-pointer hover:bg-primary/80')}
							aria-label="{label}: switch {scene.name} to {next}"
							title="{label} - switch to {next}"
							onclick={() => recall(scene, next)}
						>
							{@render icon()}
						</button>
					{:else}
						<Badge class={cn(badgeClass, 'pointer-events-none')} title={label}>
							{@render icon()}
						</Badge>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
{/if}
