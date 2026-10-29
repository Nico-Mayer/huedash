import { expect, test } from '@playwright/test';
import { E2E_BRIDGE_ADDRESS } from '../../mocks/e2e.ts';

// All steps share the server's data directory, so they run in order.
test.describe.configure({ mode: 'serial' });

test('home page redirects to setup while no bridge is paired', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveURL(/\/setup$/);
	await expect(page.getByText('Connect your Hue bridge')).toBeVisible();
});

test('rejects an invalid address', async ({ page }) => {
	await page.goto('/setup');

	await page.getByLabel('Bridge IP address').fill('not an ip!');
	await page.getByRole('button', { name: 'Connect' }).click();

	await expect(page.getByText('Enter an IP address like 192.168.1.20')).toBeVisible();
});

test('finds the bridge and pairs over TLS', async ({ page }) => {
	await page.goto('/setup');

	await page.getByRole('button', { name: 'Find bridge' }).click();
	await page
		.getByRole('button', { name: new RegExp(E2E_BRIDGE_ADDRESS.replaceAll('.', '\\.')) })
		.click();

	await expect(page.getByText('Press the link button')).toBeVisible();
	await expect(page.getByText('Mock Bridge')).toBeVisible();

	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible({ timeout: 15_000 });
	await expect(page).toHaveURL(/\/rooms\/room-kitchen$/);

	await page.goto('/settings');
	await expect(page.getByText('Connected to Mock Bridge')).toBeVisible();
});

test('setup is closed once a bridge is paired', async ({ page }) => {
	await page.goto('/setup');

	await expect(page).toHaveURL(/\/rooms\/room-kitchen$/);
});

test('forgets the bridge and returns to setup', async ({ page }) => {
	await page.goto('/settings');

	await page.getByRole('button', { name: 'Forget bridge' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Forget bridge' }).click();

	await expect(page).toHaveURL(/\/setup$/);
});

test('pairs with a manually entered address', async ({ page }) => {
	await page.goto('/setup');

	await page.getByLabel('Bridge IP address').fill(E2E_BRIDGE_ADDRESS);
	await page.getByRole('button', { name: 'Connect' }).click();

	await expect(page.getByRole('heading', { name: 'Kitchen' })).toBeVisible({ timeout: 15_000 });
});
