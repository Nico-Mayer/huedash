import { describe, expect, it } from 'vitest';
import type { PageLoadEvent } from './$types';
import { load } from './+page.ts';

describe('zone page load', () => {
	it('uses the home from the layout without calling the bridge', async () => {
		const home = {
			rooms: [],
			zones: [{ kind: 'zone', id: 'zone-downstairs', name: 'Downstairs' }]
		};
		const event = {
			params: { id: 'zone-downstairs' },
			parent: async () => ({ bridgeName: 'Hue', result: { status: 'ok', home } })
		} as unknown as PageLoadEvent;

		expect(await load(event)).toMatchObject({ status: 'ok', group: { name: 'Downstairs' } });
	});
});
