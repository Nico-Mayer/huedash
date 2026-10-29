import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../mocks/bridge/handlers.ts';
import { loadGroupPage } from './group-page.ts';

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => vi.unstubAllEnvs());

describe('loadGroupPage', () => {
	it('finds a room with its lights', async () => {
		const data = await loadGroupPage('room', 'room-kitchen');

		expect(data).toMatchObject({
			status: 'ok',
			kind: 'room',
			group: { name: 'Kitchen', lights: [{ name: 'Ceiling' }, { name: 'Counter' }] }
		});
	});

	it('finds a zone', async () => {
		expect((await loadGroupPage('zone', 'zone-downstairs')).group?.name).toBe('Downstairs');
	});

	it('returns no group for an unknown id', async () => {
		expect(await loadGroupPage('room', 'nope')).toMatchObject({ status: 'ok', group: null });
	});

	it('does not find a zone under the room route', async () => {
		expect((await loadGroupPage('room', 'zone-downstairs')).group).toBeNull();
	});
});
