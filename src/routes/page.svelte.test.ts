import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('shows the app name', async () => {
		render(Page);

		await expect.element(page.getByText('huedash')).toBeInTheDocument();
	});
});
