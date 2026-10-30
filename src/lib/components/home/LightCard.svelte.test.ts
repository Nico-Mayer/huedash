import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { live } from '#lib/home.svelte.ts';
import type { HomeLight } from '#lib/server/hue/home.ts';
import '../../../routes/layout.css';
import LightCard from './LightCard.svelte';

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockImplementation(async () => Response.json({ revision: 1 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	live.lights.clear();
});

const light = (id: string, name: string, reachable = true): HomeLight => ({
	id,
	name,
	on: true,
	brightness: 50,
	reachable,
	mirekRange: null,
	whiteStops: null,
	color: false,
	mirek: null,
	hueSaturation: null,
	product: null,
	swatch: null
});

const card = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}`) });

const onOpen = vi.fn();

beforeEach(() => onOpen.mockClear());

describe('LightCard opening', () => {
	it('opens the dialog for the clicked light', async () => {
		render(LightCard, { light: light('ceiling', 'Ceiling'), onOpen });

		await expect.element(card('Ceiling')).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.element(card('Ceiling')).not.toHaveAttribute('aria-pressed');
		await card('Ceiling').click();

		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('opens from anywhere on the card', async () => {
		render(LightCard, { light: light('ceiling', 'Ceiling'), onOpen });

		await page.getByRole('listitem').click({ position: { x: 6, y: 6 } });

		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('does not open an unreachable light', async () => {
		render(LightCard, { light: light('plug', 'Plug', false), onOpen });

		await expect.element(card('Plug')).toBeDisabled();
		expect(onOpen).not.toHaveBeenCalled();
	});

	it('does not open when the switch is used', async () => {
		render(LightCard, { light: light('ceiling', 'Ceiling'), onOpen });

		await page.getByRole('switch', { name: 'Ceiling' }).click();

		expect(onOpen).not.toHaveBeenCalled();
		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
	});

	it('does not open when the slider is used', async () => {
		render(LightCard, { light: light('ceiling', 'Ceiling'), onOpen });

		await page.getByRole('slider', { name: 'Ceiling brightness' }).click();

		expect(onOpen).not.toHaveBeenCalled();
		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
	});
});

describe('LightCard details', () => {
	const indicator = () =>
		page.getByRole('listitem').element().querySelector('[data-lit]') as HTMLElement;

	it('shows the product next to the state', async () => {
		render(LightCard, {
			light: { ...light('ceiling', 'Ceiling'), product: 'Hue Signe' },
			onOpen
		});

		await expect.element(page.getByText('On, 50 % · Hue Signe')).toBeInTheDocument();
	});

	it('lights the indicator in the swatch color', async () => {
		render(LightCard, { light: { ...light('ceiling', 'Ceiling'), swatch: '#ff0000' }, onOpen });

		await expect.poll(indicator).toBeTruthy();
		expect(indicator().dataset.lit).toBe('true');
		expect(indicator().style.getPropertyValue('--swatch')).toBe('#ff0000');
	});

	it('glows in the swatch color while lit', async () => {
		render(LightCard, { light: { ...light('ceiling', 'Ceiling'), swatch: '#ff0000' }, onOpen });

		const item = page.getByRole('listitem');
		await expect.element(item).toHaveAttribute('data-glow', 'true');
		expect(item.element().getAttribute('style')).toContain('--swatch: #ff0000');
	});

	it('glows and lights the indicator in the generic white for a dim-only light', async () => {
		render(LightCard, { light: light('luster', 'Luster'), onOpen });

		const item = page.getByRole('listitem');
		await expect.element(item).toHaveAttribute('data-glow', 'true');
		expect(item.element().getAttribute('style')).toContain('--swatch: var(--light)');
		expect(indicator().dataset.lit).toBe('true');
	});

	it('does not glow when off, unreachable, or without dimming', async () => {
		render(LightCard, {
			light: { ...light('ceiling', 'Ceiling'), on: false, swatch: '#ff0000' },
			onOpen
		});
		render(LightCard, {
			light: { ...light('lamp', 'Lamp', false), swatch: '#ff0000' },
			onOpen
		});
		render(LightCard, { light: { ...light('plug', 'Plug'), brightness: null }, onOpen });

		await expect.poll(() => document.querySelectorAll('[data-glow="false"]').length).toBe(3);
	});

	it('mutes the indicator of a light that is off or cannot dim', async () => {
		render(LightCard, {
			light: { ...light('ceiling', 'Ceiling'), on: false, swatch: '#ff0000' },
			onOpen
		});
		render(LightCard, { light: { ...light('plug', 'Plug'), brightness: null }, onOpen });

		await expect.poll(() => document.querySelectorAll('[data-lit="false"]').length).toBe(2);
	});

	it('fills the brightness slider with the light color while on', async () => {
		const { container } = await render(LightCard, {
			light: { ...light('ceiling', 'Ceiling'), swatch: '#ff0000' },
			onOpen
		});
		const fill = () => getComputedStyle(container.querySelector('[data-slider-fill]')!);

		expect(fill().backgroundColor).toBe('rgb(255, 0, 0)');
	});

	it('mutes the brightness slider of a light that is off', async () => {
		const { container } = await render(LightCard, {
			light: { ...light('ceiling', 'Ceiling'), on: false, swatch: '#ff0000' },
			onOpen
		});

		expect(
			getComputedStyle(container.querySelector('[data-slider-fill]')!).backgroundColor
		).not.toBe('rgb(255, 0, 0)');
	});
});
