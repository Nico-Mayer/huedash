import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { selection } from '#lib/selection.svelte.ts';
import type { HomeLight } from '#lib/server/hue/home.ts';
import LightCard from './LightCard.svelte';

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	selection.clear();
});

const light = (id: string, name: string, reachable = true): HomeLight => ({
	id,
	name,
	on: true,
	brightness: 50,
	reachable,
	mirekRange: null,
	color: false,
	mirek: null,
	hueSaturation: null,
	product: null,
	swatch: null
});

const card = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}`) });

function renderCards(...lights: HomeLight[]) {
	for (const l of lights) render(LightCard, { light: l });
}

describe('LightCard selection', () => {
	it('selects only the clicked light', async () => {
		renderCards(light('ceiling', 'Ceiling'), light('counter', 'Counter'));

		await card('Ceiling').click();
		await card('Counter').click();

		expect([...selection.ids]).toEqual(['counter']);
		await expect.element(card('Counter')).toHaveAttribute('aria-pressed', 'true');
		await expect.element(card('Ceiling')).toHaveAttribute('aria-pressed', 'false');
	});

	it.each(['Shift', 'ControlOrMeta'] as const)('adds and removes lights with %s', async (key) => {
		renderCards(light('ceiling', 'Ceiling'), light('counter', 'Counter'));

		await card('Ceiling').click();
		await card('Counter').click({ modifiers: [key] });
		expect([...selection.ids]).toEqual(['ceiling', 'counter']);

		await card('Counter').click({ modifiers: [key] });
		expect([...selection.ids]).toEqual(['ceiling']);
	});

	it('adds and removes lights with plain clicks in select mode', async () => {
		selection.start();
		renderCards(light('ceiling', 'Ceiling'), light('counter', 'Counter'));

		await card('Ceiling').click();
		await card('Counter').click();
		expect([...selection.ids]).toEqual(['ceiling', 'counter']);

		await card('Ceiling').click();
		expect([...selection.ids]).toEqual(['counter']);
		await expect.element(card('Counter')).toHaveAttribute('aria-pressed', 'true');
	});

	it('selects from anywhere on the card', async () => {
		renderCards(light('ceiling', 'Ceiling'));

		await page.getByRole('listitem').click({ position: { x: 6, y: 6 } });

		expect([...selection.ids]).toEqual(['ceiling']);
	});

	it('does not select an unreachable light', async () => {
		renderCards(light('plug', 'Plug', false));

		await expect.element(card('Plug')).toBeDisabled();
		expect(selection.ids.size).toBe(0);
	});

	it('does not select when the switch is used', async () => {
		renderCards(light('ceiling', 'Ceiling'));

		await page.getByRole('switch', { name: 'Ceiling' }).click();

		expect(selection.ids.size).toBe(0);
		await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
	});
});
