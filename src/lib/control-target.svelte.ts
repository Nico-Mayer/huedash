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
	readonly dimmable: boolean;
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
		dimmable: true,
		mirekRange: group.colorTemperature,
		color: group.color,
		// The bridge does not report a group's white or color.
		mirek: null,
		hueSaturation: null,
		apply: (change) => changeGroup(group, change)
	};
}

export function lightTarget(light: HomeLight): ControlTarget {
	return {
		name: light.name,
		get on() {
			return lightOn(light);
		},
		get brightness() {
			return lightBrightness(light);
		},
		dimmable: light.brightness !== null,
		mirekRange: light.mirekRange,
		color: light.color,
		get mirek() {
			return lightMirek(light);
		},
		get hueSaturation() {
			return lightHueSaturation(light);
		},
		apply: (change) => changeLight(light, change)
	};
}
