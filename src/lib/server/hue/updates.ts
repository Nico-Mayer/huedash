import { z } from 'zod';
import type { LiveUpdate, StateUpdate } from '../../live-updates.ts';
import { xyToHueSaturation } from './color.ts';
import { swatchOf } from './scene-colors.ts';

const resourceSchema = z.looseObject({
	id: z.string(),
	type: z.string(),
	on: z.object({ on: z.boolean() }).optional(),
	dimming: z.object({ brightness: z.number() }).optional(),
	color_temperature: z
		.object({ mirek: z.number().nullable(), mirek_valid: z.boolean().optional() })
		.optional(),
	color: z.object({ xy: z.object({ x: z.number(), y: z.number() }) }).optional(),
	metadata: z.unknown().optional(),
	status: z.unknown().optional()
});

const messageSchema = z.array(
	z.object({ type: z.enum(['add', 'update', 'delete', 'error']), data: z.array(resourceSchema) })
);

type Resource = z.infer<typeof resourceSchema>;

// Other resources, like zigbee_connectivity, use a plain string status.
const sceneStatusSchema = z.object({ active: z.enum(['inactive', 'static', 'dynamic_palette']) });

const SHOWN_TYPES = new Set([
	'light',
	'grouped_light',
	'room',
	'zone',
	'device',
	'zigbee_connectivity',
	'scene'
]);

function colorOf(resource: Resource): Pick<StateUpdate, 'mirek' | 'hueSaturation' | 'swatch'> {
	const white = resource.color_temperature;
	const xy = resource.color?.xy;
	if (white?.mirek_valid !== false && white?.mirek != null)
		return { mirek: white.mirek, hueSaturation: null, swatch: swatchOf(white.mirek, undefined) };
	if (xy) return { mirek: null, hueSaturation: xyToHueSaturation(xy), swatch: swatchOf(null, xy) };
	return {};
}

function stateOf(resource: Resource): StateUpdate | null {
	const update: StateUpdate = { id: resource.id };
	if (resource.on) update.on = resource.on.on;
	if (resource.dimming) update.brightness = Math.round(resource.dimming.brightness);
	if (resource.type === 'light') Object.assign(update, colorOf(resource));
	return Object.keys(update).length === 1 ? null : update;
}

// Light and group state is applied in place; anything else the page shows needs a reload.
export function toUpdates(message: unknown): LiveUpdate[] {
	const parsed = messageSchema.safeParse(message);
	if (!parsed.success) return [];

	const updates: LiveUpdate[] = [];
	let reload = false;

	for (const event of parsed.data) {
		if (event.type === 'error') continue;
		for (const resource of event.data) {
			if (!SHOWN_TYPES.has(resource.type)) continue;

			if (resource.type === 'scene' && event.type === 'update' && !resource.metadata) {
				const status = sceneStatusSchema.safeParse(resource.status);
				if (status.success) {
					updates.push({ kind: 'scene', id: resource.id, active: status.data.active });
					continue;
				}
			}

			const inPlace =
				event.type === 'update' &&
				resource.metadata === undefined &&
				(resource.type === 'light' || resource.type === 'grouped_light');
			if (!inPlace) {
				reload = true;
				continue;
			}

			const state = stateOf(resource);
			if (state) updates.push({ kind: resource.type === 'light' ? 'light' : 'group', ...state });
		}
	}

	return reload ? [...updates, { kind: 'reload' }] : updates;
}
