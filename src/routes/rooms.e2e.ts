import { expect, test, type Page } from '@playwright/test';

// The setup project pairs the bridge first; these steps change the mock's light state in order.
test.describe.configure({ mode: 'serial' });

function card(page: Page, name: string) {
	return page.locator('[data-slot="card"]').filter({ has: page.getByRole('switch', { name }) });
}

test('lists rooms and zones', async ({ page }) => {
	await page.goto('/');

	const rooms = page.getByRole('group', { name: 'Rooms' });
	const zones = page.getByRole('group', { name: 'Zones' });
	await expect(rooms.getByRole('link', { name: /Kitchen/ })).toBeVisible();
	await expect(rooms.getByRole('link', { name: /Living room/ })).toBeVisible();
	await expect(zones.getByRole('link', { name: /Downstairs/ })).toBeVisible();
});

test('turns a room off and on', async ({ page }) => {
	await page.goto('/');
	const kitchen = card(page, 'Kitchen');

	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-kitchen'));
	await kitchen.getByRole('switch', { name: 'Kitchen' }).click();
	await expect(kitchen.getByText('Off')).toBeVisible();
	expect((await sent).status()).toBe(204);

	await page.reload();
	await expect(card(page, 'Kitchen').getByText('Off')).toBeVisible();

	await card(page, 'Kitchen').getByRole('switch', { name: 'Kitchen' }).click();
	await expect(card(page, 'Kitchen').getByText(/^On, /)).toBeVisible();
});

test('sets room brightness', async ({ page }) => {
	await page.goto('/');

	await card(page, 'Kitchen').getByRole('slider', { name: 'Kitchen brightness' }).focus();
	// The group throttle may hold this command for up to a second; the response comes once it is sent.
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-kitchen'));
	await page.keyboard.press('End');
	expect((await sent).status()).toBe(204);

	await expect(card(page, 'Kitchen').getByText('On, 100 %')).toBeVisible();
});

test('switches a single light in a room', async ({ page }) => {
	await page.goto('/rooms/room-living');
	await page.getByRole('link', { name: /^Kitchen/ }).click();

	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/lights/ceiling'));
	await page.getByRole('switch', { name: 'Ceiling' }).click();
	expect((await sent).status()).toBe(204);

	await page.reload();
	await expect(
		page.getByRole('listitem').filter({ hasText: 'Ceiling' }).getByText('Off')
	).toBeVisible();
	await expect(
		page.getByRole('listitem').filter({ hasText: 'Counter' }).getByText(/^On/)
	).toBeVisible();
});

test('shows an unreachable light', async ({ page }) => {
	await page.goto('/rooms/room-living');

	const plug = page.getByRole('listitem').filter({ hasText: 'Plug' });
	await expect(plug.getByText('Unreachable')).toBeVisible();
	await expect(plug.getByRole('switch', { name: 'Plug' })).toBeDisabled();
});

test('shows a not-found page for an unknown room', async ({ page }) => {
	await page.goto('/rooms/unknown');

	await expect(page.getByText('Room not found')).toBeVisible();
});
