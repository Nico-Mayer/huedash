import { createServer } from 'node:http';

// adapter-node assumes https when it cannot see the protocol, which makes SvelteKit's CSRF check
// reject every form post from a plain-http LAN address. Requests without the header are direct
// http requests; a TLS reverse proxy in front sets the header itself. Must be set before import.
process.env.PROTOCOL_HEADER ??= 'x-forwarded-proto';
const { handler } = await import('./build/handler.js');

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

const server = createServer((request, response) => {
	request.headers['x-forwarded-proto'] ??= 'http';
	handler(request, response, () => {
		response.statusCode = 404;
		response.end('Not found');
	});
});

server.listen(port, host, () => console.log(`Listening on http://${host}:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		server.close(() => process.exit(0));
		server.closeAllConnections();
	});
}
