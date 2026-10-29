import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LiveStatus from './LiveStatus.svelte';

describe('LiveStatus', () => {
	it('says live updates are paused while disconnected', async () => {
		render(LiveStatus, { connected: false });

		await expect.element(page.getByText(/Live updates paused/)).toBeInTheDocument();
	});

	it('shows nothing while connected', async () => {
		render(LiveStatus, { connected: true });

		await expect.element(page.getByText(/Live updates paused/)).not.toBeInTheDocument();
	});
});
