import type { BridgeFailure } from './server/hue/bridge.ts';
import type { HomeGroup, HomeResult } from './server/hue/home.ts';

export type GroupPageData =
	| { bridgeName: string; status: 'ok'; kind: HomeGroup['kind']; group: HomeGroup | null }
	| { bridgeName: string; status: BridgeFailure; kind: HomeGroup['kind']; group: null };

export function findGroup(
	{ bridgeName, result }: { bridgeName: string; result: HomeResult },
	kind: HomeGroup['kind'],
	id: string
): GroupPageData {
	if (result.status !== 'ok') return { bridgeName, status: result.status, kind, group: null };

	const groups = kind === 'room' ? result.home.rooms : result.home.zones;
	return {
		bridgeName,
		status: 'ok',
		kind,
		group: groups.find((group) => group.id === id) ?? null
	};
}
