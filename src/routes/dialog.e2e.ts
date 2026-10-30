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

	test('opens a light on brightness and returns focus on close', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');

		await card(page, 'Ceiling').click();

		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Ceiling' })).toBeVisible();
		await expect(dialog.getByText('Hue White and Color Ambiance')).toBeVisible();
		await expect(dialog.getByRole('radio', { name: 'Brightness' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		await expect(dialog.getByRole('slider', { name: 'Ceiling brightness' })).toBeVisible();
		await expect(dialog.getByRole('radio', { name: 'Color' })).toBeVisible();
		await expect(dialog.getByRole('radio', { name: 'White' })).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(card(page, 'Ceiling')).toBeFocused();
	});

	test('offers no color for a white light and switches it with the power button', async ({
		page
	}) => {
		await open(page, '/rooms/room-kitchen');

		await card(page, 'Counter').click();
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Counter' })).toBeVisible();
		await expect(dialog.getByRole('radio')).toHaveCount(2);
		await expect(dialog.getByRole('radio', { name: 'Color' })).toHaveCount(0);

		const power = dialog.getByRole('button', { name: 'Power' });
		for (const pressed of ['false', 'true']) {
			const sent = page.waitForResponse((r) => r.url().endsWith('/api/lights/counter'));
			await power.click();
			expect((await sent).status()).toBe(200);
			await expect(power).toHaveAttribute('aria-pressed', pressed);
		}
	});

	test('sends a color from the pad to the light only', async ({ page }) => {
		await open(page, '/rooms/room-living');
		const groupCalls: string[] = [];
		page.on('request', (request) => {
			if (request.url().includes('/api/groups/')) groupCalls.push(request.url());
		});

		await card(page, 'Lamp').click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('radio', { name: 'Color' }).click();
		const pad = dialog.getByRole('slider', { name: 'Lamp color' });
		const box = (await pad.boundingBox())!;

		const sent = page.waitForRequest((r) => r.url().endsWith('/api/lights/lamp'));
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + 14, box.y + 14, { steps: 5 });
		await page.mouse.up();

		expect((await sent).postDataJSON()).toEqual({
			on: true,
			color: { hue: 0, saturation: 100 }
		});
		expect(groupCalls).toEqual([]);
	});

	test('follows a light color change from elsewhere', async ({ page }) => {
		await open(page, '/rooms/room-living');
		await card(page, 'Lamp').click();
		const dialog = page.getByRole('dialog');
		const fill = dialog.locator('[data-slider-fill]');

		const response = await page.request.put('/api/lights/lamp', {
			data: { color: { hue: 240, saturation: 100 } }
		});
		expect(response.status()).toBe(200);

		await expect(fill).toHaveCSS('background-color', 'rgb(0, 0, 255)');
		await dialog.getByRole('radio', { name: 'Color' }).click();
		await expect(dialog.getByRole('slider', { name: 'Lamp color' })).toHaveAttribute(
			'aria-valuenow',
			'240'
		);
	});

	test('does not open an unreachable light', async ({ page }) => {
		await open(page, '/rooms/room-living');

		await expect(card(page, 'Plug')).toBeDisabled();
	});

	test('sets white for the whole room from the header dialog', async ({ page }) => {
		await open(page, '/rooms/room-kitchen');

		await page.getByRole('button', { name: 'Color and white for Kitchen' }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
		await expect(dialog.getByText('Room · 2 lights')).toBeVisible();
		await expect(dialog.getByRole('radio')).toHaveCount(3);

		await dialog.getByRole('radio', { name: 'White' }).click();
		const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-kitchen'));
		await dialog.getByRole('slider', { name: 'Kitchen color temperature' }).press('Home');

		expect((await sent).status()).toBe(200);
		await expect(dialog.getByText('2000 K', { exact: true })).toBeVisible();
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
