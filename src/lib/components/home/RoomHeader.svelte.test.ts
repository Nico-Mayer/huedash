import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/live.svelte.ts';
import type { HomeGroup, HomeLight } from '#lib/server/hue/home.ts';
import '../../../routes/layout.css';
import RoomHeader from './RoomHeader.svelte';

vi.mock('$app/navigation', () => ({ refreshAll: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn() } }));

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	live.groups.clear();
	live.lights.clear();
	live.scenes.clear();
});

const light = (id: string, name: string, extra: Partial<HomeLight> = {}): HomeLight => ({
	id,
	name,
	on: true,
	brightness: 60,
	reachable: true,
	mirekRange: { minMirek: 153, maxMirek: 500 },
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	mirek: 366,
	hueSaturation: null,
	product: null,
	swatch: '#ff0000',
	...extra
});

const kitchen: HomeGroup = {
	kind: 'room',
	id: 'room-kitchen',
	name: 'Kitchen',
	groupedLightId: 'grouped-kitchen',
	on: true,
	brightness: 60,
	lights: [
		light('ceiling', 'Ceiling'),
		light('counter', 'Counter', { on: false }),
		light('plug', 'Plug', { reachable: false })
	],
	colorTemperature: { minMirek: 153, maxMirek: 500 },
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	scenes: [
		{
			id: 'scene-relax',
			name: 'Relax',
			colors: [],
			brightness: 56,
			dynamic: false,
			active: 'static'
		}
	]
};

describe('RoomHeader', () => {
	it('shows the name, scene, lights summary, and brightness', async () => {
		render(RoomHeader, { group: kitchen, onOpenColor: () => {} });

		await expect.element(page.getByRole('heading', { name: 'Kitchen' })).toBeInTheDocument();
		await expect
			.element(page.getByText('Relax · 1 of 3 lights on · 1 unreachable'))
			.toBeInTheDocument();
		await expect.element(page.getByRole('switch', { name: 'Kitchen' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('slider', { name: 'Kitchen brightness' }))
			.toHaveAttribute('aria-valuenow', '60');
		await expect.element(page.getByText('60 %', { exact: true }).last()).toBeVisible();
	});

	it('sends one group command when the slider is released', async () => {
		render(RoomHeader, { group: kitchen, onOpenColor: () => {} });

		(page.getByRole('slider', { name: 'Kitchen brightness' }).element() as HTMLElement).focus();
		await userEvent.keyboard('{End}');

		await expect
			.poll(() =>
				fetchMock.mock.calls.map(([url, init]) => [
					url,
					JSON.parse(String((init as RequestInit).body))
				])
			)
			.toContainEqual(['/api/groups/grouped-kitchen', { on: true, brightness: 100 }]);
	});

	it('opens the color and white dialog', async () => {
		const onOpenColor = vi.fn();
		render(RoomHeader, { group: kitchen, onOpenColor });

		await page.getByRole('button', { name: 'Color and white for Kitchen' }).click();

		expect(onOpenColor).toHaveBeenCalled();
	});

	it('shows a swatch for each color of a light that is on', async () => {
		render(RoomHeader, { group: kitchen, onOpenColor: () => {} });

		const button = page.getByRole('button', { name: 'Color and white for Kitchen' }).element();
		expect(button.querySelectorAll('[style*="--swatch"]')).toHaveLength(1);
	});

	it('hides the button without white or color', async () => {
		render(RoomHeader, {
			group: { ...kitchen, colorTemperature: null, color: false },
			onOpenColor: () => {}
		});

		await expect.element(page.getByRole('heading', { name: 'Kitchen' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /Color and white/ }))
			.not.toBeInTheDocument();
	});

	it('fills the brightness slider with the generic light color, muted when off', async () => {
		const light = getComputedStyle(document.documentElement).getPropertyValue('--light');
		const probe = document.createElement('span');
		probe.style.backgroundColor = light;
		document.body.append(probe);
		const amber = getComputedStyle(probe).backgroundColor;
		probe.remove();

		const on = await render(RoomHeader, { group: kitchen, onOpenColor: () => {} });
		const off = await render(RoomHeader, {
			group: { ...kitchen, id: 'room-off', groupedLightId: 'grouped-off', on: false },
			onOpenColor: () => {}
		});
		const fill = (container: HTMLElement) =>
			getComputedStyle(container.querySelector('[data-slider-fill]')!).backgroundColor;

		expect(fill(on.container)).toBe(amber);
		expect(fill(off.container)).not.toBe(amber);
	});
});
