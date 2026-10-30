import { describe, expect, it } from 'vitest';
import type { PageLoadEvent } from './$types';
import { load } from './+page.ts';

describe('room page load', () => {
	it('passes the room id on without loading anything', async () => {
		const event = { params: { id: 'room-kitchen' } } as unknown as PageLoadEvent;

		expect(await load(event)).toEqual({ kind: 'room', id: 'room-kitchen' });
	});
});
