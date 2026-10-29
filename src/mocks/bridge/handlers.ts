import { http, HttpResponse } from 'msw/http';
import { bridge } from './fixtures.ts';

// TEST-NET-1 address, never routable, so a missed mock cannot reach a real device.
export const MOCK_BRIDGE_IP = '192.0.2.10';

const clip = (path: string) => `https://${MOCK_BRIDGE_IP}/clip/v2${path}`;

export const handlers = [
	http.get(clip('/resource/bridge'), () => HttpResponse.json({ errors: [], data: [bridge] }))
];
