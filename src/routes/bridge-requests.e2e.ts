import { expect, test } from '@playwright/test';
import { resourceReads } from '../mocks/e2e-bridge.ts';

test('page loads and tab focus do not read from the bridge once the home is loaded', async ({
	context,
	page
}) => {
	await page.goto('/rooms/room-kitchen');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
	const before = await resourceReads();

	await page.reload();
	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible();
	await page.goto('/zones/zone-downstairs');
	await expect(page.getByRole('heading', { name: 'Downstairs' })).toBeVisible();
	await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
	const other = await context.newPage();
	await other.goto('/rooms/room-living');
	await expect(other.locator('[data-live]')).toHaveAttribute('data-live', 'open');

	expect(await resourceReads()).toBe(before);
});
