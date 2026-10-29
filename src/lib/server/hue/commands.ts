import { z } from 'zod';
import { failureFromError, type BridgeFailure } from './bridge.ts';
import { createHueClient } from './client.ts';
import { hueSaturationToXy } from './color.ts';
import type { Connection } from './connection.ts';
import type { components } from './schema.d.ts';
import { createThrottle } from './throttle.ts';

const MIN_MIREK = 153;
const MAX_MIREK = 500;

const clamp = (min: number, max: number) => (value: number) =>
	Math.min(max, Math.max(min, Math.round(value)));

const brightness = z.number().transform(clamp(1, 100));

const nonEmpty = (command: object) => Object.keys(command).length > 0;

export const lightCommandSchema = z
	.object({ on: z.boolean().optional(), brightness: brightness.optional() })
	.strict()
	.refine(nonEmpty);

export const groupCommandSchema = z
	.object({
		on: z.boolean().optional(),
		brightness: brightness.optional(),
		mirek: z.number().transform(clamp(MIN_MIREK, MAX_MIREK)).optional(),
		color: z
			.object({ hue: z.number().min(0).max(360), saturation: z.number().min(0).max(100) })
			.strict()
			.optional()
	})
	.strict()
	.refine(nonEmpty);

export type LightCommand = z.infer<typeof lightCommandSchema>;
export type GroupCommand = z.infer<typeof groupCommandSchema>;

type ClipBody = components['schemas']['GroupedLightPut'] & components['schemas']['LightPut'];

export function toClipBody(command: GroupCommand): ClipBody {
	return {
		...(command.on !== undefined && { on: { on: command.on } }),
		...(command.brightness !== undefined && { dimming: { brightness: command.brightness } }),
		...(command.mirek !== undefined && { color_temperature: { mirek: command.mirek } }),
		...(command.color && {
			color: { xy: hueSaturationToXy(command.color.hue, command.color.saturation) }
		})
	};
}

export type CommandResult = { ok: true } | { ok: false; reason: BridgeFailure | 'rejected' };

type Target = Connection & { appKey: string };
type Pending = { target: Target; body: ClipBody };

async function settle(request: Promise<{ response: Response }>): Promise<CommandResult> {
	try {
		const { response } = await request;
		if (response.ok) return { ok: true };
		const auth = response.status === 401 || response.status === 403;
		return { ok: false, reason: auth ? 'unauthorized' : 'rejected' };
	} catch (error) {
		return { ok: false, reason: failureFromError(error) };
	}
}

export function createCommandSender({ groupWindowMs = 1000, lightWindowMs = 100 } = {}) {
	const sendGroup = createThrottle(groupWindowMs, (id: string, { target, body }: Pending) =>
		settle(
			createHueClient(target).PUT('/clip/v2/resource/grouped_light/{groupedLightId}', {
				params: { path: { groupedLightId: id } },
				body
			})
		)
	);
	const sendLight = createThrottle(lightWindowMs, (id: string, { target, body }: Pending) =>
		settle(
			createHueClient(target).PUT('/clip/v2/resource/light/{lightId}', {
				params: { path: { lightId: id } },
				body
			})
		)
	);

	return {
		setGroup: (target: Target, groupedLightId: string, command: GroupCommand) =>
			sendGroup(groupedLightId, { target, body: toClipBody(command) }),
		setLight: (target: Target, lightId: string, command: LightCommand) =>
			sendLight(lightId, { target, body: toClipBody(command) })
	};
}

export const commands = createCommandSender();
