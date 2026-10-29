import { describe, expect, it } from 'vitest';
import { mirekToHex, sceneColors, xyToHex } from './scene-colors.ts';

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('xyToHex', () => {
	it('turns the sRGB red primary into full red', () => {
		expect(xyToHex({ x: 0.64, y: 0.33 })).toBe('#ff0000');
	});

	it('turns the D65 white point into white', () => {
		const [r, g, b] = channels(xyToHex({ x: 0.3127, y: 0.329 }));
		expect(Math.min(r, g, b)).toBeGreaterThan(250);
	});
});

describe('mirekToHex', () => {
	it('makes warm white more red than blue and cool white more blue than warm', () => {
		const [warmR, , warmB] = channels(mirekToHex(454));
		const [, , coolB] = channels(mirekToHex(153));

		expect(warmR).toBeGreaterThan(warmB);
		expect(coolB).toBeGreaterThan(warmB);
	});
});

describe('sceneColors', () => {
	it('collects colors from xy and color temperature actions in order', () => {
		const colors = sceneColors([
			{ action: { color: { xy: { x: 0.64, y: 0.33 } } } },
			{ action: { color_temperature: { mirek: 300 } } }
		]);

		expect(colors).toEqual(['#ff0000', mirekToHex(300)]);
	});

	it('removes duplicates and keeps at most five colors', () => {
		const actions = [153, 153, 200, 250, 300, 350, 400].map((mirek) => ({
			action: { color_temperature: { mirek } }
		}));

		expect(sceneColors(actions)).toHaveLength(5);
		expect(new Set(sceneColors(actions)).size).toBe(5);
	});

	it('skips actions without color', () => {
		expect(
			sceneColors([{ action: {} }, { action: { color_temperature: { mirek: null } } }])
		).toEqual([]);
	});
});
