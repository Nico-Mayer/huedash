import createClient from 'openapi-fetch';
import type { paths } from './schema.d.ts';
import type { BridgeFetch } from './tls.ts';

export const BRIDGE_TIMEOUT_MS = 5000;

export function withTimeout(fetchFn: BridgeFetch, timeoutMs = BRIDGE_TIMEOUT_MS): BridgeFetch {
	return (input, init) => fetchFn(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

export type HueClientOptions = {
	origin: string;
	fetch: BridgeFetch;
	appKey?: string;
	timeoutMs?: number;
};

export function createHueClient({ origin, fetch, appKey, timeoutMs }: HueClientOptions) {
	const timedFetch = withTimeout(fetch, timeoutMs);
	return createClient<paths>({
		baseUrl: origin,
		fetch: (request) => timedFetch(request),
		headers: appKey ? { 'hue-application-key': appKey } : undefined
	});
}
