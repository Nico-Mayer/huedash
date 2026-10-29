import { describe, expect, it } from 'vitest';
import { kelvinToMirek, mirekToKelvin } from '../../color-temperature.ts';
import { hueSaturationToXy, xyToHueSaturation } from './color.ts';

describe('hueSaturationToXy', () => {
	it.each([
		['red', 0, { x: 0.64, y: 0.33 }],
		['green', 120, { x: 0.3, y: 0.6 }],
		['blue', 240, { x: 0.15, y: 0.06 }]
	])('matches the sRGB %s primary', (_name, hue, expected) => {
		const xy = hueSaturationToXy(hue, 100);

		expect(xy.x).toBeCloseTo(expected.x, 2);
		expect(xy.y).toBeCloseTo(expected.y, 2);
	});

	it('gives the D65 white point without saturation', () => {
		const xy = hueSaturationToXy(0, 0);

		expect(xy.x).toBeCloseTo(0.3127, 3);
		expect(xy.y).toBeCloseTo(0.329, 3);
	});
});

describe('color temperature', () => {
	it.each([2700, 6500])('round-trips %i K through mirek', (kelvin) => {
		expect(Math.abs(mirekToKelvin(kelvinToMirek(kelvin)) - kelvin)).toBeLessThan(20);
	});

	it('maps the Hue range ends', () => {
		expect(mirekToKelvin(153)).toBe(6536);
		expect(mirekToKelvin(500)).toBe(2000);
	});
});

describe('xyToHueSaturation', () => {
	it.each([
		[0, 100],
		[120, 100],
		[240, 100],
		[30, 50]
	])('turns hue %i and saturation %i into xy and back', (hue, saturation) => {
		const back = xyToHueSaturation(hueSaturationToXy(hue, saturation));

		expect(back.hue).toBeCloseTo(hue, -1);
		expect(back.saturation).toBeCloseTo(saturation, -1);
	});

	it('gives no saturation for the white point', () => {
		expect(xyToHueSaturation({ x: 0.3127, y: 0.329 }).saturation).toBeLessThan(2);
	});
});
