import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function openKitchen(page: Page) {
	await page.goto('/rooms/room-kitchen');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

const sceneRow = (page: Page, name: string) =>
	page.getByRole('list', { name: 'Scenes' }).getByRole('listitem').filter({ hasText: name });

async function recall(page: Page, name: string, id: string, play = false) {
	const sent = page.waitForResponse((r) => r.url().endsWith(`/api/scenes/${id}`));
	if (play) await page.getByRole('button', { name: `Play ${name}` }).click();
	else
		await sceneRow(page, name)
			.getByRole('button', { name: new RegExp(name) })
			.click();
	expect((await sent).status()).toBe(204);
}

test('lists the scenes of a room', async ({ page }) => {
	await openKitchen(page);

	const names = page.getByRole('list', { name: 'Scenes' }).getByRole('listitem');
	await expect(names).toHaveText([/Bright/, /Relax/, /Tropical/]);
});

test('recalls a scene and shows it on the home card', async ({ page }) => {
	await openKitchen(page);

	await recall(page, 'Relax', 'scene-relax');
	await expect(sceneRow(page, 'Relax').getByText('Active')).toBeVisible();

	await page.goto('/');
	await expect(page.getByText(/^Relax, \d+ %$/)).toBeVisible();
});

test('plays a scene dynamically', async ({ page }) => {
	await openKitchen(page);

	await recall(page, 'Tropical', 'scene-tropical', true);

	await expect(sceneRow(page, 'Tropical').getByText('Playing')).toBeVisible();
	await expect(sceneRow(page, 'Relax').getByText('Active')).not.toBeVisible();
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
