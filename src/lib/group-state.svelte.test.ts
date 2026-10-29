import { afterEach, describe, expect, it } from 'vitest';
import {
	activeScene,
	groupOn,
	groupSummary,
	lightCounts,
	lightsSummary
} from './group-state.svelte.ts';
import { live } from './live.svelte.ts';
import type { HomeGroup, HomeLight, HomeScene } from './server/hue/home.ts';

const light = (id: string, on: boolean, reachable = true): HomeLight => ({
	id,
	name: id,
	on,
	brightness: 50,
	reachable,
	mirekRange: null,
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
	lights,
	colorTemperature: null,
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
		const counts = lightCounts(
			group([light('a', true), light('b', false), light('c', true, false)])
		);

		expect(counts).toEqual({ on: 1, total: 3, unreachable: 1 });
	});

	it('uses live overrides', () => {
		const home = group([light('a', true), light('b', false)]);

		live.apply({ kind: 'light', id: 'b', on: true });

		expect(lightCounts(home).on).toBe(2);
	});
});

describe('groupOn', () => {
	it('uses the live group state', () => {
		const home = group([light('a', true)]);

		live.apply({ kind: 'group', id: 'grouped', on: false });

		expect(groupOn(home)).toBe(false);
	});
});

describe('activeScene', () => {
	it('finds the active scene', () => {
		expect(activeScene(group([], [scene('relax', 'static'), scene('bright')]))?.id).toBe('relax');
	});

	it('follows live scene changes', () => {
		const home = group([], [scene('relax', 'static'), scene('bright')]);

		live.apply({ kind: 'scene', id: 'relax', active: 'inactive' });

		expect(activeScene(home)).toBeUndefined();
	});
});

describe('groupSummary', () => {
	it('names the active scene', () => {
		expect(groupSummary(group([light('a', true)], [scene('Relax', 'static')]))).toBe('Relax');
	});

	it('counts lights that are on', () => {
		const lights = [light('a', true), light('b', true), light('c', false)];

		expect(groupSummary(group(lights))).toBe('2 of 3 on');
	});

	it('says when all lights are off', () => {
		expect(groupSummary(group([light('a', false), light('b', false)]))).toBe('All off');
	});
});

describe('lightsSummary', () => {
	it('mentions unreachable lights', () => {
		const lights = [light('a', true), light('b', true), light('c', false, false)];

		expect(lightsSummary(group(lights))).toBe('2 of 3 lights on · 1 unreachable');
	});

	it('leaves out unreachable when all lights answer', () => {
		expect(lightsSummary(group([light('a', true), light('b', false)]))).toBe('1 of 2 lights on');
	});
});
