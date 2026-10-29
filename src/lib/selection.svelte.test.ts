import { describe, expect, it } from 'vitest';
import { Selection } from './selection.svelte.ts';

describe('Selection', () => {
	it('selects only one light on a plain click', () => {
		const selection = new Selection();

		selection.only('ceiling');
		selection.only('counter');

		expect([...selection.ids]).toEqual(['counter']);
	});

	it('adds and removes lights with toggle', () => {
		const selection = new Selection();

		selection.only('ceiling');
		selection.toggle('counter');
		expect([...selection.ids]).toEqual(['ceiling', 'counter']);

		selection.toggle('counter');
		expect([...selection.ids]).toEqual(['ceiling']);
	});

	it('keeps the selection when select mode ends', () => {
		const selection = new Selection();

		selection.start();
		selection.toggle('ceiling');
		selection.done();

		expect(selection.selecting).toBe(false);
		expect(selection.has('ceiling')).toBe(true);
	});

	it('clears the selection and select mode for another group', () => {
		const selection = new Selection();
		selection.forGroup('room-kitchen');
		selection.start();
		selection.toggle('ceiling');

		selection.forGroup('room-kitchen');
		expect(selection.has('ceiling')).toBe(true);

		selection.forGroup('room-living');
		expect(selection.ids.size).toBe(0);
		expect(selection.selecting).toBe(false);
	});
});
