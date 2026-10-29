import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const card = (page: Page, name: string) =>
	page.getByRole('list', { name: 'Lights' }).getByRole('button', { name: new RegExp(`^${name}`) });

const inspector = (page: Page) => page.getByRole('complementary', { name: 'Controls' });

async function openKitchen(page: Page) {
	await page.goto('/rooms/room-kitchen');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('selects one light by clicking its card', async ({ page }) => {
		await openKitchen(page);

		await card(page, 'Ceiling').click();

		await expect(card(page, 'Ceiling')).toHaveAttribute('aria-pressed', 'true');
		await expect(inspector(page).getByText('Ceiling', { exact: true })).toBeVisible();
		await expect(inspector(page).getByRole('button', { name: 'Back to room' })).toBeVisible();
	});

	test('sends a preset to each selected light and not to the group', async ({ page }) => {
		await openKitchen(page);
		const groupCalls: string[] = [];
		page.on('request', (request) => {
			if (request.url().includes('/api/groups/')) groupCalls.push(request.url());
		});

		await card(page, 'Ceiling').click();
		await card(page, 'Counter').click({ modifiers: ['Shift'] });
		await expect(inspector(page).getByText('2 lights')).toBeVisible();

		const sent = ['ceiling', 'counter'].map((id) =>
			page.waitForResponse((r) => r.url().endsWith(`/api/lights/${id}`))
		);
		await inspector(page).getByRole('button', { name: '25 %' }).click();

		for (const response of await Promise.all(sent)) expect(response.status()).toBe(204);
		expect(groupCalls).toEqual([]);
	});

	test('selects lights with plain clicks in select mode', async ({ page }) => {
		await openKitchen(page);

		await page.getByRole('button', { name: 'Select', exact: true }).click();
		await card(page, 'Ceiling').click();
		await card(page, 'Counter').click();

		await expect(inspector(page).getByText('2 lights')).toBeVisible();
		await page.getByRole('button', { name: 'Done' }).click();
		await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible();
		await expect(inspector(page).getByText('2 lights')).toBeVisible();
	});

	test('clears the selection in another room', async ({ page }) => {
		await openKitchen(page);
		await card(page, 'Ceiling').click();

		await page.getByRole('link', { name: /^Living room/ }).click();

		await expect(inspector(page).getByText('Living room', { exact: true })).toBeVisible();
		await page.getByRole('link', { name: /^Kitchen/ }).click();
		await expect(card(page, 'Ceiling')).toHaveAttribute('aria-pressed', 'false');
	});

	test('follows a light color change from elsewhere', async ({ page }) => {
		await page.goto('/rooms/room-living');
		await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
		await card(page, 'Lamp').click();
		await expect(inspector(page).getByRole('tab', { name: 'Color' })).toHaveAttribute(
			'aria-selected',
			'true'
		);

		const response = await page.request.put('/api/lights/lamp', {
			data: { color: { hue: 0, saturation: 100 } }
		});
		expect(response.status()).toBe(204);

		await expect(inspector(page).getByRole('slider', { name: 'Lamp saturation' })).toHaveAttribute(
			'aria-valuenow',
			'100'
		);
	});
});

test.describe('tablet', () => {
	test.use({ viewport: { width: 1024, height: 700 } });

	test('opens selected lights in a bottom sheet and keeps the scroll position', async ({
		page
	}) => {
		await openKitchen(page);
		await card(page, 'Ceiling').scrollIntoViewIfNeeded();
		const scrolled = await page.evaluate(() => window.scrollY);

		await card(page, 'Ceiling').click();

		const sheet = page.getByRole('dialog');
		await expect(sheet.getByText('Ceiling', { exact: true })).toBeVisible();
		expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);

		await page.keyboard.press('Escape');
		await expect(sheet).toBeHidden();
		await expect(card(page, 'Ceiling')).toHaveAttribute('aria-pressed', 'false');
	});
});

test.describe('phone', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('collects lights in select mode before opening the sheet', async ({ page }) => {
		await openKitchen(page);

		await page.getByRole('button', { name: 'Select', exact: true }).click();
		await card(page, 'Ceiling').click();
		await card(page, 'Counter').click();
		await expect(page.getByRole('dialog')).toBeHidden();

		await page.getByRole('button', { name: 'Control 2 lights' }).click();

		await expect(page.getByRole('dialog').getByText('2 lights')).toBeVisible();
	});
});
