import { describe, expect, it } from 'vitest';
import type { PageLoadEvent } from './$types';
import { load } from './+page.ts';

describe('room page load', () => {
	it('uses the home from the layout without calling the bridge', async () => {
		const home = { rooms: [{ kind: 'room', id: 'room-kitchen', name: 'Kitchen' }], zones: [] };
		const event = {
			params: { id: 'room-kitchen' },
			parent: async () => ({ bridgeName: 'Hue', result: { status: 'ok', home } })
		} as unknown as PageLoadEvent;

		expect(await load(event)).toMatchObject({ status: 'ok', group: { name: 'Kitchen' } });
	});
});
