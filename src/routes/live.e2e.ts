import { expect, test, type Page } from '@playwright/test';

// Uses the Living room, so it does not race with rooms.e2e.ts, which changes the Kitchen.
test.describe.configure({ mode: 'serial' });

function livingRoom(page: Page) {
	return page
		.locator('[data-sidebar="menu-item"]')
		.filter({ has: page.getByRole('switch', { name: 'Living room' }) });
}

async function setLivingRoom(page: Page, on: boolean) {
	const card = livingRoom(page);
	const isOn = (await card.getByRole('switch').getAttribute('aria-checked')) === 'true';
	if (isOn === on) return;
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-living'));
	await card.getByRole('switch').click();
	expect((await sent).status()).toBe(200);
}

// Updates sent before a page's live connection opens never reach it.
async function openLive(page: Page) {
	await page.goto('/');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

test('a change in one page shows in another page without reload', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await openLive(first);
	await openLive(second);
	await setLivingRoom(first, true);
	await expect(livingRoom(second).getByText(/^\d+ of \d+ on$/)).toBeVisible();

	let reloaded = false;
	second.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(first, false);

	await expect(livingRoom(second).getByText('All off')).toBeVisible();
	expect(reloaded).toBe(false);
});

test('a group command does not reload page data', async ({ page }) => {
	await openLive(page);
	let reloaded = false;
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(page, true);

	await expect(livingRoom(page).getByText(/^\d+ of \d+ on$/)).toBeVisible();
	await page.waitForTimeout(1500);
	expect(reloaded).toBe(false);
});
