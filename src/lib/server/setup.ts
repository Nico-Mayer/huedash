import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { getConfigStore } from './config/index.ts';
import { ConfigWriteError, type ConfigStore } from './config/store.ts';
import { parseBridgeAddress } from './hue/address.ts';
import { BridgeError, getPublicConfig, requestAppKey } from './hue/bridge.ts';
import { createConnection, type Connection } from './hue/connection.ts';
import { createBridgeAgent, fetchWith } from './hue/tls.ts';

export const PAIRING_COOKIE = 'huedash_pairing';
export const PAIRING_TTL_MS = 5 * 60 * 1000;

type PendingPairing = {
	address: string;
	origin: string;
	id: string;
	name: string;
	certSha256: string;
	expiresAt: number;
};

export type SetupDeps = {
	capture: (origin: string) => { connection: Connection; fingerprint: () => string };
	pinned: (origin: string, certSha256: string) => Connection;
	store: () => ConfigStore;
	now: () => number;
};

const defaultDeps: SetupDeps = {
	capture(origin) {
		let fingerprint = '';
		const agent = createBridgeAgent({ mode: 'capture', onCapture: (sha) => (fingerprint = sha) });
		return { connection: { origin, fetch: fetchWith(agent) }, fingerprint: () => fingerprint };
	},
	pinned: (origin, certSha256) => createConnection(origin, certSha256),
	store: getConfigStore,
	now: Date.now
};

const pending = new Map<string, PendingPairing>();

// The bridge allows 20 characters for the app name and 19 for the device name.
export const deviceType = (host = hostname()) => `huedash#${host.slice(0, 19)}`;

export type CheckResult =
	| { ok: true; token: string; bridge: { id: string; name: string; certSha256: string } }
	| { ok: false; error: 'invalid-address' | 'unreachable' | 'not-a-bridge' };

export async function checkAddress(input: string, deps = defaultDeps): Promise<CheckResult> {
	const address = parseBridgeAddress(input);
	if (!address) return { ok: false, error: 'invalid-address' };

	const { connection, fingerprint } = deps.capture(address.origin);
	let bridge;
	try {
		bridge = await getPublicConfig(connection);
	} catch (error) {
		const kind = error instanceof BridgeError ? error.kind : 'unreachable';
		return { ok: false, error: kind === 'not-a-bridge' ? 'not-a-bridge' : 'unreachable' };
	}
	if (!fingerprint()) return { ok: false, error: 'unreachable' };

	const token = randomUUID();
	pending.set(token, {
		address: input.trim(),
		origin: address.origin,
		id: bridge.id,
		name: bridge.name,
		certSha256: fingerprint(),
		expiresAt: deps.now() + PAIRING_TTL_MS
	});
	return {
		ok: true,
		token,
		bridge: { id: bridge.id, name: bridge.name, certSha256: fingerprint() }
	};
}

export type PairResult =
	| { status: 'waiting' }
	| { status: 'paired' }
	| { status: 'expired' }
	| { status: 'failed'; reason: 'unreachable' | 'certificate-mismatch' | 'pairing-failed' }
	| { status: 'not-saved'; dataDir: string };

export async function pairWithBridge(
	token: string | undefined,
	deps = defaultDeps
): Promise<PairResult> {
	const pairing = token ? pending.get(token) : undefined;
	if (!pairing || pairing.expiresAt < deps.now()) {
		if (token) pending.delete(token);
		return { status: 'expired' };
	}

	let result;
	try {
		result = await requestAppKey(deps.pinned(pairing.origin, pairing.certSha256), deviceType());
	} catch (error) {
		const kind = error instanceof BridgeError ? error.kind : 'unreachable';
		return { status: 'failed', reason: kind === 'not-a-bridge' ? 'unreachable' : kind };
	}
	if (result.status === 'waiting') return { status: 'waiting' };

	try {
		await deps.store().write({
			version: 1,
			bridge: {
				address: pairing.address,
				id: pairing.id,
				name: pairing.name,
				appKey: result.appKey,
				clientKey: result.clientKey,
				certSha256: pairing.certSha256
			},
			pairedAt: new Date(deps.now()).toISOString()
		});
	} catch (error) {
		if (error instanceof ConfigWriteError) return { status: 'not-saved', dataDir: error.dataDir };
		throw error;
	}

	pending.delete(token!);
	return { status: 'paired' };
}
