import { EventSource, type FetchLike } from 'eventsource';
import type { LiveUpdate } from '../../live-updates.ts';
import type { BridgeConfig } from '../config/index.ts';
import { connectionFor, type Connection } from './connection.ts';
import { toUpdates } from './updates.ts';

type Listener = (update: LiveUpdate) => void;
type LinkStatus = 'open' | 'reconnecting';

type HubOptions = {
	connection: Connection;
	appKey: string;
	idleCloseMs?: number;
	restartMs?: number;
};

export type EventHub = ReturnType<typeof createEventHub>;

export function createEventHub({
	connection,
	appKey,
	idleCloseMs = 30_000,
	restartMs = 5_000
}: HubOptions) {
	const listeners = new Set<Listener>();
	let source: EventSource | null = null;
	let status: LinkStatus = 'reconnecting';
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let restartTimer: ReturnType<typeof setTimeout> | undefined;

	const broadcast = (update: LiveUpdate) => listeners.forEach((listener) => listener(update));

	function setStatus(next: LinkStatus) {
		if (status === next) return;
		status = next;
		broadcast({ kind: 'status', bridge: next });
	}

	const fetchWithKey: FetchLike = (url, init) =>
		connection.fetch(url, {
			...init,
			headers: { ...init.headers, 'hue-application-key': appKey }
		});

	function start() {
		source = new EventSource(`${connection.origin}/eventstream/clip/v2`, { fetch: fetchWithKey });
		source.onopen = () => setStatus('open');
		source.onerror = () => {
			setStatus('reconnecting');
			// eventsource retries network errors itself, but gives up after an error response.
			if (source?.readyState === EventSource.CLOSED) {
				source = null;
				restartTimer = setTimeout(() => listeners.size > 0 && !source && start(), restartMs);
			}
		};
		source.onmessage = (event) => {
			let message: unknown;
			try {
				message = JSON.parse(event.data);
			} catch {
				return;
			}
			toUpdates(message).forEach(broadcast);
		};
	}

	function stop() {
		clearTimeout(restartTimer);
		source?.close();
		source = null;
		status = 'reconnecting';
	}

	return {
		get running() {
			return source !== null;
		},

		subscribe(listener: Listener): () => void {
			clearTimeout(idleTimer);
			listeners.add(listener);
			if (!source) start();
			listener({ kind: 'status', bridge: status });

			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) idleTimer = setTimeout(stop, idleCloseMs);
			};
		}
	};
}

const hubs = new Map<string, EventHub>();

export function getEventHub(config: BridgeConfig): EventHub {
	const key = `${config.address.origin} ${config.certSha256 ?? 'capture'} ${config.appKey}`;
	let hub = hubs.get(key);
	if (!hub) {
		hub = createEventHub({ connection: connectionFor(config), appKey: config.appKey });
		hubs.set(key, hub);
	}
	return hub;
}
