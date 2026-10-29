import { xyz65 } from 'culori';

export type Xy = { x: number; y: number };

const round = (value: number) => Math.round(value * 10_000) / 10_000;

// Brightness is set separately, so the color is taken at full value.
export function hueSaturationToXy(hue: number, saturationPercent: number): Xy {
	const { x, y, z } = xyz65({ mode: 'hsv', h: hue, s: saturationPercent / 100, v: 1 });
	const sum = x + y + z;
	return { x: round(x / sum), y: round(y / sum) };
}
