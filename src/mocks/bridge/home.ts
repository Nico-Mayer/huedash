type Ref = { rid: string; rtype: string };

type MockLight = {
	id: string;
	type: 'light';
	owner: Ref;
	metadata: { name: string; archetype: string };
	on: { on: boolean };
	dimming?: { brightness: number; min_dim_level: number };
	color_temperature?: {
		mirek: number | null;
		mirek_valid: boolean;
		mirek_schema: { mirek_minimum: number; mirek_maximum: number };
	};
	color?: { xy: { x: number; y: number }; gamut_type: string };
};

type SceneAction = {
	target: Ref;
	action: {
		on?: { on: boolean };
		dimming?: { brightness: number };
		color?: { xy: { x: number; y: number } };
		color_temperature?: { mirek: number };
	};
};

type MockScene = {
	id: string;
	type: 'scene';
	group: Ref;
	metadata: { name: string };
	actions: SceneAction[];
	palette?: {
		color: { color: { xy: { x: number; y: number } }; dimming: { brightness: number } }[];
	};
	speed: number;
	auto_dynamic: boolean;
	status: { active: 'inactive' | 'static' | 'dynamic_palette' };
};

type MockGroup = {
	id: string;
	type: 'room' | 'zone';
	children: Ref[];
	services: Ref[];
	metadata: { name: string; archetype: string };
};

const ref = (rid: string, rtype: string): Ref => ({ rid, rtype });

function light(
	id: string,
	name: string,
	options: { on: boolean; brightness?: number; mirek?: [number, number]; color?: boolean }
): MockLight {
	return {
		id,
		type: 'light',
		owner: ref(`device-${id}`, 'device'),
		metadata: { name, archetype: 'classic_bulb' },
		on: { on: options.on },
		...(options.brightness !== undefined && {
			dimming: { brightness: options.brightness, min_dim_level: 0.2 }
		}),
		...(options.mirek && {
			color_temperature: {
				mirek: 366,
				mirek_valid: true,
				mirek_schema: { mirek_minimum: options.mirek[0], mirek_maximum: options.mirek[1] }
			}
		}),
		...(options.color && { color: { xy: { x: 0.4573, y: 0.41 }, gamut_type: 'C' } })
	};
}

function initialHome() {
	const lights = [
		light('ceiling', 'Ceiling', { on: true, brightness: 70, mirek: [153, 500], color: true }),
		light('counter', 'Counter', { on: true, brightness: 50, mirek: [153, 454] }),
		light('lamp', 'Lamp', { on: false, brightness: 30, mirek: [153, 500], color: true }),
		light('plug', 'Plug', { on: false })
	];

	const devices = lights.map((l) => ({
		id: `device-${l.id}`,
		type: 'device' as const,
		metadata: { name: l.metadata.name, archetype: 'classic_bulb' },
		services: [ref(l.id, 'light'), ref(`zigbee-${l.id}`, 'zigbee_connectivity')]
	}));

	const connectivity = lights.map((l) => ({
		id: `zigbee-${l.id}`,
		type: 'zigbee_connectivity' as const,
		owner: ref(`device-${l.id}`, 'device'),
		status: l.id === 'plug' ? 'connectivity_issue' : 'connected'
	}));

	const rooms: MockGroup[] = [
		{
			id: 'room-kitchen',
			type: 'room',
			children: [ref('device-ceiling', 'device'), ref('device-counter', 'device')],
			services: [ref('grouped-kitchen', 'grouped_light')],
			metadata: { name: 'Kitchen', archetype: 'kitchen' }
		},
		{
			id: 'room-living',
			type: 'room',
			children: [ref('device-lamp', 'device'), ref('device-plug', 'device')],
			services: [ref('grouped-living', 'grouped_light')],
			metadata: { name: 'Living room', archetype: 'living_room' }
		}
	];

	const zones: MockGroup[] = [
		{
			id: 'zone-downstairs',
			type: 'zone',
			children: [ref('ceiling', 'light'), ref('lamp', 'light')],
			services: [ref('grouped-downstairs', 'grouped_light')],
			metadata: { name: 'Downstairs', archetype: 'downstairs' }
		}
	];

	const act = (light: string, action: SceneAction['action']): SceneAction => ({
		target: ref(light, 'light'),
		action: { on: { on: true }, ...action }
	});
	const scene = (
		id: string,
		group: string,
		name: string,
		actions: SceneAction[],
		palette?: MockScene['palette']
	): MockScene => ({
		id,
		type: 'scene',
		group: ref(group, 'room'),
		metadata: { name },
		actions,
		...(palette && { palette }),
		speed: 0.6,
		auto_dynamic: false,
		status: { active: 'inactive' }
	});

	const scenes: MockScene[] = [
		scene('scene-bright', 'room-kitchen', 'Bright', [
			act('ceiling', { dimming: { brightness: 100 }, color_temperature: { mirek: 233 } }),
			act('counter', { dimming: { brightness: 100 }, color_temperature: { mirek: 233 } })
		]),
		scene('scene-relax', 'room-kitchen', 'Relax', [
			act('ceiling', { dimming: { brightness: 56 }, color_temperature: { mirek: 447 } }),
			act('counter', { dimming: { brightness: 56 }, color_temperature: { mirek: 447 } })
		]),
		scene(
			'scene-tropical',
			'room-kitchen',
			'Tropical',
			[
				act('ceiling', { dimming: { brightness: 80 }, color: { xy: { x: 0.6, y: 0.3 } } }),
				act('counter', { dimming: { brightness: 80 }, color_temperature: { mirek: 300 } })
			],
			{
				color: [
					{ color: { xy: { x: 0.6, y: 0.3 } }, dimming: { brightness: 80 } },
					{ color: { xy: { x: 0.2, y: 0.6 } }, dimming: { brightness: 80 } }
				]
			}
		),
		scene('scene-reading', 'room-living', 'Reading', [
			act('lamp', { dimming: { brightness: 90 }, color_temperature: { mirek: 300 } })
		])
	];

	return { lights, devices, connectivity, rooms, zones, scenes };
}

export type CommandLogEntry = {
	rtype: 'light' | 'grouped_light' | 'scene';
	id: string;
	body: unknown;
};

export const home = {
	...initialHome(),
	commands: [] as CommandLogEntry[]
};

export function resetHome() {
	Object.assign(home, initialHome(), { commands: [] });
}

export function lightsOfGroup(group: MockGroup): MockLight[] {
	const ids = group.children.flatMap((child) =>
		child.rtype === 'light'
			? [child.rid]
			: (home.devices
					.find((d) => d.id === child.rid)
					?.services.filter((s) => s.rtype === 'light')
					.map((s) => s.rid) ?? [])
	);
	return home.lights.filter((l) => ids.includes(l.id));
}

function groupOfGroupedLight(id: string): MockGroup | undefined {
	return [...home.rooms, ...home.zones].find((g) => g.services.some((s) => s.rid === id));
}

export function groupedLights() {
	return [...home.rooms, ...home.zones].map((group) => {
		const members = lightsOfGroup(group);
		const lit = members.filter((l) => l.on.on && l.dimming);
		const brightness = lit.length
			? lit.reduce((sum, l) => sum + (l.dimming?.brightness ?? 0), 0) / lit.length
			: 0;
		return {
			id: group.services[0].rid,
			type: 'grouped_light' as const,
			owner: ref(group.id, group.type),
			on: { on: members.some((l) => l.on.on) },
			dimming: { brightness }
		};
	});
}

type LightUpdate = {
	on?: { on: boolean };
	dimming?: { brightness: number };
	color_temperature?: { mirek: number };
	color?: { xy: { x: number; y: number } };
};

function applyToLight(target: MockLight, update: LightUpdate) {
	if (update.on) target.on = { on: update.on.on };
	if (update.dimming && target.dimming) target.dimming.brightness = update.dimming.brightness;
	if (update.color_temperature && target.color_temperature) {
		target.color_temperature.mirek = update.color_temperature.mirek;
	}
	if (update.color && target.color) target.color.xy = update.color.xy;
}

export type BridgeEvent = {
	id: string;
	type: 'add' | 'update' | 'delete' | 'error';
	creationtime: string;
	data: ({ id: string; type: string } & Record<string, unknown>)[];
};

const listeners = new Set<(events: BridgeEvent[]) => void>();

export function onBridgeEvents(listener: (events: BridgeEvent[]) => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function publishEvents(events: BridgeEvent[]) {
	for (const listener of listeners) listener(events);
}

export function updateEvent(data: BridgeEvent['data']): BridgeEvent {
	return { id: crypto.randomUUID(), type: 'update', creationtime: new Date().toISOString(), data };
}

// Like the bridge, report the changed lights and every group whose aggregate state follows them.
function publishLightChanges(changed: MockLight[]) {
	const ids = new Set(changed.map((l) => l.id));
	const groups = groupedLights().filter((grouped) => {
		const group = [...home.rooms, ...home.zones].find((g) => g.id === grouped.owner.rid);
		return group && lightsOfGroup(group).some((l) => ids.has(l.id));
	});
	const groupIds = new Set(groups.map((g) => g.owner.rid));
	const ended = home.scenes.filter(
		(sc) => groupIds.has(sc.group.rid) && sc.status.active !== 'inactive'
	);
	for (const sc of ended) sc.status = { active: 'inactive' };
	publishEvents([
		updateEvent([
			...ended.map((sc) => ({ id: sc.id, type: 'scene', status: sc.status })),
			...changed.map((l) => ({
				id: l.id,
				type: 'light',
				on: l.on,
				...(l.dimming && { dimming: { brightness: l.dimming.brightness } })
			})),
			...groups.map((g) => ({ id: g.id, type: 'grouped_light', on: g.on, dimming: g.dimming }))
		])
	]);
}

export function updateLight(id: string, update: LightUpdate): boolean {
	const target = home.lights.find((l) => l.id === id);
	if (!target) return false;
	applyToLight(target, update);
	home.commands.push({ rtype: 'light', id, body: update });
	publishLightChanges([target]);
	return true;
}

export function updateGroupedLight(id: string, update: LightUpdate): boolean {
	const group = groupOfGroupedLight(id);
	if (!group) return false;
	const members = lightsOfGroup(group);
	for (const member of members) applyToLight(member, update);
	home.commands.push({ rtype: 'grouped_light', id, body: update });
	publishLightChanges(members);
	return true;
}

export function recallScene(id: string, action: 'active' | 'static' | 'dynamic_palette'): boolean {
	const scene = home.scenes.find((sc) => sc.id === id);
	if (!scene) return false;

	const lights = scene.actions.flatMap(({ target, action: change }) => {
		const light = home.lights.find((l) => l.id === target.rid);
		if (!light) return [];
		applyToLight(light, change);
		return [light];
	});
	home.commands.push({ rtype: 'scene', id, body: { recall: { action } } });
	publishLightChanges(lights);

	const dynamic = action === 'dynamic_palette' || (action === 'active' && scene.auto_dynamic);
	scene.status = { active: dynamic && scene.palette ? 'dynamic_palette' : 'static' };
	publishEvents([updateEvent([{ id: scene.id, type: 'scene', status: scene.status }])]);
	return true;
}
