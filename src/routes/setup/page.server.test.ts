import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from './$types';

const setup = vi.hoisted(() => ({ checkAddress: vi.fn(), pairWithBridge: vi.fn() }));
vi.mock('#lib/server/setup.ts', async (original) => ({
	...(await original<typeof import('#lib/server/setup.ts')>()),
	...setup
}));

const { actions } = await import('./+page.server.ts');

function event(form: Record<string, string> = {}, cookieValue?: string) {
	const body = new FormData();
	for (const [key, value] of Object.entries(form)) body.set(key, value);
	const cookies = { set: vi.fn(), delete: vi.fn(), get: vi.fn(() => cookieValue) };
	const request = new Request('http://localhost/setup', { method: 'POST', body });
	return { cookies, event: { request, cookies } as unknown as RequestEvent };
}

beforeEach(() => vi.clearAllMocks());

describe('setup actions', () => {
	it('discover lists bridges from the discovery service', async () => {
		expect(await actions.discover()).toEqual({
			discovery: { status: 'found', bridges: [{ id: '001788fffe123456', address: '192.0.2.10' }] }
		});
	});

	it('check stores the pairing token in a cookie that works over plain http', async () => {
		setup.checkAddress.mockResolvedValue({
			ok: true,
			token: 'token-1',
			bridge: { id: 'b', name: 'Bridge', certSha256: 'F'.repeat(64) }
		});
		const { cookies, event: e } = event({ address: ' 192.0.2.10 ' });

		const result = await actions.check(e);

		expect(setup.checkAddress).toHaveBeenCalledWith('192.0.2.10');
		expect(result).toMatchObject({ address: '192.0.2.10', bridge: { name: 'Bridge' } });
		expect(cookies.set).toHaveBeenCalledWith(
			'huedash_pairing',
			'token-1',
			expect.objectContaining({ httpOnly: true, secure: false, path: '/setup' })
		);
	});

	it('check returns the error and keeps the address', async () => {
		setup.checkAddress.mockResolvedValue({ ok: false, error: 'not-a-bridge' });

		expect(await actions.check(event({ address: '192.0.2.99' }).event)).toMatchObject({
			status: 400,
			data: { address: '192.0.2.99', checkError: 'not-a-bridge' }
		});
	});

	it('pair keeps waiting until the bridge grants a key', async () => {
		setup.pairWithBridge.mockResolvedValue({ status: 'waiting' });

		expect(await actions.pair(event({}, 'token-1').event)).toEqual({ pairing: 'waiting' });
	});

	it('pair redirects home and clears the cookie once paired', async () => {
		setup.pairWithBridge.mockResolvedValue({ status: 'paired' });
		const { cookies, event: e } = event({}, 'token-1');

		await expect(actions.pair(e)).rejects.toMatchObject({ status: 303, location: '/' });
		expect(cookies.delete).toHaveBeenCalledWith('huedash_pairing', { path: '/setup' });
	});

	it('pair reports an unwritable data directory as a server error', async () => {
		setup.pairWithBridge.mockResolvedValue({ status: 'not-saved', dataDir: '/data' });

		expect(await actions.pair(event({}, 'token-1').event)).toMatchObject({
			status: 500,
			data: { pairError: { status: 'not-saved', dataDir: '/data' } }
		});
	});
});
