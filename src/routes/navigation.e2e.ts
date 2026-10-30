import { expect, test, type Page } from '@playwright/test';

declare global {
	interface Window {
		viewTransitions: number;
	}
}

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

async function countViewTransitions(page: Page) {
	await page.addInitScript(() => {
		const start = document.startViewTransition.bind(document);
		window.viewTransitions = 0;
		document.startViewTransition = ((update) => {
			window.viewTransitions += 1;
			return start(update);
		}) as typeof document.startViewTransition;
	});
}

test('cross-fades the page when switching rooms', async ({ page }) => {
	await countViewTransitions(page);
	await page.goto('/rooms/room-kitchen');

	await entry(page, 'Living room').click();

	await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
	expect(await page.evaluate(() => window.viewTransitions)).toBe(1);
});

test('switches rooms without a transition for reduced motion', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await countViewTransitions(page);
	await page.goto('/rooms/room-kitchen');

	await entry(page, 'Living room').click();

	await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
	expect(await page.evaluate(() => window.viewTransitions)).toBe(0);
});

test('marks no room on the settings page', async ({ page }) => {
	await page.goto('/rooms/room-kitchen');

	await page.getByRole('link', { name: 'Settings' }).click();

	await expect(page).toHaveURL(/\/settings$/);
	await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
});

test.describe('tablet', () => {
	test.use({ viewport: { width: 1024, height: 400 } });

	test('puts the header above the scenes and keeps it on screen', async ({ page }) => {
		await page.goto('/rooms/room-kitchen');
		const header = page.getByRole('region', { name: 'Kitchen controls' });

		const box = await header.boundingBox();
		const scenes = await page.getByRole('heading', { name: 'Scenes' }).boundingBox();
		expect(box!.y + box!.height).toBeLessThan(scenes!.y);
		await expect(page.getByRole('group', { name: 'Rooms' })).toBeVisible();

		await page.mouse.move(600, 300);
		await page.mouse.wheel(0, 2000);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		await expect(header.getByRole('slider', { name: 'Kitchen brightness' })).toBeInViewport();
		expect((await header.boundingBox())!.y).toBeCloseTo(0, 0);
	});
});

test('gives scenes and lights the full width on wide screens', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/rooms/room-kitchen');

	const header = await page.getByRole('region', { name: 'Kitchen controls' }).boundingBox();
	const lights = await page.getByRole('list', { name: 'Lights' }).boundingBox();
	expect(header!.y + header!.height).toBeLessThanOrEqual(lights!.y);
	expect(lights!.width).toBeGreaterThan(header!.width - 100);
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

test.describe('short phone', () => {
	test.use({ viewport: { width: 390, height: 500 } });

	test('scrolls the header with the page', async ({ page }) => {
		await page.goto('/rooms/room-kitchen');

		await page.mouse.move(200, 300);
		await page.mouse.wheel(0, 2000);

		await expect(
			page.getByRole('region', { name: 'Kitchen controls' }).getByRole('slider')
		).not.toBeInViewport();
	});
});
