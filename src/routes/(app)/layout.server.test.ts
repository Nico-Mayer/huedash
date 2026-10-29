import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../mocks/bridge/handlers.ts';
import { server } from '../../mocks/server.ts';
import type { LayoutServerLoadEvent } from './$types';
import { load } from './+layout.server.ts';

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => vi.unstubAllEnvs());

const run = () => load({} as LayoutServerLoadEvent) as Promise<Record<string, unknown>>;

describe('app layout load', () => {
	it('loads rooms and zones without sending any keys to the browser', async () => {
		const data = await run();

		expect(data.result).toMatchObject({
			status: 'ok',
			home: {
				rooms: [{ name: 'Kitchen' }, { name: 'Living room' }],
				zones: [{ name: 'Downstairs' }]
			}
		});
		expect(JSON.stringify(data)).not.toContain(MOCK_APP_KEY);
	});

	it('reports an unreachable bridge', async () => {
		server.use(http.get('*/clip/v2/resource/room', () => HttpResponse.error()));

		expect((await run()).result).toEqual({ status: 'unreachable' });
	});

	it('redirects to setup without a bridge', async () => {
		vi.stubEnv('HUE_BRIDGE_IP', '');
		vi.stubEnv('HUE_APP_KEY', '');
		vi.stubEnv('HUE_DATA_DIR', 'does-not-exist');

		await expect(run()).rejects.toMatchObject({ status: 303, location: '/setup' });
	});
});
