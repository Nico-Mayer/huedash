import { version } from '$app/env';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBridgeConfig } from '#lib/server/config/index.ts';
import { getHomeStore } from '#lib/server/hue/store.ts';
import type { LiveUpdate } from '#lib/live-updates.ts';
import { MOCK_APP_KEY, MOCK_CLIENT_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';
import { publishEvents, updateEvent } from '../../../mocks/bridge/home.ts';
import { GET } from './+server.ts';

function open() {
	const controller = new AbortController();
	const request = new Request('http://localhost/api/events', { signal: controller.signal });
	return { controller, response: GET({ request } as never) as Promise<Response> };
}

function reader(response: Response) {
	const stream = response.body!.pipeThrough(new TextDecoderStream()).getReader();
	let text = '';
	return {
		get text() {
			return text;
		},
		async until(match: (updates: LiveUpdate[]) => boolean) {
			const updates = () =>
				text
					.split('\n\n')
					.filter((block) => block.startsWith('data: '))
					.map((block) => JSON.parse(block.slice(6)) as LiveUpdate);
			while (!match(updates())) text += (await stream.read()).value;
			return updates();
		}
	};
}

const homes = (updates: LiveUpdate[]) => updates.filter((u) => u.kind === 'home');

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.useRealTimers();
});

describe('GET /api/events', () => {
	it('sends the version, the bridge status, and the home on connect', async () => {
		const { response, controller } = open();
		const res = await response;

		const updates = await reader(res).until((u) => homes(u).length > 0 && u.length >= 3);

		expect(res.headers.get('content-type')).toBe('text/event-stream');
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(updates[0]).toEqual({ kind: 'hello', version });
		expect(updates).toContainEqual({ kind: 'status', bridge: 'open' });
		expect(homes(updates)[0]).toMatchObject({
			revision: expect.any(Number),
			home: { rooms: [{ name: 'Kitchen' }, { name: 'Living room' }] }
		});
		controller.abort();
	});

	it('sends a new home when the bridge reports a change, without keys', async () => {
		const { response, controller } = open();
		const stream = reader(await response);
		await stream.until((u) => homes(u).length > 0);

		publishEvents([
			updateEvent([{ id: 'room-kitchen', type: 'room', metadata: { name: 'Cooking' } }])
		]);
		const updates = await stream.until((u) => homes(u).length > 1);

		const latest = homes(updates).at(-1);
		expect(latest?.kind === 'home' && latest.home.rooms.map((r) => r.name)).toEqual([
			'Cooking',
			'Living room'
		]);
		expect(stream.text).not.toContain(MOCK_APP_KEY);
		expect(stream.text).not.toContain(MOCK_CLIENT_KEY);
		controller.abort();
	});

	it('stops listening when the browser disconnects', async () => {
		const store = getHomeStore((await getBridgeConfig())!);
		const unsubscribe = vi.fn();
		vi.spyOn(store, 'subscribe').mockReturnValue(unsubscribe);
		const { response, controller } = open();
		await response;

		controller.abort();

		expect(unsubscribe).toHaveBeenCalledOnce();
	});

	it('sends a heartbeat comment', async () => {
		vi.useFakeTimers({ toFake: ['setInterval'] });
		const { response, controller } = open();
		const stream = reader(await response);

		vi.advanceTimersByTime(25_000);

		await stream.until(() => stream.text.includes(': ping\n\n'));
		expect(stream.text).toContain(': ping\n\n');
		controller.abort();
	});

	it('answers 409 without a bridge', async () => {
		vi.stubEnv('HUE_BRIDGE_IP', '');
		vi.stubEnv('HUE_APP_KEY', '');
		vi.stubEnv('HUE_DATA_DIR', 'does-not-exist');

		expect((await open().response).status).toBe(409);
	});
});
