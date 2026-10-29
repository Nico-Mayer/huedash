import { z } from 'zod';
import { createHueClient, withTimeout, type HueClientOptions } from './client.ts';
import { isCertificateMismatch } from './tls.ts';

export type BridgeErrorKind =
	'unreachable' | 'certificate-mismatch' | 'not-a-bridge' | 'pairing-failed';

export class BridgeError extends Error {
	constructor(
		readonly kind: BridgeErrorKind,
		message: string,
		options?: ErrorOptions
	) {
		super(message, options);
		this.name = 'BridgeError';
	}
}

function toBridgeError(error: unknown): BridgeError {
	if (error instanceof BridgeError) return error;
	if (isCertificateMismatch(error)) {
		return new BridgeError('certificate-mismatch', 'Bridge certificate changed', { cause: error });
	}
	return new BridgeError('unreachable', 'Bridge did not answer', { cause: error });
}

type Connection = Omit<HueClientOptions, 'appKey'>;

const publicConfigSchema = z.object({
	name: z.string(),
	bridgeid: z.string().regex(/^[0-9a-f]{16}$/i),
	modelid: z.string()
});

export type PublicBridgeConfig = { id: string; name: string; modelId: string };

export async function getPublicConfig({
	origin,
	fetch,
	timeoutMs
}: Connection): Promise<PublicBridgeConfig> {
	let response: Response;
	try {
		response = await withTimeout(fetch, timeoutMs)(`${origin}/api/0/config`);
	} catch (error) {
		throw toBridgeError(error);
	}

	const parsed = publicConfigSchema.safeParse(await response.json().catch(() => null));
	if (!response.ok || !parsed.success) {
		throw new BridgeError('not-a-bridge', 'Device did not answer like a Hue bridge');
	}
	return {
		id: parsed.data.bridgeid.toLowerCase(),
		name: parsed.data.name,
		modelId: parsed.data.modelid
	};
}

export type PairingResult =
	{ status: 'waiting' } | { status: 'paired'; appKey: string; clientKey: string };

const LINK_BUTTON_NOT_PRESSED = 101;

export async function requestAppKey(
	connection: Connection,
	deviceType: string
): Promise<PairingResult> {
	let data;
	try {
		({ data } = await createHueClient(connection).POST('/api', {
			body: { devicetype: deviceType, generateclientkey: true }
		}));
	} catch (error) {
		throw toBridgeError(error);
	}

	const entry = data?.[0];
	if (entry?.success?.username && entry.success.clientkey) {
		return { status: 'paired', appKey: entry.success.username, clientKey: entry.success.clientkey };
	}
	if (entry?.error?.type === LINK_BUTTON_NOT_PRESSED) return { status: 'waiting' };
	throw new BridgeError('pairing-failed', entry?.error?.description ?? 'Bridge refused pairing');
}

export type BridgeStatus = 'ok' | 'unauthorized' | 'unreachable' | 'certificate-mismatch';
export type BridgeFailure = Exclude<BridgeStatus, 'ok'>;

export function failureFromResponse(response: Response): BridgeFailure {
	return response.status === 401 || response.status === 403 ? 'unauthorized' : 'unreachable';
}

export function failureFromError(error: unknown): BridgeFailure {
	return toBridgeError(error).kind === 'certificate-mismatch'
		? 'certificate-mismatch'
		: 'unreachable';
}

export async function checkBridge(
	connection: Connection & { appKey: string }
): Promise<BridgeStatus> {
	try {
		const { response } = await createHueClient(connection).GET('/clip/v2/resource/bridge');
		return response.ok ? 'ok' : failureFromResponse(response);
	} catch (error) {
		return failureFromError(error);
	}
}
