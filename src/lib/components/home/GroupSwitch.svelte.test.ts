import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/live.svelte.ts';
import type { HomeGroup } from '#lib/server/hue/home.ts';
import GroupSwitch from './GroupSwitch.svelte';

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast }));

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
	toast.error.mockClear();
});

afterEach(() => {
	vi.unstubAllGlobals();
	live.groups.clear();
});

const kitchen: HomeGroup = {
	kind: 'room',
	id: 'room-kitchen',
	name: 'Kitchen',
	groupedLightId: 'grouped-kitchen',
	on: true,
	brightness: 60,
	lights: [],
	colorTemperature: null,
	whiteStops: null,
	color: false,
	scenes: []
};

describe('GroupSwitch', () => {
	it('turns the group off with one command', async () => {
		render(GroupSwitch, { group: kitchen });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).not.toBeChecked();
		const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
		expect(url).toBe('/api/groups/grouped-kitchen');
		expect(JSON.parse(String(init.body))).toEqual({ on: false });
	});

	it('restores the switch when the command fails', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
		render(GroupSwitch, { group: kitchen });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).toBeChecked();
		expect(toast.error).toHaveBeenCalled();
	});

	it('follows live updates', async () => {
		render(GroupSwitch, { group: kitchen });

		live.apply({ kind: 'group', id: 'grouped-kitchen', on: false });

		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).not.toBeChecked();
	});
});
