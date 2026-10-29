import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { HomeGroup, HomeLight } from '#lib/server/hue/home.ts';
import ColorControl from './ColorControl.svelte';
import ColorTemperatureControl from './ColorTemperatureControl.svelte';
import Controls from './Controls.svelte';
import LightCard from './LightCard.svelte';
import { groupTarget, lightsTarget } from '#lib/control-target.svelte.ts';
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
	mirekRange: { minMirek: 153, maxMirek: 500 },
	color: true,
	mirek: 366,
	hueSaturation: null
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

describe('Controls for a group', () => {
	it('turns the group off with one command', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByText('Off')).toBeInTheDocument();
		expect(sentBody()).toEqual({ url: '/api/groups/grouped-kitchen', body: { on: false } });
	});

	it('restores the switch and tells the user when the bridge refuses', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
		render(Controls, { control: groupTarget(kitchen) });

		await page.getByRole('switch', { name: 'Kitchen' }).click();

		await expect.element(page.getByText('On, 60 %')).toBeInTheDocument();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't change Kitchen"));
	});

	it('sends brightness only when the slider is released', async () => {
		render(Controls, { control: groupTarget(kitchen) });
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

describe('Controls tabs', () => {
	it('shows white and color as tabs', async () => {
		render(Controls, { control: groupTarget(kitchen) });

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
		render(Controls, { control: groupTarget({ ...kitchen, color: false }) });

		await expect.element(page.getByRole('tab')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('slider', { name: 'Kitchen color temperature' }))
			.toBeInTheDocument();
	});
});

describe('Controls for selected lights', () => {
	it('starts on the Color tab for a light that shows a color', async () => {
		render(Controls, {
			control: lightsTarget([{ ...light, mirek: null, hueSaturation: { hue: 0, saturation: 100 } }])
		});

		await expect
			.element(page.getByRole('tab', { name: 'Color' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('slider', { name: 'Ceiling hue' }))
			.toHaveAttribute('aria-valuenow', '0');
	});

	it('starts at the light white', async () => {
		render(Controls, { control: lightsTarget([{ ...light, mirek: 370 }]) });

		await expect
			.element(page.getByRole('slider', { name: 'Ceiling color temperature' }))
			.toHaveAttribute('aria-valuenow', '2700');
	});

	it('goes back to the room', async () => {
		const onBack = vi.fn();
		render(Controls, { control: lightsTarget([light]), onBack });

		await page.getByRole('button', { name: 'Back to room' }).click();

		expect(onBack).toHaveBeenCalled();
	});

	it('sends a light command, not a group command', async () => {
		render(Controls, { control: lightsTarget([light]) });

		await page.getByRole('switch', { name: 'Ceiling' }).click();

		expect(sentBody()).toEqual({ url: '/api/lights/ceiling', body: { on: false } });
	});
});

describe('ColorTemperatureControl', () => {
	it('covers the warm to cool range in kelvin', async () => {
		render(ColorTemperatureControl, {
			control: groupTarget(kitchen),
			range: kitchen.colorTemperature!
		});
		const slider = page.getByRole('slider', { name: 'Kitchen color temperature' });

		await expect.element(slider).toHaveAttribute('aria-valuemin', '2000');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '6536');
	});
});

describe('ColorControl', () => {
	it('sends hue and saturation as a color command', async () => {
		render(ColorControl, { control: groupTarget(kitchen) });
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
		render(Controls, { control: groupTarget(kitchen) });

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
