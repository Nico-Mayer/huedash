import { http, HttpResponse } from 'msw/http';
import { createOpenApiHttp } from 'openapi-msw';
import type { paths } from '../../lib/server/hue/schema.d.ts';
import { bridge, MOCK_APP_KEY, MOCK_CLIENT_KEY, publicConfig } from './fixtures.ts';

// TEST-NET-1 address, never routable, so a missed mock cannot reach a real device.
export const MOCK_BRIDGE_IP = '192.0.2.10';

const clip = createOpenApiHttp<paths>({ baseUrl: '*' });

const linkButton = { pressed: false, pressAfterAttempts: Infinity, attempts: 0 };

export function pressLinkButton() {
	linkButton.pressed = true;
}

/** Simulates a user who presses the link button after the given number of pairing attempts. */
export function pressLinkButtonAfter(attempts: number) {
	linkButton.pressAfterAttempts = attempts;
}

export function resetBridge() {
	Object.assign(linkButton, { pressed: false, pressAfterAttempts: Infinity, attempts: 0 });
}

export const handlers = [
	http.get('*/api/0/config', () => HttpResponse.json(publicConfig)),

	clip.post('/api', ({ response }) => {
		linkButton.attempts++;
		if (linkButton.attempts > linkButton.pressAfterAttempts) linkButton.pressed = true;

		if (!linkButton.pressed) {
			return response(200).json([
				{ error: { type: 101, address: '', description: 'link button not pressed' } }
			]);
		}
		return response(200).json([
			{ success: { username: MOCK_APP_KEY, clientkey: MOCK_CLIENT_KEY } }
		]);
	}),

	clip.get('/clip/v2/resource/bridge', ({ request, response }) => {
		if (request.headers.get('hue-application-key') !== MOCK_APP_KEY) {
			return response(403).json({ errors: [{ description: 'unauthorized user' }] });
		}
		return response(200).json({ errors: [], data: [bridge] });
	})
];

export const discoveredBridges = [
	{ id: publicConfig.bridgeid.toLowerCase(), internalipaddress: MOCK_BRIDGE_IP, port: 443 }
];

export function discoveryHandler(url: string, bridges = discoveredBridges) {
	return http.get(url, () => HttpResponse.json(bridges));
}

export const DISCOVERY_URL = 'https://discovery.meethue.com/';
