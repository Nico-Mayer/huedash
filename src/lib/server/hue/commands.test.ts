import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
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

	it('does not accept color for single lights', () => {
		expect(lightCommandSchema.safeParse({ color: { hue: 0, saturation: 100 } }).success).toBe(
			false
		);
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
