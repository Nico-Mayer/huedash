import { applyChange } from './commands.ts';
import { live } from './live.svelte.ts';
import type { HueSaturation, StateUpdate } from './live-updates.ts';
import type { HomeGroup, HomeLight, HomeScene } from './server/hue/home.ts';

export type Change = { on?: boolean; brightness?: number; mirek?: number; color?: HueSaturation };

export function groupOn(group: HomeGroup): boolean {
	return live.groups.get(group.groupedLightId)?.on ?? group.on;
}

export function groupBrightness(group: HomeGroup): number {
	return live.groups.get(group.groupedLightId)?.brightness ?? group.brightness;
}

export function lightOn(light: HomeLight): boolean {
	return live.lights.get(light.id)?.on ?? light.on;
}

export function lightBrightness(light: HomeLight): number {
	return live.lights.get(light.id)?.brightness ?? light.brightness ?? 100;
}

export function lightMirek(light: HomeLight): number | null {
	const override = live.lights.get(light.id);
	return override && 'mirek' in override ? (override.mirek ?? null) : light.mirek;
}

export function lightHueSaturation(light: HomeLight): HueSaturation | null {
	const override = live.lights.get(light.id);
	return override && 'hueSaturation' in override
		? (override.hueSaturation ?? null)
		: light.hueSaturation;
}

export function activeScene(group: HomeGroup): HomeScene | undefined {
	return group.scenes.find((scene) => (live.scenes.get(scene.id) ?? scene.active) !== 'inactive');
}

export function lightCounts(group: HomeGroup): { on: number; total: number; unreachable: number } {
	const unreachable = group.lights.filter((light) => !light.reachable).length;
	const on = group.lights.filter((light) => light.reachable && lightOn(light)).length;
	return { on, total: group.lights.length, unreachable };
}

export function groupSummary(group: HomeGroup): string {
	const scene = activeScene(group);
	if (scene) return scene.name;
	const { on, total } = lightCounts(group);
	return on === 0 ? 'All off' : `${on} of ${total} on`;
}

export function lightsSummary(group: HomeGroup): string {
	const { on, total, unreachable } = lightCounts(group);
	const summary = `${on} of ${total} lights on`;
	return unreachable > 0 ? `${summary} · ${unreachable} unreachable` : summary;
}

// Optimistic: every view of the group shows the change at once, and a failure restores it.
export function changeGroup(group: HomeGroup, change: Change) {
	const id = group.groupedLightId;
	const previous = live.groups.get(id);
	live.apply({ kind: 'group', id, ...stateOf({ on: change.on, brightness: change.brightness }) });
	applyChange({ kind: 'groups', id, name: group.name }, change, () => {
		if (previous) live.groups.set(id, previous);
		else live.groups.delete(id);
	});
}

function stateOf({ on, brightness, mirek, color }: Change): Omit<StateUpdate, 'id'> {
	return {
		...(on !== undefined && { on }),
		...(brightness !== undefined && { brightness }),
		...(mirek !== undefined && { mirek, hueSaturation: null }),
		...(color && { mirek: null, hueSaturation: color })
	};
}

export function changeLight(light: HomeLight, change: Change) {
	const previous = live.lights.get(light.id);
	live.apply({ kind: 'light', id: light.id, ...stateOf(change) });
	applyChange({ kind: 'lights', id: light.id, name: light.name }, change, () => {
		if (previous) live.lights.set(light.id, previous);
		else live.lights.delete(light.id);
	});
}
