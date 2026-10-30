import { expect, test } from '@playwright/test';

test.describe('system theme', () => {
	test.use({ colorScheme: 'dark' });

	test('follows a dark system theme', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
	});

	test('applies the theme before the app scripts run', async ({ page }) => {
		await page.route('**/_app/immutable/**/*.js', (route) => route.abort());
		await page.goto('/');

		await expect(page.locator('html')).toHaveClass(/\bdark\b/);
	});

	test('switches when the system theme changes', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveClass(/\bdark\b/);

		await page.emulateMedia({ colorScheme: 'light' });

		await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
	});
});

test.describe('theme setting', () => {
	test.use({ colorScheme: 'dark' });

	test('remembers the theme after a reload', async ({ page }) => {
		await page.goto('/settings');
		await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();

		await page.getByText('Light', { exact: true }).click();
		await page.reload();

		await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
		await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
	});
});
