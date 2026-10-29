import { delay } from 'msw/utils/delay';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { MOCK_APP_KEY, MOCK_CLIENT_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP, pressLinkButton } from '../../../mocks/bridge/handlers.ts';
import { server } from '../../../mocks/server.ts';
import { BridgeError, checkBridge, getPublicConfig, requestAppKey } from './bridge.ts';
import { CertificateMismatchError } from './tls.ts';

// Resolve fetch per call, so the MSW-patched global is used.
const connection = {
	origin: `https://${MOCK_BRIDGE_IP}`,
	fetch: ((...args) => globalThis.fetch(...args)) as typeof fetch
};

async function kindOf(promise: Promise<unknown>) {
	const error = await promise.catch((e) => e);
	return error instanceof BridgeError ? error.kind : error;
}

describe('getPublicConfig', () => {
	it('returns the bridge identity', async () => {
		expect(await getPublicConfig(connection)).toEqual({
			id: '001788fffe123456',
			name: 'Mock Bridge',
			modelId: 'BSB002'
		});
	});

	it('rejects a device that is not a bridge', async () => {
		server.use(http.get('*/api/0/config', () => HttpResponse.json({ hello: 'world' })));

		expect(await kindOf(getPublicConfig(connection))).toBe('not-a-bridge');
	});

	it('reports a network error as unreachable', async () => {
		server.use(http.get('*/api/0/config', () => HttpResponse.error()));

		expect(await kindOf(getPublicConfig(connection))).toBe('unreachable');
	});

	it('gives up after the timeout', async () => {
		server.use(http.get('*/api/0/config', () => delay('infinite')));

		expect(await kindOf(getPublicConfig({ ...connection, timeoutMs: 50 }))).toBe('unreachable');
	});
});

describe('requestAppKey', () => {
	it('waits until the link button is pressed', async () => {
		expect(await requestAppKey(connection, 'huedash#test')).toEqual({ status: 'waiting' });

		pressLinkButton();

		expect(await requestAppKey(connection, 'huedash#test')).toEqual({
			status: 'paired',
			appKey: MOCK_APP_KEY,
			clientKey: MOCK_CLIENT_KEY
		});
	});

	it('fails on other bridge errors', async () => {
		server.use(
			http.post('*/api', () =>
				HttpResponse.json([{ error: { type: 7, address: '', description: 'invalid value' } }])
			)
		);

		expect(await kindOf(requestAppKey(connection, 'huedash#test'))).toBe('pairing-failed');
	});
});

describe('checkBridge', () => {
	it('is ok with the right key', async () => {
		expect(await checkBridge({ ...connection, appKey: MOCK_APP_KEY })).toBe('ok');
	});

	it('is unauthorized with a wrong key', async () => {
		expect(await checkBridge({ ...connection, appKey: 'wrong' })).toBe('unauthorized');
	});

	it('is unreachable when the request fails', async () => {
		server.use(http.get('*/clip/v2/resource/bridge', () => HttpResponse.error()));

		expect(await checkBridge({ ...connection, appKey: MOCK_APP_KEY })).toBe('unreachable');
	});

	it('reports a changed certificate', async () => {
		const mismatch: typeof fetch = () =>
			Promise.reject(
				new TypeError('fetch failed', { cause: new CertificateMismatchError('A', 'B') })
			);

		expect(await checkBridge({ ...connection, fetch: mismatch, appKey: MOCK_APP_KEY })).toBe(
			'certificate-mismatch'
		);
	});
});
