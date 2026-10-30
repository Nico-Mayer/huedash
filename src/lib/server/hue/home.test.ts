import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { home as mockHome } from '../../../mocks/bridge/home.ts';
import { createMockStore } from '../../../mocks/bridge/store.ts';
import { server } from '../../../mocks/server.ts';
import { lightsOf } from '../../group-page.ts';
import { buildHome, type Home, type HomeGroup, type HomeLight } from './home.ts';
import type { Resources } from './resources.ts';

let loaded: Home;

async function home(): Promise<Home> {
	const result = await createMockStore().ready();
	if (result.status !== 'ok') throw new Error(`home failed: ${result.status}`);
	loaded = result.home;
	return loaded;
}

const lights = (group: HomeGroup): HomeLight[] => lightsOf(loaded, group);

describe('buildHome', () => {
	it('lists rooms and zones sorted by name', async () => {
		const { rooms, zones } = await home();

		expect(rooms.map((r) => r.name)).toEqual(['Kitchen', 'Living room']);
		expect(zones.map((z) => z.name)).toEqual(['Downstairs']);
	});

	it('finds room lights through their devices, sorted by name', async () => {
		const [kitchen] = (await home()).rooms;

		expect(lights(kitchen).map((l) => l.name)).toEqual(['Ceiling', 'Counter']);
		expect(kitchen).toMatchObject({ groupedLightId: 'grouped-kitchen', on: true, brightness: 60 });
	});

	it('finds zone lights directly', async () => {
		const [downstairs] = (await home()).zones;

		expect(lights(downstairs).map((l) => l.name)).toEqual(['Ceiling', 'Lamp']);
	});

	it('combines the color temperature ranges and color support of the lights', async () => {
		const [kitchen, living] = (await home()).rooms;

		expect(kitchen.colorTemperature).toEqual({ minMirek: 153, maxMirek: 500 });
		expect(kitchen.color).toBe(true);
		expect(lights(living).find((l) => l.name === 'Plug')).toMatchObject({
			brightness: null,
			mirekRange: null,
			color: false
		});
	});

	it('reports the current white or color of each light', async () => {
		const [kitchen, living] = (await home()).rooms;
		const lamp = lights(living).find((l) => l.name === 'Lamp');

		expect(lights(kitchen)[0]).toMatchObject({
			mirekRange: { minMirek: 153, maxMirek: 500 },
			mirek: 366,
			hueSaturation: null
		});
		expect(lamp?.mirek).toBeNull();
		expect(lamp?.hueSaturation).toEqual({
			hue: expect.any(Number),
			saturation: expect.any(Number)
		});
		expect(lights(living).find((l) => l.name === 'Plug')).toMatchObject({
			mirek: null,
			hueSaturation: null
		});
	});

	it('gives each light a swatch for its white or color, and its product', async () => {
		const [kitchen, living] = (await home()).rooms;
		const [ceiling] = lights(kitchen);
		const [lamp, plug] = lights(living);

		expect(ceiling).toMatchObject({
			product: 'Hue White and Color Ambiance',
			swatch: expect.stringMatching(/^#[0-9a-f]{6}$/)
		});
		expect(lamp.swatch).toMatch(/^#[0-9a-f]{6}$/);
		expect(lamp.swatch).not.toBe(ceiling.swatch);
		expect(plug).toMatchObject({ product: 'Hue Smart Plug', swatch: null });
	});

	it('gives white stops from warm to cool over each white range', async () => {
		const [kitchen, living] = (await home()).rooms;
		const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
		const stops = lights(kitchen)[0].whiteStops!;
		const [warmR, , warmB] = channels(stops[0]);
		const [coolR, , coolB] = channels(stops.at(-1)!);

		expect(stops).toHaveLength(5);
		expect(warmR).toBeGreaterThan(warmB);
		expect(coolB).toBeGreaterThanOrEqual(coolR);
		expect(coolB).toBeGreaterThan(warmB);
		expect(kitchen.whiteStops).toEqual(stops);
		expect(lights(living).find((l) => l.name === 'Plug')?.whiteStops).toBeNull();
	});

	it('gives a scene no brightness when it sets none', async () => {
		const reading = mockHome.scenes.find((scene) => scene.id === 'scene-reading')!;
		for (const { action } of reading.actions) delete action.dimming;

		const living = (await home()).rooms[1];

		expect(living.scenes[0].brightness).toBeNull();
	});

	it('marks a light with a connectivity issue as unreachable', async () => {
		const living = (await home()).rooms[1];

		expect(lights(living).map((l) => [l.name, l.reachable])).toEqual([
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
		expect(kitchen.scenes.map((s) => s.brightness)).toEqual([100, 56, 80]);
		expect(living.scenes.map((s) => s.name)).toEqual(['Reading']);
		expect((await home()).zones[0].scenes).toEqual([]);
	});

	it('reports the active scene', async () => {
		const homeScene = mockHome.scenes.find((s) => s.id === 'scene-relax')!;
		homeScene.status = { active: 'static' };

		const relax = (await home()).rooms[0].scenes.find((s) => s.name === 'Relax');

		expect(relax?.active).toBe('static');
	});

	it('lists a light in a room and a zone once', async () => {
		const { lights: all, rooms, zones } = await home();

		expect(Object.keys(all).sort()).toEqual(['ceiling', 'counter', 'lamp', 'plug']);
		expect(rooms[0].lightIds).toEqual(['ceiling', 'counter']);
		expect(zones[0].lightIds).toEqual(['ceiling', 'lamp']);
	});

	it('reports a refused key', async () => {
		expect(await createMockStore({ appKey: 'wrong' }).ready()).toEqual({
			status: 'unauthorized'
		});
	});

	it('reports a failed read as unreachable instead of a partial home', async () => {
		server.use(http.get('*/clip/v2/resource/zone', () => HttpResponse.error()));

		expect(await createMockStore().ready()).toEqual({ status: 'unreachable' });
	});
});

function largeHome(): Resources {
	const ids = Array.from({ length: 50 }, (_, i) => `light-${i}`);
	const ref = (rid: string, rtype: string) => ({ rid, rtype });
	const rooms = Array.from({ length: 10 }, (_, r) => ({
		id: `room-${r}`,
		children: ids.slice(r * 5, r * 5 + 5).map((id) => ref(id, 'light')),
		services: [ref(`grouped-${r}`, 'grouped_light')],
		metadata: { name: `Room ${r}` }
	}));
	return {
		room: rooms,
		zone: [],
		device: ids.map((id) => ({
			id: `device-${id}`,
			product_data: { product_name: 'Hue White and Color Ambiance' },
			services: [ref(id, 'light'), ref(`zigbee-${id}`, 'zigbee_connectivity')]
		})),
		light: ids.map((id, i) => ({
			id,
			owner: ref(`device-${id}`, 'device'),
			metadata: { name: `Light ${i}` },
			on: { on: i % 2 === 0 },
			dimming: { brightness: 50 },
			color_temperature: {
				mirek: 366,
				mirek_valid: true,
				mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 }
			},
			color: { xy: { x: 0.45, y: 0.41 } }
		})),
		grouped_light: rooms.map((_, r) => ({
			id: `grouped-${r}`,
			on: { on: true },
			dimming: { brightness: 50 }
		})),
		zigbee_connectivity: ids.map((id) => ({ id: `zigbee-${id}`, status: 'connected' })),
		scene: Array.from({ length: 20 }, (_, s) => ({
			id: `scene-${s}`,
			group: ref(`room-${s % 10}`, 'room'),
			metadata: { name: `Scene ${s}` },
			actions: rooms[s % 10].children.map((child) => ({
				target: child,
				action: { on: { on: true }, dimming: { brightness: 80 }, color: { xy: { x: 0.6, y: 0.3 } } }
			})),
			palette: { color: [] },
			status: { active: 'inactive' as const }
		}))
	};
}

describe('home size', () => {
	// The whole home goes to every tab on each change, at most every 50 ms.
	// Measured at about 20.5 KB when the whole home was first sent.
	it('stays under 25 KB of JSON for 50 lights and 20 scenes', () => {
		expect(JSON.stringify(buildHome(largeHome())).length).toBeLessThan(25_000);
	});
});
