import type { HueSaturation } from '../../live-updates.ts';
import type { BridgeFailure } from './bridge.ts';
import { xyToHueSaturation } from './color.ts';
import type { Resource, Resources } from './resources.ts';
import { sceneColors, swatchOf, whiteStops } from './scene-colors.ts';

export type MirekRange = { minMirek: number; maxMirek: number };

export type HomeLight = {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	reachable: boolean;
	product: string | null;
	mirekRange: MirekRange | null;
	whiteStops: string[] | null;
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
	lightIds: string[];
	colorTemperature: MirekRange | null;
	whiteStops: string[] | null;
	color: boolean;
	scenes: HomeScene[];
};

export type Home = { lights: Record<string, HomeLight>; rooms: HomeGroup[]; zones: HomeGroup[] };

export type HomeResult = { status: 'ok'; revision: number; home: Home } | { status: BridgeFailure };

type Group = Resource<'room'>;
type Light = Resource<'light'>;

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export function buildHome(resources: Resources): Home {
	const devices = new Map(resources.device.map((d) => [d.id, d]));
	const connectivity = new Map(resources.zigbee_connectivity.map((c) => [c.id, c.status]));
	const groupedLights = new Map(resources.grouped_light.map((g) => [g.id, g]));
	const scenesByGroup = Map.groupBy(
		resources.scene.map((scene) => ({
			groupId: scene.group.rid,
			scene: {
				id: scene.id,
				name: scene.metadata.name ?? 'Scene',
				colors: sceneColors(scene.actions),
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
		resources.light.map((light) => {
			const schema = light.color_temperature?.mirek_schema;
			const mirekRange =
				schema?.mirek_minimum !== undefined && schema.mirek_maximum !== undefined
					? { minMirek: schema.mirek_minimum, maxMirek: schema.mirek_maximum }
					: null;
			const mirek = light.color_temperature?.mirek_valid
				? (light.color_temperature.mirek ?? null)
				: null;
			const xy = light.color?.xy;
			return [
				light.id,
				{
					id: light.id,
					name: light.metadata.name,
					on: light.on.on,
					brightness: light.dimming ? Math.round(light.dimming.brightness ?? 0) : null,
					reachable: reachable(light),
					product: devices.get(light.owner.rid)?.product_data.product_name ?? null,
					mirekRange,
					whiteStops: mirekRange && whiteStops(mirekRange.minMirek, mirekRange.maxMirek),
					color: light.color !== undefined,
					mirek,
					hueSaturation: mirek === null && xy ? xyToHueSaturation(xy) : null,
					swatch: swatchOf(mirek, xy)
				}
			];
		})
	);

	function lightIds(group: Group): string[] {
		return group.children.flatMap((child) => {
			if (child.rtype === 'light') return [child.rid];
			if (child.rtype !== 'device') return [];
			const device = devices.get(child.rid);
			return device?.services.filter((s) => s.rtype === 'light').map((s) => s.rid) ?? [];
		});
	}

	function toGroup(kind: HomeGroup['kind'], group: Group): HomeGroup | null {
		const groupedLightId = group.services.find((s) => s.rtype === 'grouped_light')?.rid;
		if (!groupedLightId) return null;

		const members = lightIds(group)
			.flatMap((id) => lights.get(id) ?? [])
			.sort(byName);
		const ranges = members.flatMap((light) => light.mirekRange ?? []);
		const colorTemperature = ranges.length
			? {
					minMirek: Math.min(...ranges.map((r) => r.minMirek)),
					maxMirek: Math.max(...ranges.map((r) => r.maxMirek))
				}
			: null;
		const state = groupedLights.get(groupedLightId);

		return {
			kind,
			id: group.id,
			name: group.metadata.name,
			groupedLightId,
			on: state?.on?.on ?? false,
			brightness: Math.round(state?.dimming?.brightness ?? 0),
			lightIds: members.map((light) => light.id),
			colorTemperature,
			whiteStops:
				colorTemperature && whiteStops(colorTemperature.minMirek, colorTemperature.maxMirek),
			color: members.some((light) => light.color),
			scenes: (scenesByGroup.get(group.id) ?? []).map((entry) => entry.scene).sort(byName)
		};
	}

	const groups = (kind: HomeGroup['kind'], list: Group[]) =>
		list.flatMap((g) => toGroup(kind, g) ?? []).sort(byName);

	return {
		lights: Object.fromEntries(lights),
		rooms: groups('room', resources.room),
		zones: groups('zone', resources.zone)
	};
}
