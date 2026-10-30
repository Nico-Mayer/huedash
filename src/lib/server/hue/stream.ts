import { EventSource, type FetchLike } from 'eventsource';
import type { Connection } from './connection.ts';

export type BridgeStream = {
	onopen: (() => void) | null;
	onerror: (() => void) | null;
	onmessage: ((event: { data: string }) => void) | null;
	readonly closed: boolean;
	close(): void;
};

export function openBridgeStream(connection: Connection, appKey: string): BridgeStream {
	const fetchWithKey: FetchLike = (url, init) =>
		connection.fetch(url, {
			...init,
			headers: { ...init.headers, 'hue-application-key': appKey }
		});

	const source = new EventSource(`${connection.origin}/eventstream/clip/v2`, {
		fetch: fetchWithKey
	});
	const stream: BridgeStream = {
		onopen: null,
		onerror: null,
		onmessage: null,
		get closed() {
			return source.readyState === EventSource.CLOSED;
		},
		close: () => source.close()
	};
	source.onopen = () => stream.onopen?.();
	source.onerror = () => stream.onerror?.();
	source.onmessage = (event) => stream.onmessage?.(event);
	return stream;
}
