import { getBridgeConfig } from '#lib/server/config/index.ts';
import { getEventHub } from '#lib/server/hue/events.ts';
import type { RequestHandler } from './$types';

const HEARTBEAT_MS = 25_000;

export const GET: RequestHandler = async ({ request }) => {
	const config = await getBridgeConfig();
	if (!config) return Response.json({ error: 'not-configured' }, { status: 409 });

	const hub = getEventHub(config);
	const encoder = new TextEncoder();
	let cleanup = () => {};

	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			const write = (text: string) => controller.enqueue(encoder.encode(text));
			const unsubscribe = hub.subscribe((update) => write(`data: ${JSON.stringify(update)}\n\n`));
			// Comment lines keep proxies from closing an idle connection.
			const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);

			cleanup = () => {
				clearInterval(heartbeat);
				unsubscribe();
			};
			request.signal.addEventListener('abort', () => cleanup());
		},
		cancel: () => cleanup()
	});

	return new Response(body, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-store',
			'x-accel-buffering': 'no'
		}
	});
};
