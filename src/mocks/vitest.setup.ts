import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { closeHomeStore } from '../lib/server/hue/store.ts';
import { resetBridge } from './bridge/handlers.ts';
import { resetHome } from './bridge/home.ts';
import { closeMockStores } from './bridge/store.ts';
import { server } from './server.ts';

vi.mock('../lib/server/hue/stream.ts', async () => ({
	openBridgeStream: (await import('./bridge/stream.ts')).mockBridgeStream
}));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
	server.resetHandlers();
	resetBridge();
	resetHome();
	closeHomeStore();
	closeMockStores();
});
afterAll(() => server.close());
