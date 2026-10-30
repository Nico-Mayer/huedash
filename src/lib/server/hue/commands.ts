import { z } from 'zod';
import { failureFromError, type BridgeFailure } from './bridge.ts';
import { createHueClient } from './client.ts';
import { hueSaturationToXy } from './color.ts';
import type { Home, HomeGroup, HomeLight, MirekRange } from './home.ts';
import type { components } from './schema.d.ts';
import type { HomeStore } from './store.ts';
import { createThrottle } from './throttle.ts';

const nonEmpty = (command: object) => Object.keys(command).length > 0;

const stateCommandSchema = z
	.object({
		on: z.boolean().optional(),
		brightness: z
			.number()
			.transform((value) => Math.min(100, Math.max(1, Math.round(value))))
			.optional(),
		mirek: z.number().optional(),
		color: z
			.object({ hue: z.number().min(0).max(360), saturation: z.number().min(0).max(100) })
			.strict()
			.optional()
	})
	.strict()
	.refine(nonEmpty);

export const lightCommandSchema = stateCommandSchema;
export const groupCommandSchema = stateCommandSchema;

export const sceneCommandSchema = z
	.object({ mode: z.enum(['active', 'static', 'dynamic']) })
	.strict();

const recallAction = {
	active: 'active',
	static: 'static',
	dynamic: 'dynamic_palette'
} as const satisfies Record<SceneCommand['mode'], string>;

export type LightCommand = z.infer<typeof lightCommandSchema>;
export type SceneCommand = z.infer<typeof sceneCommandSchema>;
export type GroupCommand = z.infer<typeof groupCommandSchema>;

type ClipBody = components['schemas']['GroupedLightPut'] & components['schemas']['LightPut'];

const clampMirek = (mirek: number, { minMirek, maxMirek }: MirekRange) =>
	Math.min(maxMirek, Math.max(minMirek, Math.round(mirek)));

export function toClipBody(command: GroupCommand, range: MirekRange | null = null): ClipBody {
	const mirek =
		command.mirek === undefined
			? undefined
			: range
				? clampMirek(command.mirek, range)
				: Math.round(command.mirek);
	return {
		...(command.on !== undefined && { on: { on: command.on } }),
		...(command.brightness !== undefined && { dimming: { brightness: command.brightness } }),
		...(mirek !== undefined && { color_temperature: { mirek } }),
		...(command.color && {
			color: { xy: hueSaturationToXy(command.color.hue, command.color.saturation) }
		})
	};
}

// A light shows either a white or a color, so the later of the two wins.
export function mergeBodies(previous: ClipBody, next: ClipBody): ClipBody {
	const body = { ...previous, ...next };
	if (next.color) delete body.color_temperature;
	if (next.color_temperature) delete body.color;
	return body;
}

export type CommandResult =
	{ ok: true; revision: number } | { ok: false; reason: BridgeFailure | 'rejected' | 'not-found' };

type Change = Parameters<HomeStore['apply']>[0][number];

const groupsOf = (home: Home): HomeGroup[] => [...home.rooms, ...home.zones];

// The state the bridge will report for a light after the command, as a CLIP update.
function lightUpdate(light: HomeLight, body: ClipBody): Record<string, unknown> {
	const mirek = body.color_temperature?.mirek;
	return {
		...(body.on && { on: body.on }),
		...(body.dimming && light.brightness !== null && { dimming: body.dimming }),
		...(mirek !== undefined &&
			light.mirekRange && {
				color_temperature: { mirek: clampMirek(mirek, light.mirekRange), mirek_valid: true }
			}),
		...(body.color &&
			light.color && {
				color: body.color,
				...(light.mirekRange && { color_temperature: { mirek: null, mirek_valid: false } })
			})
	};
}

async function settle(request: Promise<{ response: Response }>) {
	try {
		const { response } = await request;
		if (response.ok) return null;
		const auth = response.status === 401 || response.status === 403;
		return { ok: false as const, reason: auth ? ('unauthorized' as const) : ('rejected' as const) };
	} catch (error) {
		return { ok: false as const, reason: failureFromError(error) };
	}
}

type Pending = { store: HomeStore; body: ClipBody };

const mergePending = (previous: Pending, next: Pending): Pending => ({
	store: next.store,
	body: mergeBodies(previous.body, next.body)
});

export function createCommandSender({
	groupWindowMs = 1000,
	lightWindowMs = 100,
	sceneWindowMs = 1000
} = {}) {
	const sendGroup = createThrottle(
		groupWindowMs,
		async (id: string, { store, body }: Pending): Promise<CommandResult> => {
			const failed = await settle(
				createHueClient(store.target).PUT('/clip/v2/resource/grouped_light/{groupedLightId}', {
					params: { path: { groupedLightId: id } },
					body
				})
			);
			if (failed) return failed;

			const home = store.home;
			const group = home && groupsOf(home).find((g) => g.groupedLightId === id);
			const members: Change[] = group
				? group.lightIds.flatMap((lightId) => {
						const light = home.lights[lightId];
						return light ? [{ type: 'light', id: lightId, data: lightUpdate(light, body) }] : [];
					})
				: [];
			return {
				ok: true,
				revision: store.apply([{ type: 'grouped_light', id, data: body }, ...members])
			};
		},
		mergePending
	);

	const sendLight = createThrottle(
		lightWindowMs,
		async (id: string, { store, body }: Pending): Promise<CommandResult> => {
			const failed = await settle(
				createHueClient(store.target).PUT('/clip/v2/resource/light/{lightId}', {
					params: { path: { lightId: id } },
					body
				})
			);
			if (failed) return failed;

			const light = store.home?.lights[id];
			const changes: Change[] = light
				? [{ type: 'light', id, data: lightUpdate(light, body) }]
				: [];
			return { ok: true, revision: store.apply(changes) };
		},
		mergePending
	);

	const sendScene = createThrottle(
		sceneWindowMs,
		async (
			id: string,
			{ store, command }: { store: HomeStore; command: SceneCommand }
		): Promise<CommandResult> => {
			const failed = await settle(
				createHueClient(store.target).PUT('/clip/v2/resource/scene/{sceneId}', {
					params: { path: { sceneId: id } },
					body: { recall: { action: recallAction[command.mode] } }
				})
			);
			if (failed) return failed;

			const started = command.mode === 'dynamic' ? 'dynamic_palette' : 'static';
			const home = store.home;
			const group = home && groupsOf(home).find((g) => g.scenes.some((s) => s.id === id));
			const changes: Change[] = (group?.scenes ?? []).map((scene) => ({
				type: 'scene',
				id: scene.id,
				data: { status: { active: scene.id === id ? started : 'inactive' } }
			}));
			return { ok: true, revision: store.apply(changes) };
		}
	);

	const notFound: CommandResult = { ok: false, reason: 'not-found' };

	return {
		setGroup(store: HomeStore, groupedLightId: string, command: GroupCommand) {
			const group =
				store.home && groupsOf(store.home).find((g) => g.groupedLightId === groupedLightId);
			if (!group) return Promise.resolve(notFound);
			return sendGroup(groupedLightId, {
				store,
				body: toClipBody(command, group.colorTemperature)
			});
		},

		setLight(store: HomeStore, lightId: string, command: LightCommand) {
			const light = store.home?.lights[lightId];
			if (!light) return Promise.resolve(notFound);
			return sendLight(lightId, { store, body: toClipBody(command, light.mirekRange) });
		},

		setScene(store: HomeStore, sceneId: string, command: SceneCommand) {
			const known =
				store.home && groupsOf(store.home).some((g) => g.scenes.some((s) => s.id === sceneId));
			if (!known) return Promise.resolve(notFound);
			return sendScene(sceneId, { store, command });
		}
	};
}

export const commands = createCommandSender();
