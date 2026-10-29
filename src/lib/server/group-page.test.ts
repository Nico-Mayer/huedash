import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_APP_KEY } from '../../mocks/bridge/fixtures.ts';
import { MOCK_BRIDGE_IP } from '../../mocks/bridge/handlers.ts';
import { getBridgeConfig } from './config/index.ts';
import { findGroup } from './group-page.ts';
import { connectionFor } from './hue/connection.ts';
import { loadHome } from './hue/home.ts';

beforeEach(() => {
	vi.stubEnv('HUE_BRIDGE_IP', MOCK_BRIDGE_IP);
	vi.stubEnv('HUE_APP_KEY', MOCK_APP_KEY);
});

afterEach(() => vi.unstubAllEnvs());

async function layoutData() {
	const config = (await getBridgeConfig())!;
	return {
		bridgeName: config.name,
		result: await loadHome({ ...connectionFor(config), appKey: config.appKey })
	};
}

describe('findGroup', () => {
	it('finds a room with its lights', async () => {
		expect(findGroup(await layoutData(), 'room', 'room-kitchen')).toMatchObject({
			status: 'ok',
			kind: 'room',
			group: { name: 'Kitchen', lights: [{ name: 'Ceiling' }, { name: 'Counter' }] }
		});
	});

	it('finds a zone', async () => {
		expect(findGroup(await layoutData(), 'zone', 'zone-downstairs').group?.name).toBe('Downstairs');
	});

	it('returns no group for an unknown id', async () => {
		expect(findGroup(await layoutData(), 'room', 'nope')).toMatchObject({
			status: 'ok',
			group: null
		});
	});

	it('does not find a zone under the room route', async () => {
		expect(findGroup(await layoutData(), 'room', 'zone-downstairs').group).toBeNull();
	});

	it('passes a bridge failure on', () => {
		expect(
			findGroup({ bridgeName: 'Hue', result: { status: 'unreachable' } }, 'room', 'room-kitchen')
		).toEqual({ bridgeName: 'Hue', status: 'unreachable', kind: 'room', group: null });
	});
});
