import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clampMirek, groupTarget, lightTarget } from './control-target.svelte.ts';
import { live } from './live.svelte.ts';
import type { HomeGroup, HomeLight } from './server/hue/home.ts';

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	live.lights.clear();
	live.groups.clear();
});

const light = (id: string, name: string, extra: Partial<HomeLight> = {}): HomeLight => ({
	id,
	name,
	on: true,
	brightness: 50,
	reachable: true,
	mirekRange: { minMirek: 153, maxMirek: 500 },
	color: true,
	mirek: 366,
	hueSaturation: null,
	product: null,
	swatch: null,
	...extra
});

const sent = () =>
	fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(String((init as RequestInit).body))]);

describe('lightTarget', () => {
	it('offers white and color for a color light', () => {
		const target = lightTarget(light('ceiling', 'Ceiling', { brightness: 70, mirek: 400 }));

		expect(target.name).toBe('Ceiling');
		expect(target.brightness).toBe(70);
		expect(target.mirek).toBe(400);
		expect(target.mirekRange).toEqual({ minMirek: 153, maxMirek: 500 });
		expect(target.color).toBe(true);
	});

	it('offers only white for a white-only light', () => {
		const target = lightTarget(light('counter', 'Counter', { color: false }));

		expect(target.mirekRange).not.toBeNull();
		expect(target.color).toBe(false);
	});

	it('keeps the range of the light', () => {
		const target = lightTarget(
			light('counter', 'Counter', { mirekRange: { minMirek: 153, maxMirek: 454 } })
		);

		expect(target.mirekRange).toEqual({ minMirek: 153, maxMirek: 454 });
	});

	it('offers neither for a plug', () => {
		const target = lightTarget(
			light('plug', 'Plug', { brightness: null, mirekRange: null, color: false })
		);

		expect(target.dimmable).toBe(false);
		expect(target.mirekRange).toBeNull();
		expect(target.color).toBe(false);
	});

	it('sends a command to the light', async () => {
		lightTarget(light('ceiling', 'Ceiling')).apply({ brightness: 40 });

		await expect.poll(() => sent()).toEqual([['/api/lights/ceiling', { brightness: 40 }]]);
	});

	it('shows a new color at once', () => {
		const target = lightTarget(light('ceiling', 'Ceiling'));

		target.apply({ color: { hue: 0, saturation: 100 } });

		expect(target.mirek).toBeNull();
		expect(target.hueSaturation).toEqual({ hue: 0, saturation: 100 });
	});
});

describe('groupTarget', () => {
	it('sends one group command', async () => {
		const group = {
			name: 'Kitchen',
			groupedLightId: 'grouped-kitchen',
			on: true,
			brightness: 60,
			colorTemperature: { minMirek: 153, maxMirek: 500 },
			color: true
		} as HomeGroup;

		groupTarget(group).apply({ on: true, mirek: 250 });

		await expect
			.poll(() => sent())
			.toEqual([['/api/groups/grouped-kitchen', { on: true, mirek: 250 }]]);
	});
});

describe('clampMirek', () => {
	it('keeps a value inside the range', () => {
		expect(clampMirek(455, { minMirek: 153, maxMirek: 454 })).toBe(454);
		expect(clampMirek(100, { minMirek: 153, maxMirek: 454 })).toBe(153);
		expect(clampMirek(300, { minMirek: 153, maxMirek: 454 })).toBe(300);
	});
});
