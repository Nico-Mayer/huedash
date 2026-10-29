import { failureFromError, failureFromResponse, type BridgeFailure } from './bridge.ts';
import type { HueSaturation } from '../../live-updates.ts';
import { createHueClient } from './client.ts';
import { xyToHueSaturation } from './color.ts';
import type { Connection } from './connection.ts';
import { sceneColors, swatchOf } from './scene-colors.ts';
import type { paths } from './schema.d.ts';

type ResourceData<P extends keyof paths> = paths[P] extends {
	get: { responses: { 200: { content: { 'application/json': { data?: (infer D)[] } } } } };
}
	? D
	: never;

type Room = ResourceData<'/clip/v2/resource/room'>;
type Zone = ResourceData<'/clip/v2/resource/zone'>;
type Device = ResourceData<'/clip/v2/resource/device'>;
type Light = ResourceData<'/clip/v2/resource/light'>;
type GroupedLight = ResourceData<'/clip/v2/resource/grouped_light'>;
type Connectivity = ResourceData<'/clip/v2/resource/zigbee_connectivity'>;
type Scene = ResourceData<'/clip/v2/resource/scene'>;

export type MirekRange = { minMirek: number; maxMirek: number };

export type HomeLight = {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	reachable: boolean;
	product: string | null;
	mirekRange: MirekRange | null;
	color: boolean;
	// Only one of these is set: the bridge reports either a white or a color for the light.
	mirek: number | null;
	hueSaturation: HueSaturation | null;
	swatch: string | null;
};

export type HomeScene = {
	id: string;
	name: string;
	colors: string[];
	brightness: number | null;
	dynamic: boolean;
	active: 'inactive' | 'static' | 'dynamic_palette';
};

export type HomeGroup = {
	kind: 'room' | 'zone';
	id: string;
	name: string;
	groupedLightId: string;
	on: boolean;
	brightness: number;
	lights: HomeLight[];
	colorTemperature: MirekRange | null;
	color: boolean;
	scenes: HomeScene[];
};

export type Home = { rooms: HomeGroup[]; zones: HomeGroup[] };

export type HomeResources = {
	rooms: Room[];
	zones: Zone[];
	devices: Device[];
	lights: Light[];
	groupedLights: GroupedLight[];
	connectivity: Connectivity[];
	scenes: Scene[];
};

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export function buildHome(resources: HomeResources): Home {
	const devices = new Map(resources.devices.map((d) => [d.id, d]));
	const connectivity = new Map(resources.connectivity.map((c) => [c.id, c.status]));
	const groupedLights = new Map(resources.groupedLights.map((g) => [g.id, g]));
	const scenesByGroup = Map.groupBy(
		resources.scenes.map((scene) => ({
			groupId: scene.group.rid,
			scene: {
				id: scene.id,
				name: scene.metadata.name ?? 'Scene',
				colors: sceneColors(scene.actions),
				brightness: averageBrightness(scene.actions),
				dynamic: (scene.palette?.color?.length ?? 0) > 0,
				active: scene.status?.active ?? 'inactive'
			} satisfies HomeScene
		})),
		(entry) => entry.groupId
	);

	function reachable(light: Light): boolean {
		const device = devices.get(light.owner.rid);
		const service = device?.services.find((s) => s.rtype === 'zigbee_connectivity');
		const status = service ? connectivity.get(service.rid) : undefined;
		return status === undefined || status === 'connected';
	}

	const lights = new Map<string, HomeLight>(
		resources.lights.map((light) => {
			const schema = light.color_temperature?.mirek_schema;
			const mirekRange =
				schema?.mirek_minimum !== undefined && schema.mirek_maximum !== undefined
					? { minMirek: schema.mirek_minimum, maxMirek: schema.mirek_maximum }
					: null;
			const white = light.color_temperature?.mirek_valid ? light.color_temperature.mirek : null;
			const xy = light.color?.xy;
			const mirek = white ?? null;
			return [
				light.id,
				{
					id: light.id,
					name: light.metadata.name,
					on: light.on.on ?? false,
					brightness: light.dimming ? Math.round(light.dimming.brightness ?? 0) : null,
					reachable: reachable(light),
					product: devices.get(light.owner.rid)?.product_data.product_name ?? null,
					mirekRange,
					color: light.color !== undefined,
					mirek,
					hueSaturation: mirek === null && xy ? xyToHueSaturation(xy) : null,
					swatch: swatchOf(mirek, xy)
				}
			];
		})
	);

	function lightIds(group: Room | Zone): string[] {
		return group.children.flatMap((child) => {
			if (child.rtype === 'light') return [child.rid];
			if (child.rtype !== 'device') return [];
			const device = devices.get(child.rid);
			return device?.services.filter((s) => s.rtype === 'light').map((s) => s.rid) ?? [];
		});
	}

	function toGroup(kind: HomeGroup['kind'], group: Room | Zone): HomeGroup | null {
		const groupedLightId = group.services.find((s) => s.rtype === 'grouped_light')?.rid;
		if (!groupedLightId) return null;

		const members = lightIds(group)
			.map((id) => lights.get(id))
			.filter((light) => light !== undefined)
			.sort(byName);
		const ranges = members.flatMap((light) => light.mirekRange ?? []);
		const state = groupedLights.get(groupedLightId);

		return {
			kind,
			id: group.id,
			name: group.metadata.name,
			groupedLightId,
			on: state?.on?.on ?? false,
			brightness: Math.round(state?.dimming?.brightness ?? 0),
			lights: members,
			colorTemperature: ranges.length
				? {
						minMirek: Math.min(...ranges.map((r) => r.minMirek)),
						maxMirek: Math.max(...ranges.map((r) => r.maxMirek))
					}
				: null,
			color: members.some((light) => light.color),
			scenes: (scenesByGroup.get(group.id) ?? []).map((entry) => entry.scene).sort(byName)
		};
	}

	const groups = (kind: HomeGroup['kind'], list: (Room | Zone)[]) =>
		list.flatMap((g) => toGroup(kind, g) ?? []).sort(byName);

	return { rooms: groups('room', resources.rooms), zones: groups('zone', resources.zones) };
}

function averageBrightness(actions: Scene['actions']): number | null {
	const levels = actions.flatMap(({ action }) => action.dimming?.brightness ?? []);
	return levels.length
		? Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length)
		: null;
}

export type HomeResult = { status: 'ok'; home: Home } | { status: BridgeFailure };

export async function loadHome(connection: Connection & { appKey: string }): Promise<HomeResult> {
	const client = createHueClient(connection);
	try {
		const responses = await Promise.all([
			client.GET('/clip/v2/resource/room'),
			client.GET('/clip/v2/resource/zone'),
			client.GET('/clip/v2/resource/device'),
			client.GET('/clip/v2/resource/light'),
			client.GET('/clip/v2/resource/grouped_light'),
			client.GET('/clip/v2/resource/zigbee_connectivity'),
			client.GET('/clip/v2/resource/scene')
		]);

		const failed = responses.find(({ response }) => !response.ok);
		if (failed) return { status: failureFromResponse(failed.response) };

		const [rooms, zones, devices, lights, groupedLights, connectivity, scenes] = responses.map(
			({ data }) => data?.data ?? []
		);
		return {
			status: 'ok',
			home: buildHome({
				rooms: rooms as Room[],
				zones: zones as Zone[],
				devices: devices as Device[],
				lights: lights as Light[],
				groupedLights: groupedLights as GroupedLight[],
				connectivity: connectivity as Connectivity[],
				scenes: scenes as Scene[]
			})
		};
	} catch (error) {
		return { status: failureFromError(error) };
	}
}
