import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetBridge } from './bridge/handlers.ts';
import { resetHome } from './bridge/home.ts';
import { server } from './server.ts';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
	server.resetHandlers();
	resetBridge();
	resetHome();
});
afterAll(() => server.close());
