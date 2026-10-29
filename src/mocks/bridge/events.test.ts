import { describe, expect, it } from 'vitest';
import { MOCK_APP_KEY } from './fixtures.ts';
import { MOCK_BRIDGE_IP } from './handlers.ts';

const origin = `https://${MOCK_BRIDGE_IP}`;
const headers = { 'hue-application-key': MOCK_APP_KEY };

async function firstMessage(response: Response): Promise<string> {
	const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
	let text = '';
	while (!text.includes('\n\n')) {
		const { value, done } = await reader.read();
		if (done) break;
		text += value;
	}
	await reader.cancel();
	return text;
}

describe('mock bridge event stream', () => {
	it('reports a light and its groups after a command', async () => {
		const controller = new AbortController();
		const stream = await fetch(`${origin}/eventstream/clip/v2`, {
			headers: { ...headers, accept: 'text/event-stream' },
			signal: controller.signal
		});

		await fetch(`${origin}/clip/v2/resource/light/ceiling`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({ on: { on: false } })
		});

		const message = await firstMessage(stream);
		controller.abort();
		const data = JSON.parse(
			message
				.split('\n')
				.find((line) => line.startsWith('data:'))!
				.slice(5)
		);

		expect(data).toEqual([
			expect.objectContaining({
				type: 'update',
				data: [
					expect.objectContaining({ id: 'ceiling', type: 'light', on: { on: false } }),
					expect.objectContaining({ id: 'grouped-kitchen', type: 'grouped_light' }),
					expect.objectContaining({ id: 'grouped-downstairs', type: 'grouped_light' })
				]
			})
		]);
	});

	it('refuses the stream without the app key', async () => {
		expect((await fetch(`${origin}/eventstream/clip/v2`)).status).toBe(403);
	});
});
