import { describe, expect, it } from 'vitest';
import { bridge } from './fixtures.js';
import { MOCK_BRIDGE_IP } from './handlers.js';

describe('mock bridge', () => {
	it('serves the bridge resource', async () => {
		const response = await fetch(`https://${MOCK_BRIDGE_IP}/clip/v2/resource/bridge`);

		expect(await response.json()).toEqual({ errors: [], data: [bridge] });
	});

	it('rejects requests without a handler', async () => {
		await expect(fetch(`https://${MOCK_BRIDGE_IP}/clip/v2/resource/unknown`)).rejects.toMatchObject(
			{
				cause: { message: expect.stringContaining('[MSW]') }
			}
		);
	});
});
