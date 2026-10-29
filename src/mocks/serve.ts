import type { IncomingMessage, RequestListener } from 'node:http';
import { getResponse, type RequestHandler } from 'msw';

function toRequest(message: IncomingMessage, body: Uint8Array<ArrayBuffer> | undefined): Request {
	const protocol = 'encrypted' in message.socket ? 'https' : 'http';
	const headers = new Headers();
	for (const [name, value] of Object.entries(message.headers)) {
		if (typeof value === 'string') headers.set(name, value);
	}
	return new Request(new URL(message.url ?? '/', `${protocol}://${message.headers.host}`), {
		method: message.method,
		headers,
		body
	});
}

// Answers real HTTP requests with MSW handlers, without patching the process's network stack.
export function handlersListener(handlers: RequestHandler[]): RequestListener {
	return async (message, reply) => {
		const hasBody = message.method !== 'GET' && message.method !== 'HEAD';
		const body = hasBody ? Uint8Array.from(Buffer.concat(await message.toArray())) : undefined;
		const response =
			(await getResponse(handlers, toRequest(message, body))) ??
			new Response('No mock handler', { status: 404 });

		reply.writeHead(response.status, Object.fromEntries(response.headers));
		if (!response.body) return reply.end();

		// Streamed, not buffered, so endless responses like the event stream work.
		const reader = response.body.getReader();
		reply.on('close', () => reader.cancel().catch(() => {}));
		for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
			reply.write(chunk.value);
		}
		reply.end();
	};
}
