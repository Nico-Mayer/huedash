import { failureFromError, failureFromResponse, type BridgeFailure } from './bridge.ts';
import { createHueClient } from './client.ts';
import type { Connection } from './connection.ts';
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

export type MirekRange = { minMirek: number; maxMirek: number };

export type HomeLight = {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	reachable: boolean;
	colorTemperature: boolean;
	color: boolean;
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
};

export type Home = { rooms: HomeGroup[]; zones: HomeGroup[] };

export type HomeResources = {
	rooms: Room[];
	zones: Zone[];
	devices: Device[];
	lights: Light[];
	groupedLights: GroupedLight[];
	connectivity: Connectivity[];
};

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export function buildHome(resources: HomeResources): Home {
	const devices = new Map(resources.devices.map((d) => [d.id, d]));
	const connectivity = new Map(resources.connectivity.map((c) => [c.id, c.status]));
	const groupedLights = new Map(resources.groupedLights.map((g) => [g.id, g]));

	function reachable(light: Light): boolean {
		const device = devices.get(light.owner.rid);
		const service = device?.services.find((s) => s.rtype === 'zigbee_connectivity');
		const status = service ? connectivity.get(service.rid) : undefined;
		return status === undefined || status === 'connected';
	}

	const mirekRanges = new Map<string, MirekRange>();
	const lights = new Map<string, HomeLight>(
		resources.lights.map((light) => {
			const schema = light.color_temperature?.mirek_schema;
			if (schema?.mirek_minimum !== undefined && schema.mirek_maximum !== undefined) {
				mirekRanges.set(light.id, {
					minMirek: schema.mirek_minimum,
					maxMirek: schema.mirek_maximum
				});
			}
			return [
				light.id,
				{
					id: light.id,
					name: light.metadata.name,
					on: light.on.on ?? false,
					brightness: light.dimming ? Math.round(light.dimming.brightness ?? 0) : null,
					reachable: reachable(light),
					colorTemperature: schema !== undefined,
					color: light.color !== undefined
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
		const ranges = members.flatMap((light) => mirekRanges.get(light.id) ?? []);
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
			color: members.some((light) => light.color)
		};
	}

	const groups = (kind: HomeGroup['kind'], list: (Room | Zone)[]) =>
		list.flatMap((g) => toGroup(kind, g) ?? []).sort(byName);

	return { rooms: groups('room', resources.rooms), zones: groups('zone', resources.zones) };
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
			client.GET('/clip/v2/resource/zigbee_connectivity')
		]);

		const failed = responses.find(({ response }) => !response.ok);
		if (failed) return { status: failureFromResponse(failed.response) };

		const [rooms, zones, devices, lights, groupedLights, connectivity] = responses.map(
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
				connectivity: connectivity as Connectivity[]
			})
		};
	} catch (error) {
		return { status: failureFromError(error) };
	}
}
