import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/home.svelte.ts';
import type { HomeGroup, HomeScene } from '#lib/server/hue/home.ts';
import '../../../routes/layout.css';
import SceneList from './SceneList.svelte';

vi.mock('$app/navigation', () => ({ refreshAll: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (route: string) => route }));

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
	live.scenes.clear();
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
	scenes: [
		{
			id: 'scene-relax',
			name: 'Relax',
			colors: ['#ffaa55'],
			dynamic: false,
			active: 'inactive'
		},
		{
			id: 'scene-tropical',
			name: 'Tropical',
			colors: ['#ff0000', '#00ff00'],
			dynamic: true,
			active: 'inactive'
		}
	]
};

function withActive(id: string, active: HomeScene['active']): HomeGroup {
	return {
		...kitchen,
		scenes: kitchen.scenes.map((scene) => (scene.id === id ? { ...scene, active } : scene))
	};
}

function sent() {
	const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
	return { url, body: JSON.parse(String(init.body)) };
}

describe('SceneList', () => {
	it('recalls a scene without a palette and marks it active at once', async () => {
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: /Relax/ }).click();

		await expect.element(page.getByText('Active')).toBeInTheDocument();
		expect(sent()).toEqual({ url: '/api/scenes/scene-relax', body: { mode: 'active' } });
	});

	it('plays a scene with a palette', async () => {
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: /Tropical/ }).click();

		await expect.element(page.getByText('Playing')).toBeInTheDocument();
		expect(sent()).toEqual({ url: '/api/scenes/scene-tropical', body: { mode: 'dynamic' } });
	});

	it('switches a playing scene to static with its badge', async () => {
		render(SceneList, { group: withActive('scene-tropical', 'dynamic_palette') });

		await page.getByRole('button', { name: 'Playing: switch Tropical to static' }).click();

		await expect.element(page.getByText('Active')).toBeInTheDocument();
		expect(sent().body).toEqual({ mode: 'static' });
	});

	it('plays a static scene again with its badge', async () => {
		render(SceneList, { group: withActive('scene-tropical', 'static') });

		await page.getByRole('button', { name: 'Active: switch Tropical to dynamic' }).click();

		await expect.element(page.getByText('Playing')).toBeInTheDocument();
		expect(sent().body).toEqual({ mode: 'dynamic' });
	});

	it('shows a badge that does not switch for a scene without a palette', async () => {
		render(SceneList, { group: withActive('scene-relax', 'static') });

		await expect.element(page.getByText('Active')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /^Active/ })).not.toBeInTheDocument();
	});

	it('restores the state and tells the user when the bridge refuses', async () => {
		fetchMock.mockImplementation(async () => new Response(null, { status: 502 }));
		render(SceneList, { group: kitchen });

		await page.getByRole('button', { name: /Relax/ }).click();

		await expect.element(page.getByText('Active')).not.toBeInTheDocument();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't start Relax"));
	});

	it('shows a scene started elsewhere', async () => {
		const { rerender } = await render(SceneList, { group: kitchen });

		await rerender({ group: withActive('scene-tropical', 'dynamic_palette') });

		await expect.element(page.getByText('Playing')).toBeInTheDocument();
	});

	it('explains how to get scenes when there are none', async () => {
		render(SceneList, { group: { ...kitchen, scenes: [] } });

		await expect.element(page.getByText('No scenes yet')).toBeInTheDocument();
	});
});

describe('SceneList cards', () => {
	it('shows no brightness and no play button', async () => {
		render(SceneList, { group: kitchen });

		await expect.element(page.getByRole('list', { name: 'Scenes' })).toBeInTheDocument();
		expect(page.getByRole('list', { name: 'Scenes' }).element().textContent).not.toContain('%');
		await expect.element(page.getByRole('button', { name: /Play/ })).not.toBeInTheDocument();
	});

	it('puts the badge below the color strip', async () => {
		render(SceneList, { group: withActive('scene-tropical', 'dynamic_palette') });

		const card = page.getByRole('button', { name: /^Tropical/ }).element();
		const strip = card.firstElementChild!.getBoundingClientRect();
		const badge = page
			.getByRole('button', { name: /^Playing/ })
			.element()
			.getBoundingClientRect();
		expect(badge.top).toBeGreaterThanOrEqual(strip.bottom);
		expect(badge.right).toBeLessThanOrEqual(card.getBoundingClientRect().right);
	});

	it('shows a pointer on the card and the badge toggle', async () => {
		render(SceneList, { group: withActive('scene-tropical', 'dynamic_palette') });

		const card = page.getByRole('button', { name: /Relax/ }).element();
		const badge = page.getByRole('button', { name: /^Playing/ }).element();
		expect(getComputedStyle(card).cursor).toBe('pointer');
		expect(getComputedStyle(badge).cursor).toBe('pointer');
	});
});
