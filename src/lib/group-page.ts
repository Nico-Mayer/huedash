import type { BridgeFailure } from './server/hue/bridge.ts';
import type { Home, HomeGroup, HomeLight, HomeResult } from './server/hue/home.ts';

export const lightsOf = (home: Home, group: HomeGroup): HomeLight[] =>
	group.lightIds.flatMap((id) => home.lights[id] ?? []);

export type GroupPageData =
	| {
			bridgeName: string;
			status: 'ok';
			kind: HomeGroup['kind'];
			group: HomeGroup | null;
			lights: HomeLight[];
	  }
	| {
			bridgeName: string;
			status: BridgeFailure;
			kind: HomeGroup['kind'];
			group: null;
			lights: HomeLight[];
	  };

export function findGroup(
	bridgeName: string,
	result: HomeResult,
	kind: HomeGroup['kind'],
	id: string
): GroupPageData {
	if (result.status !== 'ok')
		return { bridgeName, status: result.status, kind, group: null, lights: [] };

	const groups = kind === 'room' ? result.home.rooms : result.home.zones;
	const group = groups.find((g) => g.id === id) ?? null;
	return {
		bridgeName,
		status: 'ok',
		kind,
		group,
		lights: group ? lightsOf(result.home, group) : []
	};
}
