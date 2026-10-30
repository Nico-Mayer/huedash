import { expect, test, type Page } from '@playwright/test';

const entry = (page: Page, name: string) =>
	page.getByRole('link', { name: new RegExp(`^${name}`) });

const topBar = (page: Page) =>
	page.locator('header', { has: page.getByRole('button', { name: 'Open menu' }) });

test('opens the first room', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveURL(/\/rooms\/room-kitchen$/);
	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
});

test('moves between rooms from the sidebar', async ({ page }) => {
	await page.goto('/rooms/room-kitchen');
	await expect(entry(page, 'Kitchen')).toHaveAttribute('aria-current', 'page');

	await entry(page, 'Living room').click();

	await expect(page).toHaveURL(/\/rooms\/room-living$/);
	await expect(entry(page, 'Living room')).toHaveAttribute('aria-current', 'page');
	await expect(entry(page, 'Kitchen')).not.toHaveAttribute('aria-current');
});

function trackDataRequests(page: Page) {
	const urls: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) urls.push(request.url());
	});
	return urls;
}

test('switches rooms without a data request', async ({ page }) => {
	await page.goto('/rooms/room-kitchen');
	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
	const requests = trackDataRequests(page);

	await entry(page, 'Living room').hover();
	await page.waitForTimeout(500);
	expect(requests).toEqual([]);

	await entry(page, 'Living room').click();
	await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
	await entry(page, 'Downstairs').click();
	await expect(page.getByRole('heading', { name: 'Downstairs' })).toBeVisible();
	expect(requests).toEqual([]);
});

test('keeps live state after a switch', async ({ page }) => {
	await page.goto('/rooms/room-living');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
	const lamp = page.getByRole('switch', { name: 'Lamp' });
	const wasOn = (await lamp.getAttribute('aria-checked')) === 'true';
	const toggle = async () => {
		const sent = page.waitForResponse((r) => r.url().endsWith('/api/lights/lamp'));
		await lamp.click();
		expect((await sent).status()).toBe(200);
	};
	const requests = trackDataRequests(page);

	await toggle();
	await entry(page, 'Downstairs').click();

	await expect(page.getByRole('heading', { name: 'Downstairs' })).toBeVisible();
	await expect(lamp).toHaveAttribute('aria-checked', String(!wasOn));
	expect(requests).toEqual([]);
	await toggle();
});

test('marks no room on the settings page', async ({ page }) => {
	await page.goto('/rooms/room-kitchen');

	await page.getByRole('link', { name: 'Settings' }).click();

	await expect(page).toHaveURL(/\/settings$/);
	await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
});

test.describe('phone', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('hides the sidebar behind a menu', async ({ page }) => {
		await page.goto('/rooms/room-kitchen');
		const rooms = page.getByRole('group', { name: 'Rooms' });
		await expect(rooms).toBeHidden();
		await expect(topBar(page)).toContainText('Kitchen');

		await page.getByRole('button', { name: 'Open menu' }).click();
		await rooms.getByRole('link', { name: /^Living room/ }).click();

		await expect(page).toHaveURL(/\/rooms\/room-living$/);
		await expect(rooms).toBeHidden();
		await expect(topBar(page)).toContainText('Living room');
	});

	test('shows a lost connection with the sidebar closed', async ({ page }) => {
		const lost = ['open', 'reconnecting']
			.map((bridge) => `data: ${JSON.stringify({ kind: 'status', bridge })}\n\n`)
			.join('');
		await page.route('**/api/events', (route) =>
			route.fulfill({ contentType: 'text/event-stream', body: lost })
		);

		await page.goto('/rooms/room-kitchen');

		await expect(page.getByText(/Live updates paused/)).toBeVisible();
		await expect(page.getByRole('group', { name: 'Rooms' })).toBeHidden();
	});
});
