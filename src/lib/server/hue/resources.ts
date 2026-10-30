import { z } from 'zod';
import type { components } from './schema.d.ts';

type Spec = components['schemas'];

// Fails to compile when a resource that is valid by the spec would not pass the schema.
type Accepting<T> = <S extends z.ZodType>(
	schema: S,
	...check: T extends z.input<S> ? [] : [never]
) => S;

const accepting = <T>() => ((schema: z.ZodType) => schema) as unknown as Accepting<T>;

const ref = z.object({ rid: z.string(), rtype: z.string() });
const xy = z.object({ x: z.number(), y: z.number() });
const on = z.object({ on: z.boolean() });
const brightness = z.object({ brightness: z.number() });

const group = accepting<Spec['RoomGet']>()(
	z.object({
		id: z.string(),
		children: z.array(ref),
		services: z.array(ref),
		metadata: z.object({ name: z.string() })
	})
);

const device = accepting<Spec['DeviceGet']>()(
	z.object({
		id: z.string(),
		product_data: z.object({ product_name: z.string() }),
		services: z.array(ref)
	})
);

const light = accepting<Spec['LightGet']>()(
	z.object({
		id: z.string(),
		owner: ref,
		metadata: z.object({ name: z.string() }),
		on,
		dimming: z.object({ brightness: z.number().optional() }).optional(),
		color_temperature: z
			.object({
				// The bridge sends null while the light shows a color, unlike the spec.
				mirek: z.number().nullable().optional(),
				mirek_valid: z.boolean().optional(),
				mirek_schema: z
					.object({ mirek_minimum: z.number().optional(), mirek_maximum: z.number().optional() })
					.optional()
			})
			.optional(),
		color: z.object({ xy: xy.optional() }).optional()
	})
);

const groupedLight = accepting<Spec['GroupedLightGet']>()(
	z.object({ id: z.string(), on: on.optional(), dimming: brightness.optional() })
);

const connectivity = accepting<Spec['ZigbeeConnectivityGet']>()(
	z.object({ id: z.string(), status: z.string().optional() })
);

export const sceneStatus = z.enum(['inactive', 'static', 'dynamic_palette']);

const scene = accepting<Spec['SceneGet']>()(
	z.object({
		id: z.string(),
		group: ref,
		metadata: z.object({ name: z.string().optional() }),
		actions: z.array(
			z.object({
				target: ref,
				action: z.object({
					on: on.optional(),
					dimming: brightness.optional(),
					color: z.object({ xy }).optional(),
					color_temperature: z.object({ mirek: z.number().nullable().optional() }).optional()
				})
			})
		),
		palette: z.object({ color: z.array(z.unknown()).optional() }).optional(),
		status: z.object({ active: sceneStatus.optional() }).optional()
	})
);

export const resourceSchemas = {
	room: group,
	zone: group,
	device,
	light,
	grouped_light: groupedLight,
	zigbee_connectivity: connectivity,
	scene
};

export type ResourceType = keyof typeof resourceSchemas;
export type Resource<T extends ResourceType> = z.output<(typeof resourceSchemas)[T]>;
export type Resources = { [T in ResourceType]: Resource<T>[] };

export const resourceTypes = Object.keys(resourceSchemas) as ResourceType[];

export const isResourceType = (type: string): type is ResourceType => type in resourceSchemas;

type Logger = Pick<Console, 'warn'>;

const warned = new Set<string>();

// One warning per resource, so a bad resource that changes often does not flood the log.
export function parseResource<T extends ResourceType>(
	type: T,
	data: unknown,
	log: Logger = console
): Resource<T> | null {
	const parsed = resourceSchemas[type].safeParse(data);
	if (parsed.success) return parsed.data as Resource<T>;

	const id = (data as { id?: unknown } | null)?.id;
	const key = `${type} ${String(id)}`;
	if (!warned.has(key)) {
		warned.add(key);
		log.warn(`Skipped ${type} ${String(id)} from the bridge: ${z.prettifyError(parsed.error)}`);
	}
	return null;
}

export function parseResources<T extends ResourceType>(
	type: T,
	items: unknown[],
	log: Logger = console
): Resource<T>[] {
	return items.flatMap((item) => parseResource(type, item, log) ?? []);
}
