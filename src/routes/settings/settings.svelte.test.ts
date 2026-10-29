import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BridgeStatusView from '#lib/components/bridge/BridgeStatusView.svelte';
import ForgetBridge from './ForgetBridge.svelte';

describe('BridgeStatusView', () => {
	it('shows a connected bridge', async () => {
		render(BridgeStatusView, { name: 'Mock Bridge', status: 'ok' });

		await expect.element(page.getByText('Connected to Mock Bridge')).toBeInTheDocument();
	});

	it('shows progress while checking', async () => {
		render(BridgeStatusView, { name: 'Mock Bridge', status: 'checking' });

		await expect.element(page.getByText('Checking the bridge…')).toBeInTheDocument();
	});

	it.each([
		['unreachable', 'Bridge not reachable'],
		['unauthorized', 'Bridge refused access'],
		['certificate-mismatch', 'Bridge certificate changed']
	] as const)('explains the %s status', async (status, title) => {
		render(BridgeStatusView, { name: 'Mock Bridge', status });

		await expect.element(page.getByText(title)).toBeInTheDocument();
	});
});

describe('ForgetBridge', () => {
	it('asks for confirmation before forgetting the bridge', async () => {
		render(ForgetBridge, { name: 'Mock Bridge' });

		await page.getByRole('button', { name: 'Forget bridge' }).click();

		await expect.element(page.getByText('Forget Mock Bridge?')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Keep bridge' })).toBeInTheDocument();
	});
});
