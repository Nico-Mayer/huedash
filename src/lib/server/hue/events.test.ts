import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { http, HttpResponse, type HttpHandler } from 'msw/http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { LiveUpdate } from '../../live-updates.ts';
import { createBridgeCertificate } from '../../../mocks/bridge/certificate.ts';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { handlers } from '../../../mocks/bridge/handlers.ts';
import { handlersListener } from '../../../mocks/serve.ts';
import { server as mockServer } from '../../../mocks/server.ts';
import { createEventHub } from './events.ts';
import { createBridgeAgent, fetchWith } from './tls.ts';

// A real HTTPS mock bridge: aborting a streamed response inside MSW's interceptor trips an
// undici assertion, which production never hits.
const active: HttpHandler[] = [...handlers];
let bridge: Server;
const connection = {
	origin: '',
	fetch: fetchWith(createBridgeAgent({ mode: 'capture', onCapture: () => {} }))
};

beforeAll(async () => {
	mockServer.close();
	bridge = createServer(await createBridgeCertificate(), handlersListener(active));
	await new Promise<void>((resolve) => bridge.listen(0, '127.0.0.1', resolve));
	connection.origin = `https://127.0.0.1:${(bridge.address() as AddressInfo).port}`;
});

afterEach(() => {
	active.splice(0, active.length, ...handlers);
});

afterAll(async () => {
	bridge.closeAllConnections();
	await new Promise<void>((resolve) => bridge.close(() => resolve()));
	mockServer.listen({ onUnhandledFrame: 'error' });
});

function collect() {
	const updates: LiveUpdate[] = [];
	return { updates, listener: (update: LiveUpdate) => updates.push(update) };
}

const switchLamp = (on: boolean) =>
	connection.fetch(`${connection.origin}/clip/v2/resource/light/lamp`, {
		method: 'PUT',
		headers: { 'hue-application-key': MOCK_APP_KEY },
		body: JSON.stringify({ on: { on } })
	});

describe('createEventHub', () => {
	it('opens the bridge stream for the first listener and forwards updates to all', async () => {
		const hub = createEventHub({ connection, appKey: MOCK_APP_KEY, idleCloseMs: 10 });
		const first = collect();
		const second = collect();

		const stopFirst = hub.subscribe(first.listener);
		const stopSecond = hub.subscribe(second.listener);
		await vi.waitFor(() =>
			expect(first.updates).toContainEqual({ kind: 'status', bridge: 'open' })
		);

		await switchLamp(true);

		for (const { updates } of [first, second]) {
			await vi.waitFor(() =>
				expect(updates).toContainEqual({ kind: 'light', id: 'lamp', on: true, brightness: 30 })
			);
		}
		stopFirst();
		stopSecond();
	});

	it('closes the bridge stream after the last listener leaves', async () => {
		const hub = createEventHub({ connection, appKey: MOCK_APP_KEY, idleCloseMs: 20 });
		const stop = hub.subscribe(() => {});
		expect(hub.running).toBe(true);

		stop();

		await vi.waitFor(() => expect(hub.running).toBe(false));
	});

	it('keeps the stream when a new listener comes before the idle time ends', async () => {
		const hub = createEventHub({ connection, appKey: MOCK_APP_KEY, idleCloseMs: 50 });
		hub.subscribe(() => {})();
		const stop = hub.subscribe(() => {});

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(hub.running).toBe(true);
		stop();
	});

	it('reports reconnecting when the bridge refuses the stream and retries', async () => {
		let attempts = 0;
		active.unshift(
			http.get('*/eventstream/clip/v2', () => {
				attempts++;
				return new HttpResponse(null, { status: 503 });
			})
		);
		const hub = createEventHub({
			connection,
			appKey: MOCK_APP_KEY,
			idleCloseMs: 10,
			restartMs: 20
		});
		const { updates, listener } = collect();

		const stop = hub.subscribe(listener);

		await vi.waitFor(() => expect(attempts).toBeGreaterThanOrEqual(2));
		expect(updates).toContainEqual({ kind: 'status', bridge: 'reconnecting' });
		expect(updates).not.toContainEqual({ kind: 'status', bridge: 'open' });
		stop();
	});
});
