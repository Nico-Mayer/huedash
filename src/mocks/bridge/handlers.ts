import { http, HttpResponse, type HttpHandler } from 'msw/http';
import { createOpenApiHttp } from 'openapi-msw';
import type { paths } from '../../lib/server/hue/schema.d.ts';
import { bridge, MOCK_APP_KEY, MOCK_CLIENT_KEY, publicConfig } from './fixtures.ts';
import {
	groupedLights,
	holdEvents,
	home,
	onBridgeEvents,
	publishEvents,
	recallScene,
	updateEvent,
	updateGroupedLight,
	updateLight,
	type BridgeEvent
} from './home.ts';

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

let resourceReads = 0;

export function resetBridge() {
	Object.assign(linkButton, { pressed: false, pressAfterAttempts: Infinity, attempts: 0 });
	resourceReads = 0;
}

export const handlers: HttpHandler[] = [
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

function unauthorized(request: Request) {
	if (request.headers.get('hue-application-key') === MOCK_APP_KEY) return null;
	return HttpResponse.json({ errors: [{ description: 'unauthorized user' }] }, { status: 403 });
}

const collection = (path: string, read: () => unknown[]) =>
	http.get(`*/clip/v2/resource/${path}`, ({ request }) => {
		resourceReads++;
		return unauthorized(request) ?? HttpResponse.json({ errors: [], data: read() });
	});

// Test controls for e2e, where the mock runs in the server process. A real bridge has none.
const controls = [
	http.post('*/mock/events', async ({ request }) => {
		const { type = 'update', data } = (await request.json()) as {
			type?: BridgeEvent['type'];
			data: BridgeEvent['data'];
		};
		publishEvents([{ ...updateEvent(data), type }]);
		return new HttpResponse(null, { status: 204 });
	}),
	http.post('*/mock/hold-events', async ({ request }) => {
		holdEvents(((await request.json()) as { hold: boolean }).hold);
		return new HttpResponse(null, { status: 204 });
	}),
	http.get('*/mock/resource-reads', () => HttpResponse.json({ count: resourceReads }))
];

const command = (rtype: 'light' | 'grouped_light', apply: (id: string, body: never) => boolean) =>
	http.put(`*/clip/v2/resource/${rtype}/:id`, async ({ request, params }) => {
		const denied = unauthorized(request);
		if (denied) return denied;

		const id = String(params.id);
		if (!apply(id, (await request.json()) as never)) {
			return HttpResponse.json({ errors: [{ description: 'not found' }] }, { status: 404 });
		}
		return HttpResponse.json({ errors: [], data: [{ rid: id, rtype }] });
	});

let eventCount = 0;

// A plain streaming response: MSW's sse() needs a global EventSource, which Node does not have.
const eventStream = http.get('*/eventstream/clip/v2', ({ request }) => {
	const denied = unauthorized(request);
	if (denied) return denied;

	const encoder = new TextEncoder();
	let stop = () => {};
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(': hi\n\n'));
			stop = onBridgeEvents((events) => {
				const id = `${Math.floor(Date.now() / 1000)}:${eventCount++}`;
				controller.enqueue(encoder.encode(`id: ${id}\ndata: ${JSON.stringify(events)}\n\n`));
			});
			request.signal.addEventListener('abort', () => stop());
		},
		cancel: () => stop()
	});
	return new HttpResponse(body, { headers: { 'content-type': 'text/event-stream' } });
});

handlers.push(
	...controls,
	eventStream,
	collection('room', () => home.rooms),
	collection('zone', () => home.zones),
	collection('device', () => home.devices),
	collection('light', () => home.lights),
	collection('grouped_light', groupedLights),
	collection('zigbee_connectivity', () => home.connectivity),
	collection('scene', () => home.scenes),
	command('light', updateLight),
	command('grouped_light', updateGroupedLight),
	http.put('*/clip/v2/resource/scene/:id', async ({ request, params }) => {
		const denied = unauthorized(request);
		if (denied) return denied;

		const body = (await request.json()) as {
			recall?: { action?: 'active' | 'static' | 'dynamic_palette' };
		};
		const action = body.recall?.action;
		if (!action || !recallScene(String(params.id), action)) {
			return HttpResponse.json(
				{ errors: [{ description: 'invalid scene recall' }] },
				{ status: 404 }
			);
		}
		return HttpResponse.json({ errors: [], data: [{ rid: params.id, rtype: 'scene' }] });
	})
);

export const discoveredBridges = [
	{ id: publicConfig.bridgeid.toLowerCase(), internalipaddress: MOCK_BRIDGE_IP, port: 443 }
];

export function discoveryHandler(url: string, bridges = discoveredBridges) {
	return http.get(url, () => HttpResponse.json(bridges));
}

export const DISCOVERY_URL = 'https://discovery.meethue.com/';
