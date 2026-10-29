import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clampMirek, groupTarget, lightsTarget } from './control-target.svelte.ts';
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
	...extra
});

const sent = () =>
	fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(String((init as RequestInit).body))]);

describe('lightsTarget', () => {
	it('names one light or counts several', () => {
		expect(lightsTarget([light('ceiling', 'Ceiling')]).name).toBe('Ceiling');
		expect(lightsTarget([light('ceiling', 'Ceiling'), light('counter', 'Counter')]).name).toBe(
			'2 lights'
		);
	});

	it('starts at the first light by name', () => {
		const target = lightsTarget([
			light('counter', 'Counter', { brightness: 20, mirek: 250 }),
			light('ceiling', 'Ceiling', { brightness: 70, mirek: 400 })
		]);

		expect(target.brightness).toBe(70);
		expect(target.mirek).toBe(400);
	});

	it('limits white to the range every light supports', () => {
		const target = lightsTarget([
			light('ceiling', 'Ceiling'),
			light('counter', 'Counter', { mirekRange: { minMirek: 153, maxMirek: 454 } })
		]);

		expect(target.mirekRange).toEqual({ minMirek: 153, maxMirek: 454 });
	});

	it('offers white and color only when every light supports them', () => {
		const target = lightsTarget([
			light('ceiling', 'Ceiling'),
			light('plug', 'Plug', { mirekRange: null, color: false })
		]);

		expect(target.mirekRange).toBeNull();
		expect(target.color).toBe(false);
	});

	it('sends one command per light', async () => {
		lightsTarget([light('ceiling', 'Ceiling'), light('counter', 'Counter')]).apply({
			brightness: 40
		});

		await expect.poll(() => sent().length).toBe(2);
		expect(sent()).toEqual([
			['/api/lights/ceiling', { brightness: 40 }],
			['/api/lights/counter', { brightness: 40 }]
		]);
	});

	it('shows a new color at once', () => {
		const target = lightsTarget([light('ceiling', 'Ceiling')]);

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
