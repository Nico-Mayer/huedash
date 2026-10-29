import { createServer, type Server } from 'node:https';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBridgeCertificate,
	type BridgeCertificate
} from '../../../mocks/bridge/certificate.ts';
import { server as mockServer } from '../../../mocks/server.ts';
import { createConnection } from './connection.ts';
import { isCertificateMismatch } from './tls.ts';

let first: BridgeCertificate;
let second: BridgeCertificate;
let port: number;
let bridge: Server | undefined;

async function serve(certificate: BridgeCertificate) {
	await new Promise<void>((resolve) => (bridge ? bridge.close(() => resolve()) : resolve()));
	bridge = createServer({ ...certificate }, (_request, response) => response.end('ok'));
	await new Promise<void>((resolve) => bridge!.listen(port, '127.0.0.1', resolve));
	port = (bridge.address() as AddressInfo).port;
}

beforeAll(async () => {
	// MSW intercepts at the socket level, which hides the real peer certificate.
	mockServer.close();
	[first, second] = await Promise.all([createBridgeCertificate(), createBridgeCertificate()]);
	port = 0;
	await serve(first);
});

afterAll(async () => {
	await new Promise<void>((resolve) => bridge!.close(() => resolve()));
	mockServer.listen({ onUnhandledFrame: 'error' });
});

describe('createConnection without a known fingerprint', () => {
	it('trusts the first certificate, logs it, and pins it afterwards', async () => {
		const log = { info: vi.fn() };
		const connection = createConnection(`https://127.0.0.1:${port}`, null, log);

		expect((await connection.fetch(`${connection.origin}/`)).status).toBe(200);
		expect(log.info).toHaveBeenCalledWith(expect.stringContaining(first.sha256));

		await serve(second);
		const error = await connection.fetch(`${connection.origin}/`).catch((e) => e);

		expect(isCertificateMismatch(error)).toBe(true);
	});
});
