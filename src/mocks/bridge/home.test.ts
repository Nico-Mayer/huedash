import { describe, expect, it } from 'vitest';
import { MOCK_APP_KEY } from './fixtures.ts';
import { MOCK_BRIDGE_IP } from './handlers.ts';
import { home } from './home.ts';

const origin = `https://${MOCK_BRIDGE_IP}/clip/v2/resource`;
const headers = { 'hue-application-key': MOCK_APP_KEY };

async function read(type: string) {
	const response = await fetch(`${origin}/${type}`, { headers });
	return (await response.json()).data as { id: string; [key: string]: unknown }[];
}

describe('mock bridge home', () => {
	it.each(['room', 'zone', 'device', 'light', 'grouped_light', 'zigbee_connectivity'])(
		'serves %s resources',
		async (type) => {
			expect((await read(type)).length).toBeGreaterThan(0);
		}
	);

	it('derives group state from member lights', async () => {
		const kitchen = (await read('grouped_light')).find((g) => g.id === 'grouped-kitchen');

		expect(kitchen).toMatchObject({ on: { on: true }, dimming: { brightness: 60 } });
	});

	it('applies a group command to every member light and logs it', async () => {
		const response = await fetch(`${origin}/grouped_light/grouped-kitchen`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ on: { on: false } })
		});

		expect(response.status).toBe(200);
		const lights = await read('light');
		expect(lights.filter((l) => ['ceiling', 'counter'].includes(l.id))).toEqual([
			expect.objectContaining({ on: { on: false } }),
			expect.objectContaining({ on: { on: false } })
		]);
		expect(home.commands).toEqual([
			{ rtype: 'grouped_light', id: 'grouped-kitchen', body: { on: { on: false } } }
		]);
	});

	it('rejects unknown ids and missing keys', async () => {
		const unknown = await fetch(`${origin}/light/nope`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ on: { on: true } })
		});
		const anonymous = await fetch(`${origin}/room`);

		expect(unknown.status).toBe(404);
		expect(anonymous.status).toBe(403);
	});
});
