import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveUpdate } from '#lib/live-updates.ts';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';

const hub = vi.hoisted(() => {
	const listeners = new Set<(update: unknown) => void>();
	return {
		listeners,
		subscribe: vi.fn((listener: (update: unknown) => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		})
	};
});
vi.mock('#lib/server/hue/events.ts', () => ({ getEventHub: () => hub }));

const { GET } = await import('./+server.ts');

function open() {
	const controller = new AbortController();
	const request = new Request('http://localhost/api/events', { signal: controller.signal });
	return { controller, response: GET({ request } as never) as Promise<Response> };
}

async function read(response: Response, until: string) {
	const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
	let text = '';
	while (!text.includes(until)) text += (await reader.read()).value;
	reader.releaseLock();
	return text;
}

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
	hub.listeners.clear();
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.useRealTimers();
});

describe('GET /api/events', () => {
	it('streams updates as server-sent events', async () => {
		const { response, controller } = open();
		const res = await response;
		const update: LiveUpdate = { kind: 'group', id: 'grouped-kitchen', on: false };

		hub.listeners.forEach((listener) => listener(update));

		expect(res.headers.get('content-type')).toBe('text/event-stream');
		expect(res.headers.get('cache-control')).toBe('no-store');
		expect(await read(res, '\n\n')).toBe(`data: ${JSON.stringify(update)}\n\n`);
		controller.abort();
	});

	it('stops listening when the browser disconnects', async () => {
		const { response, controller } = open();
		await response;
		expect(hub.listeners.size).toBe(1);

		controller.abort();

		expect(hub.listeners.size).toBe(0);
	});

	it('sends a heartbeat comment', async () => {
		vi.useFakeTimers();
		const { response, controller } = open();
		const res = await response;

		vi.advanceTimersByTime(25_000);

		expect(await read(res, '\n\n')).toBe(': ping\n\n');
		controller.abort();
	});

	it('answers 409 without a bridge', async () => {
		vi.stubEnv('HUE_BRIDGE_IP', '');
		vi.stubEnv('HUE_APP_KEY', '');
		vi.stubEnv('HUE_DATA_DIR', 'does-not-exist');

		expect((await open().response).status).toBe(409);
	});
});
