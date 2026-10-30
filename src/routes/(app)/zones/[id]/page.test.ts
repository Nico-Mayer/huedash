import { describe, expect, it } from 'vitest';
import type { PageLoadEvent } from './$types';
import { load } from './+page.ts';

describe('zone page load', () => {
	it('passes the zone id on without loading anything', async () => {
		const event = { params: { id: 'zone-downstairs' } } as unknown as PageLoadEvent;

		expect(await load(event)).toEqual({ kind: 'zone', id: 'zone-downstairs' });
	});
});
