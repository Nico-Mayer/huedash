import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MOCK_APP_KEY } from '../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP, pressLinkButton } from '../../mocks/bridge/handlers.ts';
import { server } from '../../mocks/server.ts';
import { createConfigStore } from './config/store.ts';
import {
	checkAddress,
	deviceType,
	pairWithBridge,
	PAIRING_TTL_MS,
	type SetupDeps
} from './setup.ts';

const FINGERPRINT = 'C'.repeat(64);
let dir: string;
let now: number;

// MSW hides the real certificate, so tests supply the captured fingerprint.
function deps(storeDir = dir): SetupDeps {
	const fetch = ((...args) => globalThis.fetch(...args)) as typeof globalThis.fetch;
	return {
		capture: (origin) => ({ connection: { origin, fetch }, fingerprint: () => FINGERPRINT }),
		pinned: (origin) => ({ origin, fetch }),
		store: () => createConfigStore(storeDir, { warn: () => {} }),
		now: () => now
	};
}

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'huedash-setup-'));
	now = Date.parse('2026-10-29T12:00:00Z');
});

afterEach(() => rm(dir, { recursive: true, force: true }));

describe('checkAddress', () => {
	it('returns the bridge identity and its certificate fingerprint', async () => {
		expect(await checkAddress(MOCK_BRIDGE_IP, deps())).toEqual({
			ok: true,
			token: expect.any(String),
			bridge: { id: '001788fffe123456', name: 'Mock Bridge', certSha256: FINGERPRINT }
		});
	});

	it('rejects an invalid address without contacting the network', async () => {
		expect(await checkAddress('not an ip!', deps())).toEqual({
			ok: false,
			error: 'invalid-address'
		});
	});

	it('reports a device that is not a bridge', async () => {
		server.use(http.get('*/api/0/config', () => HttpResponse.json({ hello: 'world' })));

		expect(await checkAddress(MOCK_BRIDGE_IP, deps())).toEqual({
			ok: false,
			error: 'not-a-bridge'
		});
	});

	it('reports an address that does not answer', async () => {
		server.use(http.get('*/api/0/config', () => HttpResponse.error()));

		expect(await checkAddress(MOCK_BRIDGE_IP, deps())).toEqual({ ok: false, error: 'unreachable' });
	});
});

describe('pairWithBridge', () => {
	async function startPairing() {
		const result = await checkAddress(MOCK_BRIDGE_IP, deps());
		if (!result.ok) throw new Error('check failed');
		return result.token;
	}

	it('waits for the link button, then stores the configuration', async () => {
		const token = await startPairing();

		expect(await pairWithBridge(token, deps())).toEqual({ status: 'waiting' });

		pressLinkButton();
		expect(await pairWithBridge(token, deps())).toEqual({ status: 'paired' });
		expect(await deps().store().read()).toMatchObject({
			bridge: {
				address: MOCK_BRIDGE_IP,
				name: 'Mock Bridge',
				appKey: MOCK_APP_KEY,
				certSha256: FINGERPRINT
			}
		});
	});

	it('expires a pending pairing after five minutes', async () => {
		const token = await startPairing();
		now += PAIRING_TTL_MS + 1;

		expect(await pairWithBridge(token, deps())).toEqual({ status: 'expired' });
	});

	it('treats an unknown token as expired', async () => {
		expect(await pairWithBridge('unknown', deps())).toEqual({ status: 'expired' });
		expect(await pairWithBridge(undefined, deps())).toEqual({ status: 'expired' });
	});

	it('reports a data directory it cannot write', async () => {
		const blocked = join(dir, 'not-a-directory');
		await writeFile(blocked, '');
		const token = await startPairing();
		pressLinkButton();

		expect(await pairWithBridge(token, deps(blocked))).toEqual({
			status: 'not-saved',
			dataDir: blocked
		});
	});
});

describe('deviceType', () => {
	it('fits the bridge name limits', () => {
		expect(deviceType('a-very-long-hostname-for-a-server')).toBe('huedash#a-very-long-hostnam');
	});
});
