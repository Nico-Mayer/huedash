import { afterEach, describe, expect, it } from 'vitest';
import { MOCK_APP_KEY } from './fixtures.ts';
import { MOCK_BRIDGE_IP } from './handlers.ts';
import { home, onBridgeEvents, type BridgeEvent } from './home.ts';

const origin = `https://${MOCK_BRIDGE_IP}/clip/v2/resource`;
const headers = { 'hue-application-key': MOCK_APP_KEY };

const recall = (id: string, action: string) =>
	fetch(`${origin}/scene/${id}`, {
		method: 'PUT',
		headers,
		body: JSON.stringify({ recall: { action } })
	});

const status = (id: string) => home.scenes.find((s) => s.id === id)?.status.active;

let stop = () => {};
afterEach(() => stop());

describe('mock bridge scenes', () => {
	it('serves scenes with their group', async () => {
		const response = await fetch(`${origin}/scene`, { headers });
		const { data } = await response.json();

		expect(data.map((s: { metadata: { name: string } }) => s.metadata.name)).toEqual([
			'Bright',
			'Relax',
			'Tropical',
			'Reading'
		]);
	});

	it('applies a recalled scene to its lights and marks it active', async () => {
		expect((await recall('scene-relax', 'active')).status).toBe(200);

		expect(home.lights.find((l) => l.id === 'ceiling')).toMatchObject({
			on: { on: true },
			dimming: { brightness: 56 },
			color_temperature: { mirek: 447 }
		});
		expect(status('scene-relax')).toBe('static');
		expect(home.commands).toEqual([
			{ rtype: 'scene', id: 'scene-relax', body: { recall: { action: 'active' } } }
		]);
	});

	it('ends the previous scene of the room', async () => {
		await recall('scene-relax', 'active');
		await recall('scene-bright', 'active');

		expect(status('scene-relax')).toBe('inactive');
		expect(status('scene-bright')).toBe('static');
	});

	it('plays a scene with a palette dynamically', async () => {
		await recall('scene-tropical', 'dynamic_palette');

		expect(status('scene-tropical')).toBe('dynamic_palette');
	});

	it('ends the active scene when a light changes', async () => {
		await recall('scene-relax', 'active');

		await fetch(`${origin}/light/ceiling`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ on: { on: false } })
		});

		expect(status('scene-relax')).toBe('inactive');
	});

	it('publishes light, group and scene events', async () => {
		const events: BridgeEvent[] = [];
		stop = onBridgeEvents((published) => events.push(...published));

		await recall('scene-relax', 'active');

		const types = events.flatMap((event) => event.data.map((d) => `${d.type}:${d.id}`));
		expect(types).toEqual(
			expect.arrayContaining([
				'light:ceiling',
				'light:counter',
				'grouped_light:grouped-kitchen',
				'scene:scene-relax'
			])
		);
	});

	it('rejects an unknown scene', async () => {
		expect((await recall('nope', 'active')).status).toBe(404);
	});
});
