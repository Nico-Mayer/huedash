import { live } from './live.svelte.ts';
import type { HomeGroup, HomeLight, HomeScene } from './server/hue/home.ts';

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

export function activeScene(group: HomeGroup): HomeScene | undefined {
	return group.scenes.find((scene) => (live.scenes.get(scene.id) ?? scene.active) !== 'inactive');
}

export function lightCounts(group: HomeGroup): { on: number; total: number; unreachable: number } {
	const unreachable = group.lights.filter((light) => !light.reachable).length;
	const on = group.lights.filter((light) => light.reachable && lightOn(light)).length;
	return { on, total: group.lights.length, unreachable };
}
