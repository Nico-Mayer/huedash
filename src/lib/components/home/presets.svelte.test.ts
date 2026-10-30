import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { groupTarget, lightTarget } from '#lib/control-target.svelte.ts';
import { live } from '#lib/live.svelte.ts';
import type { HomeGroup, HomeLight } from '#lib/server/hue/home.ts';
import Controls from './Controls.svelte';

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

const ceiling: HomeLight = {
	id: 'ceiling',
	name: 'Ceiling',
	on: false,
	brightness: 70,
	reachable: true,
	mirekRange: { minMirek: 153, maxMirek: 500 },
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	mirek: 366,
	hueSaturation: null,
	product: null,
	swatch: null
};

const counter: HomeLight = {
	...ceiling,
	id: 'counter',
	name: 'Counter',
	mirekRange: { minMirek: 153, maxMirek: 454 },
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: false
};

const kitchen = {
	name: 'Kitchen',
	groupedLightId: 'grouped-kitchen',
	on: false,
	brightness: 60,
	colorTemperature: { minMirek: 153, maxMirek: 500 },
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	scenes: []
} as unknown as HomeGroup;

const sent = () =>
	fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(String((init as RequestInit).body))]);

describe('presets for a group', () => {
	it('sends one group command for a brightness preset', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await page.getByRole('button', { name: '50 %' }).click();

		await expect
			.poll(sent)
			.toEqual([['/api/groups/grouped-kitchen', { on: true, brightness: 50 }]]);
	});

	it('sends Neutral as 250 mirek', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await page.getByRole('button', { name: 'Neutral' }).click();

		await expect.poll(sent).toEqual([['/api/groups/grouped-kitchen', { on: true, mirek: 250 }]]);
	});
});

describe('presets for a light', () => {
	it('sends a brightness preset to the light', async () => {
		render(Controls, { control: lightTarget(ceiling) });

		await page.getByRole('button', { name: '25 %' }).click();

		await expect.poll(sent).toEqual([['/api/lights/ceiling', { on: true, brightness: 25 }]]);
	});

	it('clamps Warm to the warmest white a light supports', async () => {
		render(Controls, { control: lightTarget(counter) });

		await page.getByRole('button', { name: 'Warm' }).click();

		await expect.poll(sent).toEqual([['/api/lights/counter', { on: true, mirek: 454 }]]);
	});
});
