import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';
import { home } from '../../../mocks/bridge/home.ts';
import { server } from '../../../mocks/server.ts';
import { PUT } from './[id]/+server.ts';

function call(id: string, body: unknown) {
	const request = new Request(`http://localhost/api/scenes/${id}`, {
		method: 'PUT',
		body: JSON.stringify(body)
	});
	return PUT({ params: { id }, request } as never) as Promise<Response>;
}

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => vi.unstubAllEnvs());

describe('PUT /api/scenes/[id]', () => {
	it('recalls a scene the way the Hue app does', async () => {
		expect((await call('scene-relax', { mode: 'active' })).status).toBe(200);
		expect(home.commands).toEqual([
			{ rtype: 'scene', id: 'scene-relax', body: { recall: { action: 'active' } } }
		]);
	});

	it('starts a scene dynamically', async () => {
		expect((await call('scene-tropical', { mode: 'dynamic' })).status).toBe(200);
		expect(home.commands).toEqual([
			{ rtype: 'scene', id: 'scene-tropical', body: { recall: { action: 'dynamic_palette' } } }
		]);
	});

	it('answers 400 for an unknown mode', async () => {
		expect((await call('scene-bright', { mode: 'party' })).status).toBe(400);
		expect(home.commands).toEqual([]);
	});

	it('answers 502 when the bridge fails', async () => {
		server.use(http.put('*/clip/v2/resource/scene/:id', () => HttpResponse.error()));

		expect((await call('scene-reading', { mode: 'active' })).status).toBe(502);
	});
});
