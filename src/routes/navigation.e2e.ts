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

test('marks no room on the settings page', async ({ page }) => {
	await page.goto('/rooms/room-kitchen');

	await page.getByRole('link', { name: 'Settings' }).click();

	await expect(page).toHaveURL(/\/settings$/);
	await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
});

test.describe('tablet', () => {
	test.use({ viewport: { width: 1024, height: 900 } });

	test('puts the inspector above the scenes', async ({ page }) => {
		await page.goto('/rooms/room-kitchen');

		const inspector = await page.getByRole('complementary', { name: 'Controls' }).boundingBox();
		const scenes = await page.getByRole('heading', { name: 'Scenes' }).boundingBox();
		expect(inspector!.y + inspector!.height).toBeLessThan(scenes!.y);
		await expect(page.getByRole('group', { name: 'Rooms' })).toBeVisible();
	});
});

test('puts the inspector beside the scenes on wide screens', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/rooms/room-kitchen');

	const inspector = await page.getByRole('complementary', { name: 'Controls' }).boundingBox();
	const scenes = await page.getByRole('heading', { name: 'Scenes' }).boundingBox();
	expect(inspector!.x).toBeGreaterThan(scenes!.x);
	expect(inspector!.y).toBeLessThan(scenes!.y + scenes!.height);
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
