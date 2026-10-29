import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { HomeGroup, HomeLight } from '#lib/server/hue/home.ts';
import ColorControl from './ColorControl.svelte';
import ColorTemperatureControl from './ColorTemperatureControl.svelte';
import GroupControls from './GroupControls.svelte';
import GroupInspector from './GroupInspector.svelte';
import LightCard from './LightCard.svelte';
import { live } from '#lib/live.svelte.ts';

vi.mock('$app/navigation', () => ({ refreshAll: vi.fn() }));
vi.mock('$app/paths', () => ({
	resolve: (route: string, params?: { id: string }) =>
		route.replace('/(app)', '').replace('[id]', params?.id ?? '')
}));

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
	live.lights.clear();
});

const light: HomeLight = {
	id: 'ceiling',
	name: 'Ceiling',
	on: true,
	brightness: 70,
	reachable: true,
	colorTemperature: true,
	color: true
};

const kitchen: HomeGroup = {
	kind: 'room',
	id: 'room-kitchen',
	name: 'Kitchen',
	groupedLightId: 'grouped-kitchen',
	on: true,
	brightness: 60,
	lights: [light],
	colorTemperature: { minMirek: 153, maxMirek: 500 },
	color: true,
	scenes: []
};

function sentBody() {
	const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
	return { url, body: JSON.parse(String(init.body)) };
}

describe('GroupControls', () => {
	it('turns the group off with one command', async () => {
		render(GroupControls, { group: kitchen });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByText('Off')).toBeInTheDocument();
		expect(sentBody()).toEqual({ url: '/api/groups/grouped-kitchen', body: { on: false } });
	});

	it('restores the switch and tells the user when the bridge refuses', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
		render(GroupControls, { group: kitchen });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByText('On, 60 %')).toBeInTheDocument();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't change Kitchen"));
	});

	it('sends brightness only when the slider is released', async () => {
		render(GroupControls, { group: kitchen });
		const slider = page.getByRole('slider', { name: 'Kitchen brightness' });

		(slider.element() as HTMLElement).focus();
		expect(fetchMock).toHaveBeenCalledTimes(0);

		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
		expect(sentBody().body).toEqual({ on: true, brightness: 61 });
	});
});

describe('LightCard', () => {
	it('switches one light', async () => {
		render(LightCard, { light });

		await page.getByRole('switch', { name: 'Ceiling' }).click();

		expect(sentBody()).toEqual({ url: '/api/lights/ceiling', body: { on: false } });
	});

	it('shows an unreachable light with disabled controls', async () => {
		render(LightCard, { light: { ...light, reachable: false } });

		await expect.element(page.getByText('Unreachable')).toBeInTheDocument();
		await expect.element(page.getByRole('switch', { name: 'Ceiling' })).toBeDisabled();
	});

	it('shows only a switch for a light without dimming', async () => {
		render(LightCard, { light: { ...light, brightness: null } });

		await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
	});
});

describe('GroupInspector', () => {
	it('shows white and color as tabs', async () => {
		render(GroupInspector, { group: kitchen });

		await expect
			.element(page.getByRole('tab', { name: 'White' }))
			.toHaveAttribute('aria-selected', 'true');
		await page.getByRole('tab', { name: 'Color' }).click();

		await expect
			.element(page.getByRole('slider', { name: 'Kitchen saturation' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('slider', { name: 'Kitchen color temperature' }))
			.not.toBeInTheDocument();
	});

	it('shows only the white control without color', async () => {
		render(GroupInspector, { group: { ...kitchen, color: false } });

		await expect.element(page.getByRole('tab')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('slider', { name: 'Kitchen color temperature' }))
			.toBeInTheDocument();
	});
});

describe('ColorTemperatureControl', () => {
	it('covers the warm to cool range in kelvin', async () => {
		render(ColorTemperatureControl, { group: kitchen, range: kitchen.colorTemperature! });
		const slider = page.getByRole('slider', { name: 'Kitchen color temperature' });

		await expect.element(slider).toHaveAttribute('aria-valuemin', '2000');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '6536');
	});
});

describe('ColorControl', () => {
	it('sends hue and saturation as a color command', async () => {
		render(ColorControl, { group: kitchen });
		const slider = page.getByRole('slider', { name: 'Kitchen saturation' });

		(slider.element() as HTMLElement).focus();
		await userEvent.keyboard('{End}');

		await expect.poll(() => fetchMock.mock.calls.length).toBeGreaterThan(0);
		expect(sentBody().body).toEqual({ on: true, color: { hue: 30, saturation: 100 } });
	});
});

describe('live updates', () => {
	afterEach(() => {
		live.groups.clear();
		live.lights.clear();
	});

	it('shows a group change from the bridge without reloading', async () => {
		render(GroupControls, { group: kitchen });

		live.apply({ kind: 'group', id: 'grouped-kitchen', on: false });

		await expect.element(page.getByText('Off')).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows a light change from the bridge', async () => {
		render(LightCard, { light });

		live.apply({ kind: 'light', id: 'ceiling', brightness: 20 });

		await expect.element(page.getByText('On, 20 %')).toBeInTheDocument();
	});
});
