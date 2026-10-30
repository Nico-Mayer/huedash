import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/home.svelte.ts';
import type { HomeGroup } from '#lib/server/hue/home.ts';
import GroupSwitch from './GroupSwitch.svelte';

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast }));

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockImplementation(async () => Response.json({ revision: 1 }));
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
	lightIds: [],
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
		fetchMock.mockImplementation(async () => new Response(null, { status: 502 }));
		render(GroupSwitch, { group: kitchen });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).toBeChecked();
		expect(toast.error).toHaveBeenCalled();
	});

	it('follows live updates', async () => {
		const { rerender } = await render(GroupSwitch, { group: kitchen });

		await rerender({ group: { ...kitchen, on: false } });

		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).not.toBeChecked();
	});
});
