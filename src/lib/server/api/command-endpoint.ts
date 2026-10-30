import type { ZodType } from 'zod';
import { getBridgeConfig } from '../config/index.ts';
import type { CommandResult } from '../hue/commands.ts';
import { getHomeStore, type HomeStore } from '../hue/store.ts';

export function commandEndpoint<C>(
	schema: ZodType<C>,
	send: (store: HomeStore, id: string, command: C) => Promise<CommandResult>
) {
	return async ({ params, request }: { params: { id: string }; request: Request }) => {
		const config = await getBridgeConfig();
		if (!config) return Response.json({ error: 'not-configured' }, { status: 409 });

		const parsed = schema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

		const store = getHomeStore(config);
		const loaded = await store.ready();
		if (loaded.status !== 'ok') return Response.json({ error: loaded.status }, { status: 502 });

		const result = await send(store, params.id, parsed.data);
		if (result.ok) return Response.json({ revision: result.revision });
		return Response.json(
			{ error: result.reason },
			{ status: result.reason === 'not-found' ? 404 : 502 }
		);
	};
}
