import type { BridgeStream } from '../../lib/server/hue/stream.ts';
import { onBridgeEvents } from './home.ts';

// Feeds mock bridge events to a store without HTTP: aborting a streamed response inside MSW's
// interceptor trips an undici assertion.
export function mockBridgeStream(): BridgeStream {
	let closed = false;
	const stream: BridgeStream = {
		onopen: null,
		onerror: null,
		onmessage: null,
		get closed() {
			return closed;
		},
		close() {
			closed = true;
			stop();
		}
	};
	const stop = onBridgeEvents((events) => stream.onmessage?.({ data: JSON.stringify(events) }));
	queueMicrotask(() => !closed && stream.onopen?.());
	return stream;
}
