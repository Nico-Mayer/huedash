import { z } from 'zod';
import type { LiveUpdate, StateUpdate } from '../../live-updates.ts';

const resourceSchema = z.looseObject({
	id: z.string(),
	type: z.string(),
	on: z.object({ on: z.boolean() }).optional(),
	dimming: z.object({ brightness: z.number() }).optional(),
	metadata: z.unknown().optional()
});

const messageSchema = z.array(
	z.object({ type: z.enum(['add', 'update', 'delete', 'error']), data: z.array(resourceSchema) })
);

type Resource = z.infer<typeof resourceSchema>;

const SHOWN_TYPES = new Set([
	'light',
	'grouped_light',
	'room',
	'zone',
	'device',
	'zigbee_connectivity'
]);

function stateOf(resource: Resource): StateUpdate | null {
	const update: StateUpdate = { id: resource.id };
	if (resource.on) update.on = resource.on.on;
	if (resource.dimming) update.brightness = Math.round(resource.dimming.brightness);
	return update.on === undefined && update.brightness === undefined ? null : update;
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
