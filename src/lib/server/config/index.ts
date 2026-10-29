import { parseBridgeAddress, type BridgeAddress } from '../hue/address.ts';
import { normalizeFingerprint } from '../hue/tls.ts';
import { createConfigStore, type ConfigStore } from './store.ts';

export type BridgeConfig = {
	source: 'env' | 'file';
	address: BridgeAddress;
	name: string;
	appKey: string;
	certSha256: string | null;
};

type Env = Record<string, string | undefined>;
type Logger = Pick<Console, 'warn'>;

const warned = new Set<string>();

// Config is resolved on every request, so each warning is logged once per process.
function warnOnce(log: Logger, message: string) {
	if (warned.has(message)) return;
	warned.add(message);
	log.warn(message);
}

function fromEnv(env: Env, log: Logger): BridgeConfig | null {
	const ip = env.HUE_BRIDGE_IP?.trim();
	const appKey = env.HUE_APP_KEY?.trim();

	if (!ip && !appKey) return null;
	if (!ip || !appKey) {
		const missing = ip ? 'HUE_APP_KEY' : 'HUE_BRIDGE_IP';
		warnOnce(
			log,
			`${missing} is not set, so the env vars are ignored and the data directory is used.`
		);
		return null;
	}

	const address = parseBridgeAddress(ip);
	if (!address) {
		warnOnce(log, `HUE_BRIDGE_IP "${ip}" is not a valid address, so the env vars are ignored.`);
		return null;
	}

	const cert = env.HUE_BRIDGE_CERT_SHA256?.trim();
	return {
		source: 'env',
		address,
		name: address.host,
		appKey,
		certSha256: cert ? normalizeFingerprint(cert) : null
	};
}

export async function resolveBridgeConfig(
	env: Env,
	store: ConfigStore,
	log: Logger = console
): Promise<BridgeConfig | null> {
	const envConfig = fromEnv(env, log);
	if (envConfig) return envConfig;

	const stored = await store.read();
	if (!stored) return null;

	const address = parseBridgeAddress(stored.bridge.address);
	if (!address) {
		warnOnce(
			log,
			`${store.file} has an invalid bridge address, treating the bridge as not configured.`
		);
		return null;
	}
	return {
		source: 'file',
		address,
		name: stored.bridge.name,
		appKey: stored.bridge.appKey,
		certSha256: stored.bridge.certSha256
	};
}

let store: ConfigStore | undefined;

export function getConfigStore(): ConfigStore {
	store ??= createConfigStore(process.env.HUE_DATA_DIR || '/data');
	return store;
}

export function getBridgeConfig(): Promise<BridgeConfig | null> {
	return resolveBridgeConfig(process.env, getConfigStore());
}
