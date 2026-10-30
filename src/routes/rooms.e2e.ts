import { expect, test, type Page } from '@playwright/test';

// The setup project pairs the bridge first; these steps change the mock's light state in order.
test.describe.configure({ mode: 'serial' });

function header(page: Page) {
	return page.getByRole('region', { name: 'Kitchen controls' });
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
	const kitchen = () => header(page).getByRole('switch', { name: 'Kitchen' });

	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-kitchen'));
	await kitchen().click();
	await expect(kitchen()).not.toBeChecked();
	expect((await sent).status()).toBe(200);

	await page.reload();
	await expect(kitchen()).not.toBeChecked();
	await expect(header(page).getByText('0 of 2 lights on')).toBeVisible();

	await kitchen().click();
	await expect(kitchen()).toBeChecked();
});

test('sets room brightness', async ({ page }) => {
	await page.goto('/');

	await header(page).getByRole('slider', { name: 'Kitchen brightness' }).focus();
	// The group throttle may hold this command for up to a second; the response comes once it is sent.
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-kitchen'));
	await page.keyboard.press('End');
	expect((await sent).status()).toBe(200);

	await expect(header(page).getByText('100 %', { exact: true }).last()).toBeVisible();
});

test('switches a single light in a room', async ({ page }) => {
	await page.goto('/rooms/room-living');
	await page.getByRole('link', { name: /^Kitchen/ }).click();

	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/lights/ceiling'));
	await page.getByRole('switch', { name: 'Ceiling' }).click();
	expect((await sent).status()).toBe(200);

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
	await expect(page.getByRole('link', { name: /^Kitchen/ })).toBeVisible();
});
