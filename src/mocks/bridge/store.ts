import { createHomeStore, type HomeStore } from '../../lib/server/hue/store.ts';
import { MOCK_APP_KEY } from './fixtures.ts';
import { MOCK_BRIDGE_IP } from './handlers.ts';
import { mockBridgeStream } from './stream.ts';

export const mockConnection = {
	origin: `https://${MOCK_BRIDGE_IP}`,
	fetch: ((...args) => globalThis.fetch(...args)) as typeof fetch
};

const stores = new Set<HomeStore>();

export function createMockStore(
	options: Partial<Parameters<typeof createHomeStore>[0]> = {}
): HomeStore {
	const store = createHomeStore({
		connection: mockConnection,
		appKey: MOCK_APP_KEY,
		openStream: mockBridgeStream,
		...options
	});
	stores.add(store);
	return store;
}

export function closeMockStores() {
	stores.forEach((store) => store.close());
	stores.clear();
}
