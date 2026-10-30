import { describe, expect, it } from 'vitest';
import { createMockStore } from '../mocks/bridge/store.ts';
import { findGroup } from './group-page.ts';

const result = () => createMockStore().ready();

describe('findGroup', () => {
	it('finds a room with its lights', async () => {
		expect(findGroup('Hue', await result(), 'room', 'room-kitchen')).toMatchObject({
			status: 'ok',
			kind: 'room',
			group: { name: 'Kitchen' },
			lights: [{ name: 'Ceiling' }, { name: 'Counter' }]
		});
	});

	it('finds a zone', async () => {
		expect(findGroup('Hue', await result(), 'zone', 'zone-downstairs').group?.name).toBe(
			'Downstairs'
		);
	});

	it('returns no group for an unknown id', async () => {
		expect(findGroup('Hue', await result(), 'room', 'nope')).toMatchObject({
			status: 'ok',
			group: null,
			lights: []
		});
	});

	it('does not find a zone under the room route', async () => {
		expect(findGroup('Hue', await result(), 'room', 'zone-downstairs').group).toBeNull();
	});

	it('passes a bridge failure on', () => {
		expect(findGroup('Hue', { status: 'unreachable' }, 'room', 'room-kitchen')).toEqual({
			bridgeName: 'Hue',
			status: 'unreachable',
			kind: 'room',
			group: null,
			lights: []
		});
	});
});
