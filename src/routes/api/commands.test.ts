import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../mocks/bridge/handlers.ts';
import { home } from '../../mocks/bridge/home.ts';
import { server } from '../../mocks/server.ts';
import { PUT as putGroup } from './groups/[id]/+server.ts';
import { PUT as putLight } from './lights/[id]/+server.ts';

type Handler = (event: never) => Response | Promise<Response>;

function call(handler: Handler, id: string, body: unknown) {
	const request = new Request(`http://localhost/api/x/${id}`, {
		method: 'PUT',
		body: JSON.stringify(body)
	});
	return handler({ params: { id }, request } as never);
}

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => vi.unstubAllEnvs());

describe('PUT /api/groups/[id]', () => {
	it('answers 204 and sends the mapped command', async () => {
		const response = await call(putGroup, 'grouped-living', { brightness: 40 });

		expect(response.status).toBe(204);
		expect(home.commands).toEqual([
			{ rtype: 'grouped_light', id: 'grouped-living', body: { dimming: { brightness: 40 } } }
		]);
	});

	it('answers 400 for invalid input', async () => {
		expect((await call(putGroup, 'grouped-downstairs', { brightness: 'bright' })).status).toBe(400);
		expect(home.commands).toEqual([]);
	});

	it('answers 502 when the bridge fails', async () => {
		server.use(http.put('*/clip/v2/resource/grouped_light/:id', () => HttpResponse.error()));

		const response = await call(putGroup, 'grouped-kitchen', { on: true });

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ error: 'unreachable' });
	});
});

describe('PUT /api/lights/[id]', () => {
	it('answers 204 and switches the light', async () => {
		const response = await call(putLight, 'lamp', { on: true });

		expect(response.status).toBe(204);
		expect(home.commands).toEqual([{ rtype: 'light', id: 'lamp', body: { on: { on: true } } }]);
	});

	it('sets the white of a light', async () => {
		expect((await call(putLight, 'ceiling', { mirek: 250 })).status).toBe(204);

		expect(home.commands).toEqual([
			{ rtype: 'light', id: 'ceiling', body: { color_temperature: { mirek: 250 } } }
		]);
	});

	it('sets the color of a light as xy', async () => {
		expect((await call(putLight, 'lamp', { color: { hue: 0, saturation: 100 } })).status).toBe(204);

		const [command] = home.commands;
		expect(command.body).toEqual({
			color: { xy: { x: expect.any(Number), y: expect.any(Number) } }
		});
	});

	it('answers 409 without a configured bridge', async () => {
		vi.stubEnv('HUE_BRIDGE_IP', '');
		vi.stubEnv('HUE_APP_KEY', '');
		vi.stubEnv('HUE_DATA_DIR', 'does-not-exist');

		expect((await call(putLight, 'lamp', { on: true })).status).toBe(409);
	});
});
