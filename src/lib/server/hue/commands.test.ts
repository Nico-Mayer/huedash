import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';
import { home } from '../../../mocks/bridge/home.ts';
import { server } from '../../../mocks/server.ts';
import {
	createCommandSender,
	groupCommandSchema,
	lightCommandSchema,
	toClipBody
} from './commands.ts';

const target = {
	origin: `https://${MOCK_BRIDGE_IP}`,
	fetch: ((...args) => globalThis.fetch(...args)) as typeof fetch,
	appKey: MOCK_APP_KEY
};

describe('command schemas', () => {
	it('clamps brightness and mirek into the bridge ranges', () => {
		expect(groupCommandSchema.parse({ brightness: 0, mirek: 1000 })).toEqual({
			brightness: 1,
			mirek: 500
		});
		expect(lightCommandSchema.parse({ brightness: 140.4 })).toEqual({ brightness: 100 });
	});

	it.each([{}, { on: 'yes' }, { color: { hue: 400, saturation: 50 } }, { unknown: true }])(
		'rejects %j',
		(input) => {
			expect(groupCommandSchema.safeParse(input).success).toBe(false);
		}
	);

	it('accepts white and color for single lights', () => {
		expect(lightCommandSchema.parse({ mirek: 600, color: { hue: 0, saturation: 100 } })).toEqual({
			mirek: 500,
			color: { hue: 0, saturation: 100 }
		});
	});
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
});

describe('createCommandSender', () => {
	it('sends a group command to the grouped light', async () => {
		const { setGroup } = createCommandSender();

		expect(await setGroup(target, 'grouped-kitchen', { on: false })).toEqual({ ok: true });
		expect(home.commands).toEqual([
			{ rtype: 'grouped_light', id: 'grouped-kitchen', body: { on: { on: false } } }
		]);
	});

	it('sends a light command to that light only', async () => {
		const { setLight } = createCommandSender();

		expect(await setLight(target, 'ceiling', { brightness: 25 })).toEqual({ ok: true });
		expect(home.commands).toEqual([
			{ rtype: 'light', id: 'ceiling', body: { dimming: { brightness: 25 } } }
		]);
	});

	it('reports a command the bridge refuses', async () => {
		const { setLight } = createCommandSender();

		expect(await setLight(target, 'missing', { on: true })).toEqual({
			ok: false,
			reason: 'rejected'
		});
	});

	it('reports an unreachable bridge', async () => {
		server.use(http.put('*/clip/v2/resource/light/:id', () => HttpResponse.error()));
		const { setLight } = createCommandSender();

		expect(await setLight(target, 'ceiling', { on: true })).toEqual({
			ok: false,
			reason: 'unreachable'
		});
	});
});

describe('command rate limits', () => {
	// The mock logs a command only after a real network round trip, so count calls to fetch
	// to see when a command leaves.
	const fetchSpy = vi.fn(target.fetch);
	const spiedTarget = { ...target, fetch: fetchSpy as typeof fetch };
	const sent = () => home.commands.map((c) => [c.id, c.body]);

	beforeEach(() => {
		fetchSpy.mockClear();
		vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
	});

	afterEach(() => vi.useRealTimers());

	it('sends the first and last light change within 100 ms', async () => {
		const { setLight } = createCommandSender();

		const changes = [10, 20, 30].map((brightness) =>
			setLight(spiedTarget, 'ceiling', { brightness })
		);
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

	it('limits each light on its own', async () => {
		const { setLight } = createCommandSender();

		const changes = [
			setLight(spiedTarget, 'ceiling', { on: false }),
			setLight(spiedTarget, 'counter', { on: false })
		];
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchSpy).toHaveBeenCalledTimes(2);

		await Promise.all(changes);
	});

	it('sends a second scene recall after 1 s', async () => {
		const { setScene } = createCommandSender();

		const recalls = [
			setScene(spiedTarget, 'scene-tropical', { mode: 'active' }),
			setScene(spiedTarget, 'scene-tropical', { mode: 'dynamic' })
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
