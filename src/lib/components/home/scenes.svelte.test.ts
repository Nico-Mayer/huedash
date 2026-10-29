import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/live.svelte.ts';
import type { HomeGroup } from '#lib/server/hue/home.ts';
import Controls from './Controls.svelte';
import { groupTarget } from '#lib/control-target.svelte.ts';
import SceneList from './SceneList.svelte';

vi.mock('$app/navigation', () => ({ refreshAll: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (route: string) => route }));

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
	live.scenes.clear();
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
	color: false,
	scenes: [
		{
			id: 'scene-relax',
			name: 'Relax',
			colors: ['#ffaa55'],
			brightness: 56,
			dynamic: false,
			active: 'inactive'
		},
		{
			id: 'scene-tropical',
			name: 'Tropical',
			colors: ['#ff0000', '#00ff00'],
			brightness: null,
			dynamic: true,
			active: 'inactive'
		}
	]
};

function sent() {
	const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
	return { url, body: JSON.parse(String(init.body)) };
}

describe('SceneList', () => {
	it('recalls a scene and marks it active at once', async () => {
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: /Relax/ }).click();

		await expect.element(page.getByText('Active')).toBeInTheDocument();
		expect(sent()).toEqual({ url: '/api/scenes/scene-relax', body: { mode: 'active' } });
	});

	it('offers play only for scenes with a palette', async () => {
		render(SceneList, { group: kitchen });

		await expect.element(page.getByRole('button', { name: 'Play Tropical' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Play Relax' })).not.toBeInTheDocument();
	});

	it('plays a scene dynamically', async () => {
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: 'Play Tropical' }).click();

		await expect.element(page.getByText('Playing')).toBeInTheDocument();
		expect(sent().body).toEqual({ mode: 'dynamic' });
	});

	it('restores the state and tells the user when the bridge refuses', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: /Relax/ }).click();

		await expect.element(page.getByText('Active')).not.toBeInTheDocument();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't start Relax"));
	});

	it('shows a scene started elsewhere', async () => {
		render(SceneList, { group: kitchen });

		live.apply({ kind: 'scene', id: 'scene-tropical', active: 'dynamic_palette' });

		await expect.element(page.getByText('Playing')).toBeInTheDocument();
	});

	it('explains how to get scenes when there are none', async () => {
		render(SceneList, { group: { ...kitchen, scenes: [] } });

		await expect.element(page.getByText('No scenes yet')).toBeInTheDocument();
	});
});

describe('Controls with a scene', () => {
	it('shows the active scene name', async () => {
		render(Controls, { control: groupTarget(kitchen), scene: 'Relax' });

		await expect.element(page.getByText('Relax, 60 %')).toBeInTheDocument();
	});
});
