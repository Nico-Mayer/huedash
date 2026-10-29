import { z } from 'zod';
import { parseBridgeAddress } from './address.ts';

export const DEFAULT_DISCOVERY_URL = 'https://discovery.meethue.com/';
const DISCOVERY_TIMEOUT_MS = 10_000;

const responseSchema = z.array(
	z.object({ id: z.string(), internalipaddress: z.string(), port: z.number().optional() })
);

export type DiscoveredBridge = { id: string; address: string };

export type DiscoveryResult =
	| { status: 'found'; bridges: DiscoveredBridge[] }
	| { status: 'failed'; reason: 'rate-limited' | 'unavailable' };

type DiscoveryOptions = { url?: string; fetch?: typeof fetch; timeoutMs?: number };

export async function discoverBridges({
	url = process.env.HUE_DISCOVERY_URL || DEFAULT_DISCOVERY_URL,
	fetch = globalThis.fetch,
	timeoutMs = DISCOVERY_TIMEOUT_MS
}: DiscoveryOptions = {}): Promise<DiscoveryResult> {
	let response: Response;
	try {
		response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
	} catch {
		return { status: 'failed', reason: 'unavailable' };
	}

	if (response.status === 429) return { status: 'failed', reason: 'rate-limited' };

	const parsed = responseSchema.safeParse(await response.json().catch(() => null));
	if (!response.ok || !parsed.success) return { status: 'failed', reason: 'unavailable' };

	const bridges = parsed.data.flatMap(({ id, internalipaddress, port }) => {
		const address = port && port !== 443 ? `${internalipaddress}:${port}` : internalipaddress;
		return parseBridgeAddress(address) ? [{ id: id.toLowerCase(), address }] : [];
	});
	return { status: 'found', bridges };
}
