import { hsv, rgb, xyz65 } from 'culori';
import type { HueSaturation } from '../../live-updates.ts';

export type Xy = { x: number; y: number };

const round = (value: number) => Math.round(value * 10_000) / 10_000;

// Brightness is set separately, so the color is taken at full value.
export function hueSaturationToXy(hue: number, saturationPercent: number): Xy {
	const { x, y, z } = xyz65({ mode: 'hsv', h: hue, s: saturationPercent / 100, v: 1 });
	const sum = x + y + z;
	return { x: round(x / sum), y: round(y / sum) };
}

// Scaled to full value, like hueSaturationToXy, so the two convert back and forth.
export function xyToHueSaturation({ x, y }: Xy): HueSaturation {
	const color = rgb({ mode: 'xyz65', x: x / y, y: 1, z: (1 - x - y) / y });
	const max = Math.max(color.r, color.g, color.b);
	const channel = (value: number) => Math.min(1, Math.max(0, value / max));
	const { h, s } = hsv({
		mode: 'rgb',
		r: channel(color.r),
		g: channel(color.g),
		b: channel(color.b)
	});
	return { hue: Math.round(h ?? 0), saturation: Math.round(s * 100) };
}
