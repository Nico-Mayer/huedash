import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BridgeConfig } from '#lib/server/config/index.ts';
import type { PageServerLoadEvent } from './$types';

const mocks = vi.hoisted(() => ({
	getBridgeConfig: vi.fn(),
	remove: vi.fn(),
	checkBridge: vi.fn()
}));

vi.mock('#lib/server/config/index.ts', () => ({
	getBridgeConfig: mocks.getBridgeConfig,
	getConfigStore: () => ({ remove: mocks.remove })
}));
vi.mock('#lib/server/hue/bridge.ts', () => ({ checkBridge: mocks.checkBridge }));

const { actions, load } = await import('./+page.server.ts');

const fileConfig: BridgeConfig = {
	source: 'file',
	address: { host: '192.0.2.10', port: 443, origin: 'https://192.0.2.10' },
	name: 'Mock Bridge',
	appKey: 'secret-app-key',
	certSha256: 'A'.repeat(64)
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.checkBridge.mockResolvedValue('ok');
});

describe('home load', () => {
	it('returns the bridge name, source and live status without any keys', async () => {
		mocks.getBridgeConfig.mockResolvedValue(fileConfig);

		const data = (await load({} as PageServerLoadEvent)) as Record<string, unknown>;

		expect(data).toMatchObject({ name: 'Mock Bridge', source: 'file' });
		expect(await data.status).toBe('ok');
		expect(JSON.stringify({ ...data, status: await data.status })).not.toContain('secret-app-key');
		expect(mocks.checkBridge).toHaveBeenCalledWith(
			expect.objectContaining({ origin: 'https://192.0.2.10', appKey: 'secret-app-key' })
		);
	});

	it('redirects to setup without a bridge', async () => {
		mocks.getBridgeConfig.mockResolvedValue(null);

		await expect(load({} as PageServerLoadEvent)).rejects.toMatchObject({
			status: 303,
			location: '/setup'
		});
	});
});

describe('forget action', () => {
	it('deletes the stored configuration and opens setup', async () => {
		mocks.getBridgeConfig.mockResolvedValue(fileConfig);

		await expect(actions.forget()).rejects.toMatchObject({ status: 303, location: '/setup' });
		expect(mocks.remove).toHaveBeenCalledOnce();
	});

	it('refuses when the configuration comes from env vars', async () => {
		mocks.getBridgeConfig.mockResolvedValue({ ...fileConfig, source: 'env' });

		expect(await actions.forget()).toMatchObject({ status: 409, data: { forgetError: 'env' } });
		expect(mocks.remove).not.toHaveBeenCalled();
	});
});
