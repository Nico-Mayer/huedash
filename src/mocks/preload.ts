import { MOCK_BRIDGE_IP } from './bridge/handlers.ts';
import { server } from './server.ts';

server.listen({ onUnhandledFrame: 'error' });
console.log(`[mock] Hue bridge mock active at ${MOCK_BRIDGE_IP}`);
