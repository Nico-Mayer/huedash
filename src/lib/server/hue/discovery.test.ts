import { delay } from 'msw/utils/delay';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { DISCOVERY_URL } from '../../../mocks/bridge/handlers.ts';
import { server } from '../../../mocks/server.ts';
import { discoverBridges } from './discovery.ts';

describe('discoverBridges', () => {
	it('lists the bridges the service returns', async () => {
		expect(await discoverBridges()).toEqual({
			status: 'found',
			bridges: [{ id: '001788fffe123456', address: '192.0.2.10' }]
		});
	});

	it('keeps a non-default port in the address and drops invalid entries', async () => {
		server.use(
			http.get(DISCOVERY_URL, () =>
				HttpResponse.json([
					{ id: 'A', internalipaddress: '192.0.2.11', port: 8443 },
					{ id: 'B', internalipaddress: 'not an ip!', port: 443 }
				])
			)
		);

		expect(await discoverBridges()).toEqual({
			status: 'found',
			bridges: [{ id: 'a', address: '192.0.2.11:8443' }]
		});
	});

	it('reports an empty result as found with no bridges', async () => {
		server.use(http.get(DISCOVERY_URL, () => HttpResponse.json([])));

		expect(await discoverBridges()).toEqual({ status: 'found', bridges: [] });
	});

	it('reports rate limiting', async () => {
		server.use(http.get(DISCOVERY_URL, () => new HttpResponse(null, { status: 429 })));

		expect(await discoverBridges()).toEqual({ status: 'failed', reason: 'rate-limited' });
	});

	it('reports a network error as unavailable', async () => {
		server.use(http.get(DISCOVERY_URL, () => HttpResponse.error()));

		expect(await discoverBridges()).toEqual({ status: 'failed', reason: 'unavailable' });
	});

	it('gives up after the timeout', async () => {
		server.use(http.get(DISCOVERY_URL, () => delay('infinite')));

		expect(await discoverBridges({ timeoutMs: 50 })).toEqual({
			status: 'failed',
			reason: 'unavailable'
		});
	});
});
