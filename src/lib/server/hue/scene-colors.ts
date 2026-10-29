import chroma from 'chroma-js';
import { formatHex, rgb } from 'culori';
import { mirekToKelvin } from '../../color-temperature.ts';
import type { Xy } from './color.ts';

const MAX_COLORS = 5;

type SceneAction = {
	action: { color?: { xy?: Xy }; color_temperature?: { mirek?: number | null } };
};

// Scaled to full brightness: the strip shows each color, not how dim the scene is.
export function xyToHex({ x, y }: Xy): string {
	const color = rgb({ mode: 'xyz65', x: x / y, y: 1, z: (1 - x - y) / y });
	const max = Math.max(color.r, color.g, color.b);
	const channel = (value: number) => Math.min(1, Math.max(0, value / max));
	return formatHex({ mode: 'rgb', r: channel(color.r), g: channel(color.g), b: channel(color.b) });
}

export const mirekToHex = (mirek: number) => chroma.temperature(mirekToKelvin(mirek)).hex();

// A light shows either a white (valid mirek) or a color (xy); lights with neither have no swatch.
export function swatchOf(mirek: number | null, xy: Xy | undefined): string | null {
	if (mirek !== null) return mirekToHex(mirek);
	return xy ? xyToHex(xy) : null;
}

export function sceneColors(actions: SceneAction[]): string[] {
	const colors = actions.flatMap(({ action }) => {
		if (action.color?.xy) return [xyToHex(action.color.xy)];
		if (action.color_temperature?.mirek) return [mirekToHex(action.color_temperature.mirek)];
		return [];
	});
	return [...new Set(colors)].slice(0, MAX_COLORS);
}
