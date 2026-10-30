import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const entry = (page: Page, name: string) =>
	page
		.locator('[data-sidebar="menu-item"]')
		.filter({ has: page.getByRole('switch', { name, exact: true }) });

const lightCard = (page: Page, name: string) =>
	page.getByRole('list', { name: 'Lights' }).getByRole('listitem').filter({ hasText: name });

async function openKitchen(page: Page) {
	await page.goto('/rooms/room-kitchen');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

async function setGroup(page: Page, name: string, groupedLightId: string, on: boolean) {
	const toggle = entry(page, name).getByRole('switch');
	if ((await toggle.getAttribute('aria-checked')) === String(on)) return;
	const sent = page.waitForResponse((r) => r.url().endsWith(`/api/groups/${groupedLightId}`));
	await toggle.click();
	expect((await sent).status()).toBe(200);
}

test('the home summary follows switches', async ({ page }) => {
	await openKitchen(page);
	const summary = page.getByText(/^\d+ of 4 lights on$/);

	await setGroup(page, 'Kitchen', 'grouped-kitchen', false);
	await setGroup(page, 'Living room', 'grouped-living', false);
	await expect(summary).toHaveText('0 of 4 lights on');

	await setGroup(page, 'Kitchen', 'grouped-kitchen', true);
	await expect(summary).toHaveText('2 of 4 lights on');
});

test('a light card shows its product', async ({ page }) => {
	await openKitchen(page);

	await expect(lightCard(page, 'Ceiling')).toContainText('Hue White and Color Ambiance');
});

test('the light color follows a change without a reload', async ({ page }) => {
	await openKitchen(page);
	const indicator = lightCard(page, 'Ceiling').locator('[data-lit]');
	await expect(indicator).toHaveAttribute('data-lit', 'true');
	const before = await indicator.evaluate((el) => getComputedStyle(el).color);

	const response = await page.request.put('/api/lights/ceiling', {
		data: { on: true, color: { hue: 240, saturation: 100 } }
	});
	expect(response.status()).toBe(200);

	await expect.poll(() => indicator.evaluate((el) => getComputedStyle(el).color)).not.toBe(before);
	const swatch = await indicator.evaluate((el) => el.style.getPropertyValue('--swatch'));
	const [r, , b] = [1, 3, 5].map((i) => parseInt(swatch.slice(i, i + 2), 16));
	expect(b).toBeGreaterThan(r);
	await expect(entry(page, 'Kitchen').locator('[data-swatch^="#"]').first()).toBeVisible();
});
