import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function openKitchen(page: Page) {
	await page.goto('/rooms/room-kitchen');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

const sceneRow = (page: Page, name: string) =>
	page.getByRole('list', { name: 'Scenes' }).getByRole('listitem').filter({ hasText: name });

async function recall(page: Page, name: string, id: string, button?: string) {
	const sent = page.waitForResponse((r) => r.url().endsWith(`/api/scenes/${id}`));
	await sceneRow(page, name)
		.getByRole('button', { name: button ?? new RegExp(`^${name}`) })
		.click();
	expect((await sent).status()).toBe(200);
}

test('lists the scenes of a room', async ({ page }) => {
	await openKitchen(page);

	const names = page.getByRole('list', { name: 'Scenes' }).getByRole('listitem');
	await expect(names).toHaveText([/Bright/, /Relax/, /Tropical/]);
});

test('recalls a scene and shows it in the sidebar', async ({ page }) => {
	await openKitchen(page);

	await recall(page, 'Relax', 'scene-relax');
	await expect(sceneRow(page, 'Relax').getByText('Active')).toBeVisible();

	await expect(page.getByRole('link', { name: /^Kitchen/ })).toContainText('Relax');
});

test('selecting a scene with a palette plays it', async ({ page }) => {
	await openKitchen(page);

	await recall(page, 'Tropical', 'scene-tropical');

	await expect(sceneRow(page, 'Tropical').getByText('Playing')).toBeVisible();
	await expect(sceneRow(page, 'Relax').getByText('Active')).not.toBeVisible();
});

test('the badge switches a playing scene to static', async ({ page }) => {
	await openKitchen(page);
	await recall(page, 'Tropical', 'scene-tropical');
	await expect(sceneRow(page, 'Tropical').getByText('Playing')).toBeVisible();

	await recall(page, 'Tropical', 'scene-tropical', 'Playing: switch Tropical to static');
	await expect(sceneRow(page, 'Tropical').getByText('Active')).toBeVisible();

	await openKitchen(page);
	await expect(sceneRow(page, 'Tropical').getByText('Active')).toBeVisible();
});

test('a scene started in one page shows in another without reload', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await openKitchen(first);
	await openKitchen(second);

	let reloaded = false;
	second.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await recall(first, 'Bright', 'scene-bright');

	await expect(sceneRow(second, 'Bright').getByText('Active')).toBeVisible();
	expect(reloaded).toBe(false);
});

test('a scene moves the header brightness without reload', async ({ page }) => {
	await openKitchen(page);
	await recall(page, 'Bright', 'scene-bright');
	const brightness = page
		.getByRole('region', { name: 'Kitchen controls' })
		.getByRole('slider', { name: 'Kitchen brightness' });
	await expect(brightness).toHaveAttribute('aria-valuenow', '100');

	let reloaded = false;
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});
	await recall(page, 'Relax', 'scene-relax');

	await expect(brightness).toHaveAttribute('aria-valuenow', '56');
	expect(reloaded).toBe(false);
});
