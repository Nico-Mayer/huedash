import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const card = (page: Page, name: string) =>
	page.getByRole('list', { name: 'Lights' }).getByRole('button', { name: new RegExp(`^${name}`) });

async function open(page: Page, path: string) {
	await page.goto(path);
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('opens a light and returns focus on close', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');

		await card(page, 'Ceiling').click();

		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Ceiling' })).toBeVisible();
		await expect(dialog.getByText('Hue White and Color Ambiance')).toBeVisible();
		await expect(dialog.getByRole('tab', { name: 'Color' })).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(card(page, 'Ceiling')).toBeFocused();
	});

	test('sends a preset to the light only', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');
		const groupCalls: string[] = [];
		page.on('request', (request) => {
			if (request.url().includes('/api/groups/')) groupCalls.push(request.url());
		});

		await card(page, 'Counter').click();
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Counter' })).toBeVisible();
		await expect(dialog.getByRole('tab')).toHaveCount(0);

		const sent = page.waitForResponse((r) => r.url().endsWith('/api/lights/counter'));
		await dialog.getByRole('button', { name: '25 %' }).click();

		expect((await sent).status()).toBe(204);
		await expect(dialog.getByText('On, 25 %')).toBeVisible();
		expect(groupCalls).toEqual([]);
	});

	test('follows a light color change from elsewhere', async ({ page }) => {
		await open(page, '/rooms/room-living');
		await card(page, 'Lamp').click();
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('tab', { name: 'Color' })).toHaveAttribute(
			'aria-selected',
			'true'
		);

		const response = await page.request.put('/api/lights/lamp', {
			data: { color: { hue: 0, saturation: 100 } }
		});
		expect(response.status()).toBe(204);

		await expect(dialog.getByRole('slider', { name: 'Lamp saturation' })).toHaveAttribute(
			'aria-valuenow',
			'100'
		);
	});

	test('does not open an unreachable light', async ({ page }) => {
		await open(page, '/rooms/room-living');

		await expect(card(page, 'Plug')).toBeDisabled();
	});

	test('opens the room dialog from the header', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');

		await page.getByRole('button', { name: 'Color and white for Kitchen' }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
		await expect(dialog.getByText('Room · 2 lights')).toBeVisible();
		await expect(dialog.getByRole('tab', { name: 'White' })).toBeVisible();
		await expect(dialog.getByRole('tab', { name: 'Color' })).toBeVisible();
	});

	test('names a zone in its dialog', async ({ page }) => {
		await open(page, '/zones/zone-downstairs');

		await page.getByRole('button', { name: 'Color and white for Downstairs' }).click();

		await expect(page.getByRole('dialog').getByText('Zone · 2 lights')).toBeVisible();
	});
});

test.describe('phone', () => {
	test.use({ viewport: { width: 390, height: 600 } });

	test('opens a light in a bottom sheet and keeps the scroll position', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');
		await card(page, 'Counter').scrollIntoViewIfNeeded();
		const scrolled = await page.evaluate(() => window.scrollY);

		await card(page, 'Counter').click();

		const sheet = page.getByRole('dialog');
		await expect(sheet.getByRole('heading', { name: 'Counter' })).toBeVisible();
		await expect
			.poll(async () => {
				const box = await sheet.boundingBox();
				return Math.round(box!.y + box!.height);
			})
			.toBe(600);

		await page.keyboard.press('Escape');
		await expect(sheet).toBeHidden();
		expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
	});
});
