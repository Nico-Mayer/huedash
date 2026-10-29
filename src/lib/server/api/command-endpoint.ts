import type { ZodType } from 'zod';
import { getBridgeConfig } from '../config/index.ts';
import type { CommandResult } from '../hue/commands.ts';
import { connectionFor, type Connection } from '../hue/connection.ts';

type Target = Connection & { appKey: string };

export function commandEndpoint<C>(
	schema: ZodType<C>,
	send: (target: Target, id: string, command: C) => Promise<CommandResult>
) {
	return async ({ params, request }: { params: { id: string }; request: Request }) => {
		const config = await getBridgeConfig();
		if (!config) return Response.json({ error: 'not-configured' }, { status: 409 });

		const parsed = schema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

		const result = await send(
			{ ...connectionFor(config), appKey: config.appKey },
			params.id,
			parsed.data
		);
		return result.ok
			? new Response(null, { status: 204 })
			: Response.json({ error: result.reason }, { status: 502 });
	};
}
