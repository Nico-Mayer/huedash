import { afterEach, describe, expect, it } from 'vitest';
import {
	activeScene,
	groupOn,
	groupSummary,
	homeSummary,
	lightCounts,
	lightsSummary,
	onSwatches
} from './group-state.svelte.ts';
import { live } from './home.svelte.ts';
import type { HomeGroup, HomeLight, HomeScene } from './server/hue/home.ts';

const light = (id: string, on: boolean, reachable = true): HomeLight => ({
	id,
	name: id,
	on,
	brightness: 50,
	reachable,
	mirekRange: null,
	whiteStops: null,
	color: false,
	mirek: null,
	hueSaturation: null,
	product: null,
	swatch: null
});

const scene = (id: string, active: HomeScene['active'] = 'inactive'): HomeScene => ({
	id,
	name: id,
	colors: [],
	dynamic: false,
	active
});

const group = (lights: HomeLight[], scenes: HomeScene[] = []): HomeGroup => ({
	kind: 'room',
	id: 'room',
	name: 'Room',
	groupedLightId: 'grouped',
	on: lights.some((l) => l.on),
	brightness: 50,
	lightIds: lights.map((l) => l.id),
	colorTemperature: null,
	whiteStops: null,
	color: false,
	scenes
});

afterEach(() => {
	live.lights.clear();
	live.groups.clear();
	live.scenes.clear();
});

describe('lightCounts', () => {
	it('counts reachable lights that are on', () => {
		const counts = lightCounts([light('a', true), light('b', false), light('c', true, false)]);

		expect(counts).toEqual({ on: 1, total: 3, unreachable: 1 });
	});

	it('uses pending changes', () => {
		const lights = [light('a', true), light('b', false)];

		live.lights.begin('b', { on: true });

		expect(lightCounts(lights).on).toBe(2);
	});
});

describe('groupOn', () => {
	it('uses a pending group change', () => {
		const home = group([light('a', true)]);

		live.groups.begin('grouped', { on: false });

		expect(groupOn(home)).toBe(false);
	});
});

describe('activeScene', () => {
	it('finds the active scene', () => {
		expect(activeScene(group([], [scene('relax', 'static'), scene('bright')]))?.id).toBe('relax');
	});

	it('uses a pending recall', () => {
		const home = group([], [scene('relax', 'static'), scene('bright')]);

		live.scenes.begin('room', { relax: 'inactive', bright: 'static' });

		expect(activeScene(home)?.id).toBe('bright');
	});
});

describe('groupSummary', () => {
	it('names the active scene', () => {
		const lights = [light('a', true)];

		expect(groupSummary(group(lights, [scene('Relax', 'static')]), lights)).toBe('Relax');
	});

	it('counts lights that are on', () => {
		const lights = [light('a', true), light('b', true), light('c', false)];

		expect(groupSummary(group(lights), lights)).toBe('2 of 3 on');
	});

	it('says when all lights are off', () => {
		const lights = [light('a', false), light('b', false)];

		expect(groupSummary(group(lights), lights)).toBe('All off');
	});
});

describe('lightsSummary', () => {
	it('mentions unreachable lights', () => {
		const lights = [light('a', true), light('b', true), light('c', false, false)];

		expect(lightsSummary(lights)).toBe('2 of 3 lights on · 1 unreachable');
	});

	it('leaves out unreachable when all lights answer', () => {
		expect(lightsSummary([light('a', true), light('b', false)])).toBe('1 of 2 lights on');
	});
});

describe('onSwatches', () => {
	const colored = (id: string, swatch: string | null, on = true) => ({
		...light(id, on),
		swatch
	});

	it('lists the swatches of lights that are on, without duplicates, up to three', () => {
		const lights = [
			colored('a', '#ff0000'),
			colored('b', '#ff0000'),
			colored('c', '#00ff00', false),
			colored('d', null),
			colored('e', '#0000ff'),
			colored('f', '#ffffff')
		];

		expect(onSwatches(lights)).toEqual(['#ff0000', null, '#0000ff']);
	});

	it('leaves out a light that a pending change turns off', () => {
		live.lights.begin('a', { on: false });

		expect(onSwatches([colored('a', '#ff0000')])).toEqual([]);
	});
});

describe('homeSummary', () => {
	const homeOf = (lights: HomeLight[]) => ({
		lights: Object.fromEntries(lights.map((l) => [l.id, l])),
		rooms: [group(lights)],
		zones: []
	});

	it('counts only reachable lights as on', () => {
		const home = homeOf([light('a', true), light('b', false), light('c', true, false)]);

		expect(homeSummary(home)).toBe('1 of 3 lights on');
	});

	it('uses pending changes', () => {
		live.lights.begin('a', { on: true });

		expect(homeSummary(homeOf([light('a', false)]))).toBe('1 of 1 lights on');
	});
});
