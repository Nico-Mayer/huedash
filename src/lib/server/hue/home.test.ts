import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { MOCK_APP_KEY } from '../../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../../mocks/bridge/handlers.ts';
import { home as mockHome } from '../../../mocks/bridge/home.ts';
import { server } from '../../../mocks/server.ts';
import { loadHome, type Home } from './home.ts';

const connection = {
	origin: `https://${MOCK_BRIDGE_IP}`,
	fetch: ((...args) => globalThis.fetch(...args)) as typeof fetch,
	appKey: MOCK_APP_KEY
};

async function home(): Promise<Home> {
	const result = await loadHome(connection);
	if (result.status !== 'ok') throw new Error(`home failed: ${result.status}`);
	return result.home;
}

describe('loadHome', () => {
	it('lists rooms and zones sorted by name', async () => {
		const { rooms, zones } = await home();

		expect(rooms.map((r) => r.name)).toEqual(['Kitchen', 'Living room']);
		expect(zones.map((z) => z.name)).toEqual(['Downstairs']);
	});

	it('finds room lights through their devices, sorted by name', async () => {
		const [kitchen] = (await home()).rooms;

		expect(kitchen.lights.map((l) => l.name)).toEqual(['Ceiling', 'Counter']);
		expect(kitchen).toMatchObject({ groupedLightId: 'grouped-kitchen', on: true, brightness: 60 });
	});

	it('finds zone lights directly', async () => {
		const [downstairs] = (await home()).zones;

		expect(downstairs.lights.map((l) => l.name)).toEqual(['Ceiling', 'Lamp']);
	});

	it('combines the color temperature ranges and color support of the lights', async () => {
		const [kitchen, living] = (await home()).rooms;

		expect(kitchen.colorTemperature).toEqual({ minMirek: 153, maxMirek: 500 });
		expect(kitchen.color).toBe(true);
		expect(living.lights.find((l) => l.name === 'Plug')).toMatchObject({
			brightness: null,
			mirekRange: null,
			color: false
		});
	});

	it('reports the current white or color of each light', async () => {
		const [kitchen, living] = (await home()).rooms;
		const lamp = living.lights.find((l) => l.name === 'Lamp');

		expect(kitchen.lights[0]).toMatchObject({
			mirekRange: { minMirek: 153, maxMirek: 500 },
			mirek: 366,
			hueSaturation: null
		});
		expect(lamp?.mirek).toBeNull();
		expect(lamp?.hueSaturation).toEqual({
			hue: expect.any(Number),
			saturation: expect.any(Number)
		});
		expect(living.lights.find((l) => l.name === 'Plug')).toMatchObject({
			mirek: null,
			hueSaturation: null
		});
	});

	it('marks a light with a connectivity issue as unreachable', async () => {
		const living = (await home()).rooms[1];

		expect(living.lights.map((l) => [l.name, l.reachable])).toEqual([
			['Lamp', true],
			['Plug', false]
		]);
	});

	it('attaches scenes to their room, sorted by name, with colors and a dynamic flag', async () => {
		const [kitchen, living] = (await home()).rooms;

		expect(kitchen.scenes.map((s) => [s.name, s.dynamic, s.active])).toEqual([
			['Bright', false, 'inactive'],
			['Relax', false, 'inactive'],
			['Tropical', true, 'inactive']
		]);
		expect(kitchen.scenes[2].colors).toHaveLength(2);
		expect(living.scenes.map((s) => s.name)).toEqual(['Reading']);
		expect((await home()).zones[0].scenes).toEqual([]);
	});

	it('reports the active scene', async () => {
		const homeScene = mockHome.scenes.find((s) => s.id === 'scene-relax')!;
		homeScene.status = { active: 'static' };

		const relax = (await home()).rooms[0].scenes.find((s) => s.name === 'Relax');

		expect(relax?.active).toBe('static');
	});

	it('reports a refused key', async () => {
		expect(await loadHome({ ...connection, appKey: 'wrong' })).toEqual({ status: 'unauthorized' });
	});

	it('reports a failed read as unreachable instead of a partial home', async () => {
		server.use(http.get('*/clip/v2/resource/zone', () => HttpResponse.error()));

		expect(await loadHome(connection)).toEqual({ status: 'unreachable' });
	});
});
