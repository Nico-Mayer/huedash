import { describe, expect, it, vi } from 'vitest';
import { resolveBridgeConfig } from './index.ts';
import type { ConfigStore, StoredConfig } from './store.ts';

const stored: StoredConfig = {
	version: 1,
	bridge: {
		address: '192.168.1.20',
		id: '001788fffe123456',
		name: 'Living room bridge',
		appKey: 'file-key',
		clientKey: 'client-key',
		certSha256: 'A'.repeat(64)
	},
	pairedAt: '2026-10-29T12:00:00.000Z'
};

function storeWith(config: StoredConfig | null): ConfigStore {
	return {
		file: '/data/config.json',
		read: async () => config,
		write: async () => {},
		remove: async () => {}
	};
}

describe('resolveBridgeConfig', () => {
	it('uses the env vars over the stored file', async () => {
		const env = { HUE_BRIDGE_IP: '10.0.0.5', HUE_APP_KEY: 'env-key' };

		expect(await resolveBridgeConfig(env, storeWith(stored))).toMatchObject({
			source: 'env',
			address: { origin: 'https://10.0.0.5' },
			appKey: 'env-key',
			certSha256: null
		});
	});

	it('normalizes the pinned fingerprint from the env', async () => {
		const env = {
			HUE_BRIDGE_IP: '10.0.0.5',
			HUE_APP_KEY: 'env-key',
			HUE_BRIDGE_CERT_SHA256: 'ab:'.repeat(31) + 'ab'
		};

		expect((await resolveBridgeConfig(env, storeWith(null)))?.certSha256).toBe('AB'.repeat(32));
	});

	it('uses the stored file without env vars', async () => {
		expect(await resolveBridgeConfig({}, storeWith(stored))).toMatchObject({
			source: 'file',
			name: 'Living room bridge',
			appKey: 'file-key',
			certSha256: 'A'.repeat(64)
		});
	});

	it('warns and falls back to the file when only one env var is set', async () => {
		const log = { warn: vi.fn() };

		const config = await resolveBridgeConfig({ HUE_BRIDGE_IP: '10.0.0.6' }, storeWith(stored), log);

		expect(config?.source).toBe('file');
		expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('HUE_APP_KEY is not set'));
	});

	it('logs each warning only once', async () => {
		const log = { warn: vi.fn() };
		const env = { HUE_APP_KEY: 'lonely-key' };

		await resolveBridgeConfig(env, storeWith(null), log);
		await resolveBridgeConfig(env, storeWith(null), log);

		expect(log.warn).toHaveBeenCalledOnce();
	});

	it('returns null when nothing is configured', async () => {
		expect(await resolveBridgeConfig({}, storeWith(null))).toBeNull();
	});
});
