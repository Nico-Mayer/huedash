import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { home } from '../../../mocks/bridge/home.ts';
import { createMockStore, mockConnection } from '../../../mocks/bridge/store.ts';
import { server } from '../../../mocks/server.ts';
import {
	createCommandSender,
	groupCommandSchema,
	lightCommandSchema,
	mergeBodies,
	toClipBody
} from './commands.ts';
import type { HomeStore } from './store.ts';
import type { BridgeStream } from './stream.ts';

// Opens like the bridge stream but never reports a change, so tests see what commands apply.
function quietStream(): BridgeStream {
	const stream: BridgeStream = {
		onopen: null,
		onerror: null,
		onmessage: null,
		closed: false,
		close() {}
	};
	queueMicrotask(() => stream.onopen?.());
	return stream;
}

async function loadedStore(
	fetch: typeof globalThis.fetch = mockConnection.fetch
): Promise<HomeStore> {
	const store = createMockStore({
		connection: { ...mockConnection, fetch },
		openStream: quietStream
	});
	await store.ready();
	return store;
}

describe('command schemas', () => {
	it('clamps brightness into the bridge range', () => {
		expect(groupCommandSchema.parse({ brightness: 0, mirek: 1000 })).toEqual({
			brightness: 1,
			mirek: 1000
		});
		expect(lightCommandSchema.parse({ brightness: 140.4 })).toEqual({ brightness: 100 });
	});

	it.each([{}, { on: 'yes' }, { color: { hue: 400, saturation: 50 } }, { unknown: true }])(
		'rejects %j',
		(input) => {
			expect(groupCommandSchema.safeParse(input).success).toBe(false);
		}
	);
});

describe('toClipBody', () => {
	it('maps every field to its CLIP v2 shape', () => {
		const body = toClipBody({
			on: true,
			brightness: 40,
			mirek: 366,
			color: { hue: 0, saturation: 100 }
		});

		expect(body).toMatchObject({
			on: { on: true },
			dimming: { brightness: 40 },
			color_temperature: { mirek: 366 }
		});
		expect(body.color?.xy?.x).toBeCloseTo(0.64, 2);
	});

	it('clamps white to the given range', () => {
		expect(toClipBody({ mirek: 550 }, { minMirek: 153, maxMirek: 454 })).toEqual({
			color_temperature: { mirek: 454 }
		});
	});
});

describe('mergeBodies', () => {
	it('keeps the latest value of each property', () => {
		expect(
			mergeBodies(
				{ on: { on: true }, dimming: { brightness: 10 } },
				{ dimming: { brightness: 30 } }
			)
		).toEqual({ on: { on: true }, dimming: { brightness: 30 } });
	});

	it('keeps only the later of white and color', () => {
		const color = { xy: { x: 0.6, y: 0.3 } };

		expect(mergeBodies({ color_temperature: { mirek: 300 } }, { color })).toEqual({ color });
		expect(mergeBodies({ color }, { color_temperature: { mirek: 300 } })).toEqual({
			color_temperature: { mirek: 300 }
		});
	});
});

describe('createCommandSender', () => {
	it('sends a group command and applies it to the group and its lights', async () => {
		const store = await loadedStore();
		const { setGroup } = createCommandSender();
		const before = store.revision;

		const result = await setGroup(store, 'grouped-kitchen', { on: false });

		expect(result).toEqual({ ok: true, revision: store.revision });
		expect(store.revision).toBeGreaterThan(before);
		expect(home.commands).toEqual([
			{ rtype: 'grouped_light', id: 'grouped-kitchen', body: { on: { on: false } } }
		]);
		expect(store.home?.rooms[0].on).toBe(false);
		expect(store.home?.lights.ceiling.on).toBe(false);
		expect(store.home?.lights.counter.on).toBe(false);
		expect(store.home?.lights.lamp.on).toBe(false);
	});

	it('sends a light command to that light only and applies it', async () => {
		const store = await loadedStore();
		const { setLight } = createCommandSender();

		expect(await setLight(store, 'ceiling', { brightness: 25 })).toMatchObject({ ok: true });
		expect(home.commands).toEqual([
			{ rtype: 'light', id: 'ceiling', body: { dimming: { brightness: 25 } } }
		]);
		expect(store.home?.lights.ceiling.brightness).toBe(25);
		expect(store.home?.lights.counter.brightness).toBe(50);
	});

	it('shows a color instead of the white once a light accepts it', async () => {
		const store = await loadedStore();
		const { setLight } = createCommandSender();

		await setLight(store, 'ceiling', { color: { hue: 0, saturation: 100 } });

		expect(store.home?.lights.ceiling).toMatchObject({
			mirek: null,
			hueSaturation: { hue: expect.any(Number), saturation: expect.any(Number) }
		});
	});

	it('clamps white to the light range', async () => {
		const store = await loadedStore();
		const { setLight } = createCommandSender();

		await setLight(store, 'counter', { mirek: 550 });

		expect(home.commands).toEqual([
			{ rtype: 'light', id: 'counter', body: { color_temperature: { mirek: 454 } } }
		]);
	});

	it('clamps white to the range of the group lights', async () => {
		const store = await loadedStore();
		const { setGroup } = createCommandSender();

		await setGroup(store, 'grouped-living', { mirek: 100 });

		expect(home.commands).toEqual([
			{ rtype: 'grouped_light', id: 'grouped-living', body: { color_temperature: { mirek: 153 } } }
		]);
	});

	it('marks a recalled scene active and the other scenes of its room inactive', async () => {
		const store = await loadedStore();
		const { setScene } = createCommandSender();

		await setScene(store, 'scene-relax', { mode: 'active' });

		expect(store.home?.rooms[0].scenes.map((s) => [s.name, s.active])).toEqual([
			['Bright', 'inactive'],
			['Relax', 'static'],
			['Tropical', 'inactive']
		]);
	});

	it('answers not found for an unknown target without a bridge request', async () => {
		const store = await loadedStore();
		const { setGroup, setLight, setScene } = createCommandSender();

		expect(await setLight(store, 'missing', { on: true })).toEqual({
			ok: false,
			reason: 'not-found'
		});
		expect(await setGroup(store, 'missing', { on: true })).toEqual({
			ok: false,
			reason: 'not-found'
		});
		expect(await setScene(store, 'missing', { mode: 'active' })).toEqual({
			ok: false,
			reason: 'not-found'
		});
		expect(home.commands).toEqual([]);
	});

	it('reports a command the bridge refuses', async () => {
		server.use(
			http.put('*/clip/v2/resource/light/:id', () =>
				HttpResponse.json({ errors: [{ description: 'nope' }] }, { status: 400 })
			)
		);
		const store = await loadedStore();
		const { setLight } = createCommandSender();

		expect(await setLight(store, 'ceiling', { on: true })).toEqual({
			ok: false,
			reason: 'rejected'
		});
	});

	it('reports an unreachable bridge', async () => {
		server.use(http.put('*/clip/v2/resource/light/:id', () => HttpResponse.error()));
		const store = await loadedStore();
		const { setLight } = createCommandSender();

		expect(await setLight(store, 'ceiling', { on: true })).toEqual({
			ok: false,
			reason: 'unreachable'
		});
	});
});

describe('command rate limits', () => {
	// The mock logs a command only after a real network round trip, so count calls to fetch
	// to see when a command leaves.
	const fetchSpy = vi.fn(mockConnection.fetch);
	const sent = () => home.commands.map((c) => [c.id, c.body]);
	let store: HomeStore;

	beforeEach(async () => {
		store = await loadedStore(fetchSpy as typeof fetch);
		fetchSpy.mockClear();
		vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
	});

	afterEach(() => vi.useRealTimers());

	it('sends the first and last light change within 100 ms', async () => {
		const { setLight } = createCommandSender();

		const changes = [10, 20, 30].map((brightness) => setLight(store, 'ceiling', { brightness }));
		await vi.advanceTimersByTimeAsync(99);
		expect(fetchSpy).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(fetchSpy).toHaveBeenCalledTimes(2);

		await Promise.all(changes);
		expect(sent()).toEqual([
			['ceiling', { dimming: { brightness: 10 } }],
			['ceiling', { dimming: { brightness: 30 } }]
		]);
	});

	it('combines different light properties within 100 ms', async () => {
		const { setLight } = createCommandSender();

		const changes = [
			setLight(store, 'ceiling', { on: true }),
			setLight(store, 'ceiling', { color: { hue: 0, saturation: 100 } }),
			setLight(store, 'ceiling', { brightness: 40 })
		];
		await vi.advanceTimersByTimeAsync(100);
		await Promise.all(changes);

		expect(sent()).toEqual([
			['ceiling', { on: { on: true } }],
			['ceiling', { color: { xy: expect.any(Object) }, dimming: { brightness: 40 } }]
		]);
	});

	it('combines different group properties within 1 s', async () => {
		const { setGroup } = createCommandSender();

		const changes = [
			setGroup(store, 'grouped-kitchen', { on: true }),
			setGroup(store, 'grouped-kitchen', { mirek: 300 }),
			setGroup(store, 'grouped-kitchen', { brightness: 40 })
		];
		await vi.advanceTimersByTimeAsync(1000);
		const results = await Promise.all(changes);

		expect(sent()).toEqual([
			['grouped-kitchen', { on: { on: true } }],
			['grouped-kitchen', { color_temperature: { mirek: 300 }, dimming: { brightness: 40 } }]
		]);
		expect(results[1]).toEqual(results[2]);
	});

	it('limits each light on its own', async () => {
		const { setLight } = createCommandSender();

		const changes = [
			setLight(store, 'ceiling', { on: false }),
			setLight(store, 'counter', { on: false })
		];
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchSpy).toHaveBeenCalledTimes(2);

		await Promise.all(changes);
	});

	it('sends a second scene recall after 1 s', async () => {
		const { setScene } = createCommandSender();

		const recalls = [
			setScene(store, 'scene-tropical', { mode: 'active' }),
			setScene(store, 'scene-tropical', { mode: 'dynamic' })
		];
		await vi.advanceTimersByTimeAsync(999);
		expect(fetchSpy).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(fetchSpy).toHaveBeenCalledTimes(2);

		await Promise.all(recalls);
		expect(sent()).toEqual([
			['scene-tropical', { recall: { action: 'active' } }],
			['scene-tropical', { recall: { action: 'dynamic_palette' } }]
		]);
	});
});
