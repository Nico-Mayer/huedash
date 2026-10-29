import { page } from 'vitest/browser';
import { beforeEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { ModeWatcher, setMode } from 'mode-watcher';
import ThemePicker from './ThemePicker.svelte';

const isDark = () => document.documentElement.classList.contains('dark');

beforeEach(() => {
	setMode('system');
	localStorage.clear();
	render(ModeWatcher);
	render(ThemePicker);
});

it('selects System by default', async () => {
	await expect.element(page.getByRole('radio', { name: 'System' })).toBeChecked();
});

it('applies and stores Dark', async () => {
	await page.getByText('Dark', { exact: true }).click();

	await expect.poll(isDark).toBe(true);
	expect(localStorage.getItem('mode-watcher-mode')).toBe('dark');
});

it('follows the system theme again after picking System', async () => {
	await page.getByText('Dark', { exact: true }).click();
	await expect.poll(isDark).toBe(true);

	await page.getByText('System', { exact: true }).click();

	const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
	await expect.poll(isDark).toBe(systemDark);
	await expect.element(page.getByRole('radio', { name: 'System' })).toBeChecked();
});
