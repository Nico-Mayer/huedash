import { expect, test, type Page } from '@playwright/test';

// Uses the Living room, so it does not race with rooms.e2e.ts, which changes the Kitchen.
test.describe.configure({ mode: 'serial' });

function livingRoom(page: Page) {
	return page
		.locator('[data-slot="card"]')
		.filter({ has: page.getByRole('switch', { name: 'Living room' }) });
}

async function setLivingRoom(page: Page, on: boolean) {
	const card = livingRoom(page);
	const isOn = (await card.getByRole('switch').getAttribute('aria-checked')) === 'true';
	if (isOn === on) return;
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-living'));
	await card.getByRole('switch').click();
	expect((await sent).status()).toBe(204);
}

test('a change in one page shows in another page without reload', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await first.goto('/');
	await second.goto('/');
	await setLivingRoom(first, true);
	await expect(livingRoom(second).getByText(/^On, /)).toBeVisible();

	let reloaded = false;
	second.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(first, false);

	await expect(livingRoom(second).getByText('Off')).toBeVisible();
	expect(reloaded).toBe(false);
});

test('a group command does not reload page data', async ({ page }) => {
	await page.goto('/');
	let reloaded = false;
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(page, true);

	await expect(livingRoom(page).getByText(/^On, /)).toBeVisible();
	await page.waitForTimeout(1500);
	expect(reloaded).toBe(false);
});
