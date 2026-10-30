import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { http, HttpResponse, type HttpHandler } from 'msw/http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createBridgeCertificate } from '../../../mocks/bridge/certificate.ts';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { handlers } from '../../../mocks/bridge/handlers.ts';
import { handlersListener } from '../../../mocks/serve.ts';
import { server as mockServer } from '../../../mocks/server.ts';
import { createHomeStore, type HomeStore, type StoreUpdate } from './store.ts';
import { createBridgeAgent, fetchWith } from './tls.ts';

// The setup file replaces the stream for other tests; this one talks to a real HTTPS mock bridge,
// because aborting a streamed response inside MSW's interceptor trips an undici assertion.
const { openBridgeStream } = await vi.importActual<typeof import('./stream.ts')>('./stream.ts');

const active: HttpHandler[] = [...handlers];
let bridge: Server;
let store: HomeStore | undefined;
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
	store?.close();
	active.splice(0, active.length, ...handlers);
});

afterAll(async () => {
	bridge.closeAllConnections();
	await new Promise<void>((resolve) => bridge.close(() => resolve()));
	mockServer.listen({ onUnhandledFrame: 'error' });
});

function collect() {
	const updates: StoreUpdate[] = [];
	return { updates, listener: (update: StoreUpdate) => updates.push(update) };
}

const switchLamp = (on: boolean) =>
	connection.fetch(`${connection.origin}/clip/v2/resource/light/lamp`, {
		method: 'PUT',
		headers: { 'hue-application-key': MOCK_APP_KEY },
		body: JSON.stringify({ on: { on } })
	});

describe('createHomeStore with the bridge event stream', () => {
	it('opens the stream, loads the home, and follows bridge events', async () => {
		store = createHomeStore({ connection, appKey: MOCK_APP_KEY, openStream: openBridgeStream });
		const { updates, listener } = collect();

		store.subscribe(listener);
		await vi.waitFor(() => expect(updates).toContainEqual({ kind: 'status', bridge: 'open' }));
		await vi.waitFor(() => expect(store?.home?.lights.lamp.on).toBe(false));

		await switchLamp(true);

		await vi.waitFor(() =>
			expect(updates).toContainEqual(
				expect.objectContaining({
					kind: 'home',
					home: expect.objectContaining({
						lights: expect.objectContaining({ lamp: expect.objectContaining({ on: true }) })
					})
				})
			)
		);
	});

	it('keeps the stream open without listeners', async () => {
		store = createHomeStore({ connection, appKey: MOCK_APP_KEY, openStream: openBridgeStream });
		store.subscribe(() => {})();
		await store.ready();
		await new Promise((resolve) => setTimeout(resolve, 100));

		await switchLamp(true);

		await vi.waitFor(() => expect(store?.home?.lights.lamp.on).toBe(true));
	});

	it('reports reconnecting when the bridge refuses the stream and retries', async () => {
		let attempts = 0;
		active.unshift(
			http.get('*/eventstream/clip/v2', () => {
				attempts++;
				return new HttpResponse(null, { status: 503 });
			})
		);
		store = createHomeStore({
			connection,
			appKey: MOCK_APP_KEY,
			openStream: openBridgeStream,
			restartMs: 20
		});
		const { updates, listener } = collect();

		store.subscribe(listener);

		await vi.waitFor(() => expect(attempts).toBeGreaterThanOrEqual(2));
		expect(updates).toContainEqual({ kind: 'status', bridge: 'reconnecting' });
		expect(updates).not.toContainEqual({ kind: 'status', bridge: 'open' });
	});
});
