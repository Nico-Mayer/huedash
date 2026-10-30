import { applyChange } from './commands.ts';
import { live, type StateChange } from './home.svelte.ts';
import type { HueSaturation, SceneStatus } from './live-updates.ts';
import type { Home, HomeGroup, HomeLight, HomeScene } from './server/hue/home.ts';

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
	const pending = live.lights.get(light.id);
	return pending && 'mirek' in pending ? (pending.mirek ?? null) : light.mirek;
}

export function lightHueSaturation(light: HomeLight): HueSaturation | null {
	const pending = live.lights.get(light.id);
	return pending && 'hueSaturation' in pending
		? (pending.hueSaturation ?? null)
		: light.hueSaturation;
}

const shining = (light: HomeLight) => light.reachable && lightOn(light);

// A light without a swatch (a plug, a dim-only bulb) still counts, as null.
export function onSwatches(lights: HomeLight[], limit = 3): (string | null)[] {
	const swatches = lights.filter(shining).map((light) => light.swatch);
	return swatches.filter((swatch, i) => swatches.indexOf(swatch) === i).slice(0, limit);
}

export function homeSummary(home: Home): string {
	const lights = Object.values(home.lights);
	return `${lights.filter(shining).length} of ${lights.length} lights on`;
}

export function sceneStatus(group: HomeGroup, scene: HomeScene): SceneStatus {
	return live.scenes.get(group.id)?.[scene.id] ?? scene.active;
}

export function activeScene(group: HomeGroup): HomeScene | undefined {
	return group.scenes.find((scene) => sceneStatus(group, scene) !== 'inactive');
}

export function lightCounts(lights: HomeLight[]): {
	on: number;
	total: number;
	unreachable: number;
} {
	const unreachable = lights.filter((light) => !light.reachable).length;
	const on = lights.filter(shining).length;
	return { on, total: lights.length, unreachable };
}

export function groupSummary(group: HomeGroup, lights: HomeLight[]): string {
	const scene = activeScene(group);
	if (scene) return scene.name;
	const { on, total } = lightCounts(lights);
	return on === 0 ? 'All off' : `${on} of ${total} on`;
}

export function lightsSummary(lights: HomeLight[]): string {
	const { on, total, unreachable } = lightCounts(lights);
	const summary = `${on} of ${total} lights on`;
	return unreachable > 0 ? `${summary} · ${unreachable} unreachable` : summary;
}

function stateOf({ on, brightness, mirek, color }: Change): StateChange {
	return {
		...(on !== undefined && { on }),
		...(brightness !== undefined && { brightness }),
		...(mirek !== undefined && { mirek, hueSaturation: null }),
		...(color && { mirek: null, hueSaturation: color })
	};
}

// Optimistic: every view of the group shows the change at once, and a failure restores it.
export function changeGroup(group: HomeGroup, change: Change) {
	const id = group.groupedLightId;
	const token = live.groups.begin(id, stateOf({ on: change.on, brightness: change.brightness }));
	applyChange({ kind: 'groups', id, name: group.name }, change, (revision) =>
		live.groups.settle(id, token, revision, live.revision)
	);
}

export function changeLight(light: HomeLight, change: Change) {
	const token = live.lights.begin(light.id, stateOf(change));
	applyChange({ kind: 'lights', id: light.id, name: light.name }, change, (revision) =>
		live.lights.settle(light.id, token, revision, live.revision)
	);
}
