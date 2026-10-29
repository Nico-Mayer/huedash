import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBridgeCertificate,
	type BridgeCertificate
} from '../../../mocks/bridge/certificate.ts';
import { server as mockServer } from '../../../mocks/server.ts';
import { createBridgeAgent, fetchWith, isCertificateMismatch } from './tls.ts';

let server: Server;
let url: string;
let served: BridgeCertificate;
let other: BridgeCertificate;
let requests = 0;

beforeAll(async () => {
	// MSW intercepts at the socket level, which hides the real peer certificate.
	mockServer.close();
	[served, other] = await Promise.all([createBridgeCertificate(), createBridgeCertificate()]);
	server = createServer({ key: served.key, cert: served.cert }, (_request, response) => {
		requests++;
		response.end('ok');
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	url = `https://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

afterAll(async () => {
	await new Promise<void>((resolve) => server.close(() => resolve()));
	mockServer.listen({ onUnhandledFrame: 'error' });
});

describe('createBridgeAgent', () => {
	it('captures the certificate fingerprint', async () => {
		let captured = '';
		const dispatcher = createBridgeAgent({ mode: 'capture', onCapture: (sha) => (captured = sha) });

		const response = await fetchWith(dispatcher)(url);

		expect(await response.text()).toBe('ok');
		expect(captured).toBe(served.sha256);
	});

	it('accepts the pinned certificate, with any fingerprint formatting', async () => {
		const pinned = served.sha256.toLowerCase().replace(/(..)(?!$)/g, '$1:');
		const dispatcher = createBridgeAgent({ mode: 'pinned', sha256: pinned });

		const response = await fetchWith(dispatcher)(url);

		expect(response.status).toBe(200);
	});

	it('rejects a different certificate before sending the request', async () => {
		const before = requests;
		const dispatcher = createBridgeAgent({ mode: 'pinned', sha256: other.sha256 });

		const error = await fetchWith(dispatcher)(url, { method: 'POST', body: 'secret' }).catch(
			(e) => e
		);

		expect(isCertificateMismatch(error)).toBe(true);
		expect(requests).toBe(before);
	});
});
