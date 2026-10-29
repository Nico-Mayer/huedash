import { mkdir, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { createBridgeCertificate } from './bridge/certificate.ts';
import { discoveryHandler, handlers, pressLinkButtonAfter } from './bridge/handlers.ts';
import { E2E_BRIDGE_PORT, E2E_DISCOVERY_PORT, E2E_DISCOVERY_URL } from './e2e.ts';
import { handlersListener } from './serve.ts';

const dataDir = process.env.HUE_DATA_DIR;
if (dataDir) {
	await rm(dataDir, { recursive: true, force: true });
	await mkdir(dataDir, { recursive: true });
}

const certificate = await createBridgeCertificate();
pressLinkButtonAfter(1);

createHttpsServer(certificate, handlersListener(handlers)).listen(E2E_BRIDGE_PORT, '127.0.0.1');

const discovered = [
	{ id: '001788fffe123456', internalipaddress: '127.0.0.1', port: E2E_BRIDGE_PORT }
];
createHttpServer(handlersListener([discoveryHandler(E2E_DISCOVERY_URL, discovered)])).listen(
	E2E_DISCOVERY_PORT,
	'127.0.0.1'
);

console.log(`[mock] Hue bridge mock active at https://127.0.0.1:${E2E_BRIDGE_PORT}`);
