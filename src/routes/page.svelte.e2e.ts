import { expect, test } from '@playwright/test';

test('home page redirects to setup while no bridge is paired', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveURL(/\/setup$/);
});
