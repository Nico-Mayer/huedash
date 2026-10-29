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

test.describe('light system theme', () => {
	test.use({ colorScheme: 'light' });

	test('follows a light system theme', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
	});
});

test.describe('theme setting', () => {
	test.use({ colorScheme: 'dark' });

	test('applies each theme right away', async ({ page }) => {
		await page.goto('/settings');
		const html = page.locator('html');

		await page.getByText('Light', { exact: true }).click();
		await expect(html).not.toHaveClass(/\bdark\b/);

		await page.getByText('Dark', { exact: true }).click();
		await expect(html).toHaveClass(/\bdark\b/);

		await page.emulateMedia({ colorScheme: 'light' });
		await page.getByText('System', { exact: true }).click();
		await expect(html).not.toHaveClass(/\bdark\b/);
	});

	test('remembers the theme after a reload', async ({ page }) => {
		await page.goto('/settings');
		await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();

		await page.getByText('Light', { exact: true }).click();
		await page.reload();

		await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
		await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
	});
});
