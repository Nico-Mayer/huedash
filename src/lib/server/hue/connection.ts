import type { Dispatcher } from 'undici';
import { createBridgeAgent, fetchWith, type BridgeFetch } from './tls.ts';

export type Connection = { origin: string; fetch: BridgeFetch };

type Logger = Pick<Console, 'info'>;

// Without a known fingerprint the first certificate seen is trusted, then pinned for the process.
export function createConnection(
	origin: string,
	certSha256: string | null,
	log: Logger = console
): Connection {
	let agent: Dispatcher = certSha256
		? createBridgeAgent({ mode: 'pinned', sha256: certSha256 })
		: createBridgeAgent({
				mode: 'capture',
				onCapture(sha256) {
					log.info(
						`Bridge certificate SHA-256 is ${sha256}. Set HUE_BRIDGE_CERT_SHA256 to pin it.`
					);
					agent = createBridgeAgent({ mode: 'pinned', sha256 });
				}
			});

	return { origin, fetch: (input, init) => fetchWith(agent)(input, init) };
}

const connections = new Map<string, Connection>();

export function connectionFor(config: { address: { origin: string }; certSha256: string | null }) {
	const key = `${config.address.origin} ${config.certSha256 ?? 'capture'}`;
	let connection = connections.get(key);
	if (!connection) {
		connection = createConnection(config.address.origin, config.certSha256);
		connections.set(key, connection);
	}
	return connection;
}
