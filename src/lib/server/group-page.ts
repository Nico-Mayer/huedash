import { redirect } from '@sveltejs/kit';
import { getBridgeConfig } from './config/index.ts';
import { connectionFor } from './hue/connection.ts';
import { loadHome, type HomeGroup } from './hue/home.ts';
import type { BridgeFailure } from './hue/bridge.ts';

export type GroupPageData =
	| { bridgeName: string; status: 'ok'; kind: HomeGroup['kind']; group: HomeGroup | null }
	| { bridgeName: string; status: BridgeFailure; kind: HomeGroup['kind']; group: null };

export async function loadGroupPage(kind: HomeGroup['kind'], id: string): Promise<GroupPageData> {
	const config = await getBridgeConfig();
	if (!config) redirect(303, '/setup');

	const result = await loadHome({ ...connectionFor(config), appKey: config.appKey });
	if (result.status !== 'ok')
		return { bridgeName: config.name, status: result.status, kind, group: null };

	const groups = kind === 'room' ? result.home.rooms : result.home.zones;
	return {
		bridgeName: config.name,
		status: 'ok',
		kind,
		group: groups.find((group) => group.id === id) ?? null
	};
}
