import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { lightTarget } from '#lib/control-target.svelte.ts';
import { live } from '#lib/live.svelte.ts';
import type { HomeLight } from '#lib/server/hue/home.ts';
import ControlDialog from './ControlDialog.svelte';

vi.mock('$app/navigation', () => ({ refreshAll: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn() } }));

afterEach(() => {
	live.lights.clear();
});

const ceiling: HomeLight = {
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
	product: 'Hue Signe',
	swatch: null
};

describe('ControlDialog', () => {
	it('names the light and its product', async () => {
		render(ControlDialog, {
			control: lightTarget(ceiling),
			description: 'Hue Signe',
			open: true,
			onOpenChange: () => {}
		});

		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByRole('heading', { name: 'Ceiling' })).toBeInTheDocument();
		await expect.element(dialog.getByText('Hue Signe')).toBeInTheDocument();
		await expect
			.element(dialog.getByRole('slider', { name: 'Ceiling brightness' }))
			.toBeInTheDocument();
	});

	it('shows only the switch for a light without dimming', async () => {
		const plug = { ...ceiling, brightness: null, mirekRange: null, color: false };
		render(ControlDialog, { control: lightTarget(plug), open: true, onOpenChange: () => {} });

		const dialog = page.getByRole('dialog');
		await expect.element(dialog.getByRole('switch', { name: 'Ceiling' })).toBeInTheDocument();
		await expect.element(dialog.getByRole('slider')).not.toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: '25 %' })).not.toBeInTheDocument();
	});

	it('closes on Escape', async () => {
		const onOpenChange = vi.fn();
		render(ControlDialog, { control: lightTarget(ceiling), open: true, onOpenChange });

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
