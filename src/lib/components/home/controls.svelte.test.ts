import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { HomeGroup, HomeLight } from '#lib/server/hue/home.ts';
import ColorControl from './ColorControl.svelte';
import '../../../routes/layout.css';
import Controls from './Controls.svelte';
import LightCard from './LightCard.svelte';
import { groupTarget, lightTarget } from '#lib/control-target.svelte.ts';
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
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	mirek: 366,
	hueSaturation: null,
	product: null,
	swatch: null
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
	whiteStops: ['#ff8b14', '#ffd6aa', '#dce6ff'],
	color: true,
	scenes: []
};

function sentBody() {
	const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
	return { url, body: JSON.parse(String(init.body)) };
}

describe('Controls for a group', () => {
	it('turns the group off with the power button', async () => {
		render(Controls, { control: groupTarget(kitchen) });
		const power = page.getByRole('button', { name: 'Power' });
		await expect.element(power).toHaveAttribute('aria-pressed', 'true');

		await power.click();

		await expect.element(page.getByText('Off')).toBeInTheDocument();
		await expect.element(power).toHaveAttribute('aria-pressed', 'false');
		expect(sentBody()).toEqual({ url: '/api/groups/grouped-kitchen', body: { on: false } });
	});

	it('restores the power button and tells the user when the bridge refuses', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
		render(Controls, { control: groupTarget(kitchen) });

		await page.getByRole('button', { name: 'Power' }).click();

		await expect.element(page.getByText('60 %', { exact: true })).toBeInTheDocument();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Couldn't change Kitchen"));
	});

	it('sends brightness only when the slider is released', async () => {
		render(Controls, { control: groupTarget(kitchen) });
		const slider = page.getByRole('slider', { name: 'Kitchen brightness' });

		(slider.element() as HTMLElement).focus();
		expect(fetchMock).toHaveBeenCalledTimes(0);

		await userEvent.keyboard('{ArrowUp}');
		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
		expect(sentBody().body).toEqual({ on: true, brightness: 61 });
	});

	it('moves the brightness and the value to a live change', async () => {
		render(Controls, { control: groupTarget(kitchen) });
		const slider = page.getByRole('slider', { name: 'Kitchen brightness' });

		live.apply({ kind: 'group', id: 'grouped-kitchen', brightness: 30 });

		await expect.element(slider).toHaveAttribute('aria-valuenow', '30');
		await expect.element(page.getByText('30 %', { exact: true })).toBeInTheDocument();
	});
});

describe('LightCard', () => {
	it('switches one light', async () => {
		render(LightCard, { light, onOpen: () => {} });

		await page.getByRole('switch', { name: 'Ceiling' }).click();

		expect(sentBody()).toEqual({ url: '/api/lights/ceiling', body: { on: false } });
	});

	it('shows an unreachable light with disabled controls', async () => {
		render(LightCard, { light: { ...light, reachable: false }, onOpen: () => {} });

		await expect.element(page.getByText('Unreachable')).toBeInTheDocument();
		await expect.element(page.getByRole('switch', { name: 'Ceiling' })).toBeDisabled();
	});

	it('shows only a switch for a light without dimming', async () => {
		render(LightCard, { light: { ...light, brightness: null }, onOpen: () => {} });

		await expect.element(page.getByRole('slider')).not.toBeInTheDocument();
	});
});

describe('Controls modes', () => {
	const mode = (name: string) => page.getByRole('radio', { name });

	it('opens on brightness and offers color and white', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await expect.element(mode('Brightness')).toHaveAttribute('aria-checked', 'true');
		await expect.element(mode('Color')).toBeInTheDocument();
		await expect.element(mode('White')).toBeInTheDocument();
		await expect.element(page.getByRole('slider', { name: 'Kitchen brightness' })).toBeVisible();
		await expect.element(page.getByText('60 %', { exact: true })).toBeInTheDocument();
	});

	it('shows the color pad and keeps brightness as the value in color mode', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await mode('Color').click();

		await expect.element(mode('Color')).toHaveAttribute('aria-checked', 'true');
		await expect.element(page.getByRole('slider', { name: 'Kitchen color' })).toBeVisible();
		await expect
			.element(page.getByRole('slider', { name: 'Kitchen brightness' }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText('60 %', { exact: true })).toBeInTheDocument();
	});

	it('shows the white slider in kelvin over the range', async () => {
		render(Controls, { control: lightTarget({ ...light, mirek: 370 }) });

		await mode('White').click();

		const slider = page.getByRole('slider', { name: 'Ceiling color temperature' });
		await expect.element(slider).toHaveAttribute('aria-valuenow', '2700');
		await expect.element(slider).toHaveAttribute('aria-valuemin', '2000');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '6536');
		await expect.element(page.getByText('2700 K', { exact: true })).toBeInTheDocument();
	});

	it('keeps the mode when the selected button is clicked again', async () => {
		render(Controls, { control: groupTarget(kitchen) });

		await mode('Brightness').click();

		await expect.element(mode('Brightness')).toHaveAttribute('aria-checked', 'true');
		await expect.element(page.getByRole('slider', { name: 'Kitchen brightness' })).toBeVisible();
	});

	it('offers no color for a light without color', async () => {
		render(Controls, { control: lightTarget({ ...light, color: false }) });

		await expect.element(mode('White')).toBeInTheDocument();
		await expect.element(mode('Color')).not.toBeInTheDocument();
	});

	it('opens on white for a light without dimming', async () => {
		render(Controls, { control: lightTarget({ ...light, brightness: null }) });

		await expect.element(mode('White')).toHaveAttribute('aria-checked', 'true');
		await expect.element(mode('Brightness')).not.toBeInTheDocument();
	});

	it('shows only the power button for a plug', async () => {
		render(Controls, {
			control: lightTarget({ ...light, brightness: null, mirekRange: null, color: false })
		});

		await expect.element(page.getByRole('button', { name: 'Power' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio')).not.toBeInTheDocument();
		await expect.element(page.getByText('On', { exact: true })).toBeInTheDocument();
	});

	it('says Off at the top while off', async () => {
		render(Controls, { control: lightTarget({ ...light, on: false }) });

		await expect.element(page.getByText('Off', { exact: true })).toBeInTheDocument();
	});
});

describe('Controls for a light', () => {
	it('starts the color pad at the light color', async () => {
		render(Controls, {
			control: lightTarget({ ...light, mirek: null, hueSaturation: { hue: 0, saturation: 100 } })
		});

		await page.getByRole('radio', { name: 'Color' }).click();

		await expect
			.element(page.getByRole('slider', { name: 'Ceiling color' }))
			.toHaveAttribute('aria-valuetext', 'hue 0, 100 % saturation');
	});

	it('sends a light command, not a group command', async () => {
		render(Controls, { control: lightTarget(light) });

		await page.getByRole('button', { name: 'Power' }).click();

		expect(sentBody()).toEqual({ url: '/api/lights/ceiling', body: { on: false } });
	});
});

describe('ColorControl', () => {
	it('starts a group at white and sends one color command per key', async () => {
		render(ColorControl, { control: groupTarget(kitchen) });
		const pad = page.getByRole('slider', { name: 'Kitchen color' });
		await expect.element(pad).toHaveAttribute('aria-valuetext', 'hue 30, 0 % saturation');

		(pad.element() as HTMLElement).focus();
		await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}');

		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
		expect(sentBody()).toEqual({
			url: '/api/groups/grouped-kitchen',
			body: { on: true, color: { hue: 30, saturation: 10 } }
		});
	});

	it('moves the marker to a color change from outside', async () => {
		render(ColorControl, {
			control: lightTarget({ ...light, mirek: null, hueSaturation: { hue: 0, saturation: 100 } })
		});
		const pad = page.getByRole('slider', { name: 'Ceiling color' });
		await expect.element(pad).toHaveAttribute('aria-valuenow', '0');

		live.apply({
			kind: 'light',
			id: 'ceiling',
			mirek: null,
			hueSaturation: { hue: 240, saturation: 80 },
			swatch: '#3333ff'
		});

		await expect.element(pad).toHaveAttribute('aria-valuetext', 'hue 240, 80 % saturation');
		expect(fetchMock).not.toHaveBeenCalled();
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
		render(LightCard, { light, onOpen: () => {} });

		live.apply({ kind: 'light', id: 'ceiling', brightness: 20 });

		await expect.element(page.getByText('On, 20 %')).toBeInTheDocument();
	});
});
