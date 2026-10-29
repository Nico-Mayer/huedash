import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PairingStatus from './PairingStatus.svelte';

const bridge = { id: '001788fffe123456', name: 'Mock Bridge', certSha256: 'AB'.repeat(32) };

function renderStatus(props: Partial<Parameters<typeof render<typeof PairingStatus>>[1]> = {}) {
	const onretry = vi.fn();
	render(PairingStatus, {
		bridge,
		pairing: 'waiting',
		secondsLeft: 42,
		error: null,
		onretry,
		onchangeaddress: vi.fn(),
		...props
	});
	return { onretry };
}

describe('PairingStatus', () => {
	it('shows the bridge and the remaining time while waiting', async () => {
		renderStatus();

		await expect.element(page.getByText('Mock Bridge')).toBeInTheDocument();
		await expect.element(page.getByText(/Waiting for the button/)).toBeInTheDocument();
		await expect.element(page.getByText('42 s', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
	});

	it('offers to try again after the time is up', async () => {
		const { onretry } = renderStatus({ pairing: 'timed-out', secondsLeft: 0 });

		await expect.element(page.getByText("Time's up")).toBeInTheDocument();
		await page.getByRole('button', { name: 'Try again' }).click();

		expect(onretry).toHaveBeenCalledOnce();
	});

	it('shows the pairing error', async () => {
		renderStatus({ pairing: 'failed', error: 'The bridge refused the connection. Try again.' });

		await expect.element(page.getByText("Couldn't connect")).toBeInTheDocument();
		await expect
			.element(page.getByText('The bridge refused the connection. Try again.'))
			.toBeInTheDocument();
	});
});
