import { describe, expect, it } from 'vitest';
import type { PageServerLoadEvent } from './$types';
import { load } from './+page.server.ts';

const group = (kind: string, id: string) => ({ kind, id, name: id });

function run(result: unknown) {
	return load({
		parent: async () => ({ bridgeName: 'Hue', result })
	} as unknown as PageServerLoadEvent);
}

describe('home page load', () => {
	it('opens the first room', async () => {
		const home = { rooms: [group('room', 'room-kitchen')], zones: [group('zone', 'zone-down')] };

		await expect(run({ status: 'ok', home })).rejects.toMatchObject({
			status: 307,
			location: '/rooms/room-kitchen'
		});
	});

	it('opens the first zone without rooms', async () => {
		const home = { rooms: [], zones: [group('zone', 'zone-down')] };

		await expect(run({ status: 'ok', home })).rejects.toMatchObject({
			status: 307,
			location: '/zones/zone-down'
		});
	});

	it('stays on the page without rooms and zones', async () => {
		expect(await run({ status: 'ok', home: { rooms: [], zones: [] } })).toBeUndefined();
	});

	it('stays on the page when the bridge fails', async () => {
		expect(await run({ status: 'unreachable' })).toBeUndefined();
	});
});
