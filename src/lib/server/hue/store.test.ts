import { http, HttpResponse } from 'msw/http';
import { describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';
import {
	home as mockHome,
	publishEvents,
	updateEvent,
	type BridgeEvent
} from '../../../mocks/bridge/home.ts';
import { createMockStore, mockConnection } from '../../../mocks/bridge/store.ts';
import { mockBridgeStream } from '../../../mocks/bridge/stream.ts';
import { server } from '../../../mocks/server.ts';
import type { BridgeConfig } from '../config/index.ts';
import type { HomeResult } from './home.ts';
import { closeHomeStore, getHomeStore, type StoreUpdate } from './store.ts';
import type { BridgeStream } from './stream.ts';

function loaded(result: HomeResult) {
	if (result.status !== 'ok') throw new Error(`home failed: ${result.status}`);
	return result;
}

function collect() {
	const updates: StoreUpdate[] = [];
	const homes = () => updates.flatMap((u) => (u.kind === 'home' ? [u] : []));
	return { updates, homes, listener: (update: StoreUpdate) => updates.push(update) };
}

const event = (type: BridgeEvent['type'], data: BridgeEvent['data']): BridgeEvent => ({
	...updateEvent(data),
	type
});

function countingStore() {
	const fetch = vi.fn(mockConnection.fetch);
	let stream: BridgeStream | undefined;
	const store = createMockStore({
		connection: { ...mockConnection, fetch },
		openStream: () => (stream = mockBridgeStream())
	});
	return { store, fetch, stream: () => stream! };
}

describe('createHomeStore', () => {
	it('shares one load between page loads and answers later ones without the bridge', async () => {
		const { store, fetch } = countingStore();

		await Promise.all([store.ready(), store.ready(), store.ready()]);
		expect(fetch).toHaveBeenCalledTimes(7);

		loaded(await store.ready());
		expect(fetch).toHaveBeenCalledTimes(7);
	});

	it('applies a rename, a new room, a removed light, and a connectivity change', async () => {
		const { store, fetch } = countingStore();
		await store.ready();
		const { homes, listener } = collect();
		store.subscribe(listener);

		publishEvents([
			updateEvent([{ id: 'ceiling', type: 'light', metadata: { name: 'Pendant' } }]),
			event('add', [
				{
					id: 'room-office',
					type: 'room',
					children: [],
					services: [{ rid: 'grouped-office', rtype: 'grouped_light' }],
					metadata: { name: 'Office', archetype: 'office' }
				}
			]),
			event('delete', [{ id: 'plug', type: 'light' }]),
			updateEvent([{ id: 'zigbee-lamp', type: 'zigbee_connectivity', status: 'disconnected' }])
		]);

		await vi.waitFor(() => expect(homes()).toHaveLength(2));
		const { home } = homes()[1];
		expect(home.lights.ceiling.name).toBe('Pendant');
		expect(home.rooms.map((r) => r.name)).toEqual(['Kitchen', 'Living room', 'Office']);
		expect(home.lights.plug).toBeUndefined();
		expect(home.lights.lamp.reachable).toBe(false);
		expect(fetch).toHaveBeenCalledTimes(7);
	});

	it('sends changes within 50 ms as one new home', async () => {
		const { store } = countingStore();
		const { revision } = loaded(await store.ready());
		const { homes, listener } = collect();
		store.subscribe(listener);

		publishEvents([updateEvent([{ id: 'ceiling', type: 'light', on: { on: false } }])]);
		publishEvents([updateEvent([{ id: 'counter', type: 'light', on: { on: false } }])]);

		await vi.waitFor(() => expect(homes()).toHaveLength(2));
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(homes()).toHaveLength(2);
		expect(homes()[1].revision).toBeGreaterThan(revision);
		expect(homes()[1].home.lights.ceiling.on).toBe(false);
		expect(homes()[1].home.lights.counter.on).toBe(false);
	});

	it('ignores malformed events and invalid changes', async () => {
		const { store, stream } = countingStore();
		const { revision } = loaded(await store.ready());
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		stream().onmessage?.({ data: 'not json' });
		stream().onmessage?.({ data: JSON.stringify({ unknown: true }) });
		stream().onmessage?.({
			data: JSON.stringify([updateEvent([{ id: 'ceiling', type: 'light', metadata: { name: 7 } }])])
		});
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(store.revision).toBe(revision);
		expect(store.home?.lights.ceiling.name).toBe('Ceiling');
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});

	it('applies events that arrive while the resources load', async () => {
		server.use(
			http.get('*/clip/v2/resource/light', () => {
				publishEvents([
					updateEvent([{ id: 'ceiling', type: 'light', metadata: { name: 'Pendant' } }])
				]);
				return HttpResponse.json({ errors: [], data: mockHome.lights });
			})
		);
		const { store } = countingStore();

		expect(loaded(await store.ready()).home.lights.ceiling.name).toBe('Pendant');
	});

	it('loads everything again after the stream reconnects', async () => {
		const { store, stream, fetch } = countingStore();
		await store.ready();
		const { updates, homes, listener } = collect();
		store.subscribe(listener);
		mockHome.lights[0].metadata.name = 'Pendant';

		stream().onerror?.();
		stream().onopen?.();

		await vi.waitFor(() => expect(homes().at(-1)?.home.lights.ceiling.name).toBe('Pendant'));
		expect(fetch).toHaveBeenCalledTimes(14);
		expect(updates).toContainEqual({ kind: 'status', bridge: 'reconnecting' });
		expect(updates.at(-2)).toEqual({ kind: 'status', bridge: 'open' });
	});

	it('applies an accepted command at once and returns its revision', async () => {
		const { store } = countingStore();
		const { revision } = loaded(await store.ready());

		const next = store.apply([{ type: 'light', id: 'ceiling', data: { on: { on: false } } }]);

		expect(next).toBeGreaterThan(revision);
		expect(store.home?.lights.ceiling.on).toBe(false);
	});
});

describe('getHomeStore', () => {
	const config = (appKey: string): BridgeConfig => ({
		source: 'env',
		address: { host: MOCK_BRIDGE_IP, port: 443, origin: `https://${MOCK_BRIDGE_IP}` },
		name: MOCK_BRIDGE_IP,
		appKey,
		certSha256: null
	});

	async function listening(appKey: string) {
		const store = getHomeStore(config(appKey));
		await store.ready();
		const { homes, listener } = collect();
		store.subscribe(listener);
		return { store, homes };
	}

	const renameCeiling = () =>
		publishEvents([updateEvent([{ id: 'ceiling', type: 'light', metadata: { name: 'Pendant' } }])]);

	it('keeps one store per configuration', () => {
		expect(getHomeStore(config(MOCK_APP_KEY))).toBe(getHomeStore(config(MOCK_APP_KEY)));
	});

	it('closes the old store when the configuration changes', async () => {
		const old = await listening(MOCK_APP_KEY);

		expect(getHomeStore(config('other-key'))).not.toBe(old.store);
		renameCeiling();
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(old.homes()).toHaveLength(1);
	});

	it('closes the store when the bridge is forgotten', async () => {
		const { homes } = await listening(MOCK_APP_KEY);

		closeHomeStore();
		renameCeiling();
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(homes()).toHaveLength(1);
	});
});
