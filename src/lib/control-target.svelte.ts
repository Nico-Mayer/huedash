import {
	changeGroup,
	changeLight,
	groupBrightness,
	groupOn,
	lightBrightness,
	lightHueSaturation,
	lightMirek,
	lightOn,
	type Change
} from './group-state.svelte.ts';
import type { HueSaturation } from './live-updates.ts';
import type { HomeGroup, HomeLight, MirekRange } from './server/hue/home.ts';

export type ControlTarget = {
	readonly name: string;
	readonly on: boolean;
	readonly brightness: number;
	readonly mirekRange: MirekRange | null;
	readonly color: boolean;
	readonly mirek: number | null;
	readonly hueSaturation: HueSaturation | null;
	apply(change: Change): void;
};

export function clampMirek(mirek: number, { minMirek, maxMirek }: MirekRange): number {
	return Math.min(maxMirek, Math.max(minMirek, mirek));
}

export function groupTarget(group: HomeGroup): ControlTarget {
	return {
		name: group.name,
		get on() {
			return groupOn(group);
		},
		get brightness() {
			return groupBrightness(group);
		},
		mirekRange: group.colorTemperature,
		color: group.color,
		// The bridge does not report a group's white or color.
		mirek: null,
		hueSaturation: null,
		apply: (change) => changeGroup(group, change)
	};
}

function sharedRange(lights: HomeLight[]): MirekRange | null {
	if (lights.some((light) => !light.mirekRange)) return null;
	const ranges = lights.map((light) => light.mirekRange!);
	const range = {
		minMirek: Math.max(...ranges.map((r) => r.minMirek)),
		maxMirek: Math.min(...ranges.map((r) => r.maxMirek))
	};
	return range.minMirek <= range.maxMirek ? range : null;
}

// Current values come from the first light by name; commands go to every light.
export function lightsTarget(selected: HomeLight[]): ControlTarget {
	const lights = [...selected].sort((a, b) => a.name.localeCompare(b.name));
	const [first] = lights;
	return {
		name: lights.length === 1 ? first.name : `${lights.length} lights`,
		get on() {
			return lightOn(first);
		},
		get brightness() {
			return lightBrightness(first);
		},
		mirekRange: sharedRange(lights),
		color: lights.every((light) => light.color),
		get mirek() {
			return lightMirek(first);
		},
		get hueSaturation() {
			return lightHueSaturation(first);
		},
		apply: (change) => lights.forEach((light) => changeLight(light, change))
	};
}
