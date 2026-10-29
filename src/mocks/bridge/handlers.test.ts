import { describe, expect, it } from 'vitest';
import { bridge, MOCK_APP_KEY } from './fixtures.ts';
import { MOCK_BRIDGE_IP, pressLinkButtonAfter } from './handlers.ts';

const origin = `https://${MOCK_BRIDGE_IP}`;

describe('mock bridge', () => {
	it('serves the bridge resource with the app key', async () => {
		const response = await fetch(`${origin}/clip/v2/resource/bridge`, {
			headers: { 'hue-application-key': MOCK_APP_KEY }
		});

		expect(await response.json()).toEqual({ errors: [], data: [bridge] });
	});

	it('refuses the bridge resource without the app key', async () => {
		const response = await fetch(`${origin}/clip/v2/resource/bridge`);

		expect(response.status).toBe(403);
	});

	it('grants a key once the link button is pressed', async () => {
		pressLinkButtonAfter(1);
		const pair = () => fetch(`${origin}/api`, { method: 'POST', body: '{}' }).then((r) => r.json());

		expect(await pair()).toEqual([
			expect.objectContaining({ error: expect.objectContaining({ type: 101 }) })
		]);
		expect(await pair()).toEqual([
			{ success: expect.objectContaining({ username: MOCK_APP_KEY }) }
		]);
	});

	it('rejects requests without a handler', async () => {
		await expect(fetch(`${origin}/clip/v2/resource/unknown`)).rejects.toMatchObject({
			cause: { message: expect.stringContaining('[MSW]') }
		});
	});
});
