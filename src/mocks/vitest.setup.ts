import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetBridge } from './bridge/handlers.ts';
import { server } from './server.ts';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
	server.resetHandlers();
	resetBridge();
});
afterAll(() => server.close());
