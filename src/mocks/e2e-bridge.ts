import { request, type APIRequestContext } from '@playwright/test';
import type { BridgeEvent } from './bridge/home.ts';
import { E2E_BRIDGE_ADDRESS } from './e2e.ts';

let context: APIRequestContext | undefined;

async function bridge() {
	context ??= await request.newContext({
		baseURL: `https://${E2E_BRIDGE_ADDRESS}`,
		ignoreHTTPSErrors: true
	});
	return context;
}

export async function publish(data: BridgeEvent['data'], type: BridgeEvent['type'] = 'update') {
	await (await bridge()).post('/mock/events', { data: { type, data } });
}

export async function holdEvents(hold: boolean) {
	await (await bridge()).post('/mock/hold-events', { data: { hold } });
}

export async function resourceReads(): Promise<number> {
	const response = await (await bridge()).get('/mock/resource-reads');
	return ((await response.json()) as { count: number }).count;
}
