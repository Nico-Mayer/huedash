import { z } from 'zod';
import type { BridgeConfig } from '../config/index.ts';
import { failureFromError, failureFromResponse, type BridgeFailure } from './bridge.ts';
import { BRIDGE_TIMEOUT_MS, createHueClient } from './client.ts';
import { connectionFor, type Connection } from './connection.ts';
import { buildHome, type Home, type HomeResult } from './home.ts';
import {
	isResourceType,
	parseResource,
	parseResources,
	resourceTypes,
	type ResourceType,
	type Resources
} from './resources.ts';
import { openBridgeStream, type BridgeStream } from './stream.ts';

export type LinkStatus = 'open' | 'reconnecting';

export type StoreUpdate =
	{ kind: 'status'; bridge: LinkStatus } | { kind: 'home'; revision: number; home: Home };

type Listener = (update: StoreUpdate) => void;

type Raw = { id: string; type: string } & Record<string, unknown>;
type Change = { type: 'add' | 'update' | 'delete'; resource: Raw & { type: ResourceType } };

const eventSchema = z.array(
	z.object({
		type: z.enum(['add', 'update', 'delete', 'error']),
		data: z.array(z.looseObject({ id: z.string(), type: z.string() }))
	})
);

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

// Bridge updates hold only the changed fields, also inside nested objects.
function merge(base: Record<string, unknown>, update: Record<string, unknown>) {
	const result = { ...base };
	for (const [key, value] of Object.entries(update)) {
		const current = result[key];
		result[key] = isObject(current) && isObject(value) ? merge(current, value) : value;
	}
	return result;
}

function within(promise: Promise<unknown>, ms: number): Promise<unknown> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise((resolve) => (timer = setTimeout(resolve, ms)));
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Shared by all stores, so a tab never mistakes a new store's home for an older one.
let revisions = 0;

type StoreOptions = {
	connection: Connection;
	appKey: string;
	openStream?: (connection: Connection, appKey: string) => BridgeStream;
	batchMs?: number;
	restartMs?: number;
	openTimeoutMs?: number;
};

export type HomeStore = ReturnType<typeof createHomeStore>;

export function createHomeStore({
	connection,
	appKey,
	openStream = openBridgeStream,
	batchMs = 50,
	restartMs = 5_000,
	openTimeoutMs = BRIDGE_TIMEOUT_MS
}: StoreOptions) {
	const target = { ...connection, appKey };
	const listeners = new Set<Listener>();
	let maps: Record<ResourceType, Map<string, Raw>> | null = null;
	let home: Home | null = null;
	let revision = 0;
	let failure: BridgeFailure | null = null;
	let link: LinkStatus = 'reconnecting';
	let stream: BridgeStream | null = null;
	let opened: Promise<void> = Promise.resolve();
	let loading: Promise<void> | null = null;
	let loadAgain = false;
	// Events that arrive while the resources load are applied on top of the loaded state.
	let buffer: Change[] | null = null;
	let flushTimer: ReturnType<typeof setTimeout> | undefined;
	let restartTimer: ReturnType<typeof setTimeout> | undefined;
	let closed = false;

	const broadcast = (update: StoreUpdate) => listeners.forEach((listener) => listener(update));

	function setLink(next: LinkStatus) {
		if (link === next) return;
		link = next;
		broadcast({ kind: 'status', bridge: next });
	}

	function start() {
		if (stream || closed) return;
		let settle = () => {};
		opened = new Promise((resolve) => (settle = resolve));
		const current = openStream(connection, appKey);
		stream = current;
		current.onopen = () => {
			settle();
			setLink('open');
			void reload();
		};
		current.onerror = () => {
			settle();
			setLink('reconnecting');
			// eventsource retries network errors itself, but gives up after an error response.
			if (current.closed && stream === current) {
				stream = null;
				restartTimer = setTimeout(start, restartMs);
			}
		};
		current.onmessage = (event) => receive(event.data);
	}

	function receive(data: string) {
		let message: unknown;
		try {
			message = JSON.parse(data);
		} catch {
			return;
		}
		const parsed = eventSchema.safeParse(message);
		if (!parsed.success) return;

		let changed = false;
		for (const event of parsed.data) {
			if (event.type === 'error') continue;
			for (const resource of event.data) {
				if (!isResourceType(resource.type)) continue;
				const change = { type: event.type, resource } as Change;
				if (buffer) buffer.push(change);
				else changed = applyChange(change) || changed;
			}
		}
		if (changed) scheduleFlush();
	}

	function applyChange({ type, resource }: Change): boolean {
		const map = maps?.[resource.type];
		if (!map) return false;
		if (type === 'delete') return map.delete(resource.id);

		const existing = map.get(resource.id);
		if (type === 'update' && !existing) return false;
		const parsed = parseResource(
			resource.type,
			existing ? merge(existing, resource) : resource
		) as Raw | null;
		if (!parsed) return false;
		map.set(resource.id, parsed);
		return true;
	}

	function scheduleFlush() {
		flushTimer ??= setTimeout(flush, batchMs);
	}

	function flush() {
		clearTimeout(flushTimer);
		flushTimer = undefined;
		if (!maps) return;
		const resources = Object.fromEntries(
			resourceTypes.map((type) => [type, [...maps![type].values()]])
		) as unknown as Resources;
		home = buildHome(resources);
		revision = ++revisions;
		broadcast({ kind: 'home', revision, home });
	}

	async function load() {
		buffer = [];
		const client = createHueClient(target);
		try {
			const responses = await Promise.all(
				resourceTypes.map((type) =>
					client.GET(`/clip/v2/resource/${type}` as '/clip/v2/resource/light')
				)
			);
			const failed = responses.find(({ response }) => !response.ok);
			if (failed) {
				failure = failureFromResponse(failed.response);
				return;
			}

			maps = Object.fromEntries(
				resourceTypes.map((type, i) => {
					const items = parseResources(type, responses[i].data?.data ?? []) as Raw[];
					return [type, new Map(items.map((item) => [item.id, item]))];
				})
			) as Record<ResourceType, Map<string, Raw>>;
			const pending = buffer;
			buffer = null;
			pending.forEach(applyChange);
			failure = null;
			flush();
		} catch (error) {
			failure = failureFromError(error);
		} finally {
			buffer = null;
		}
	}

	function reload(): Promise<void> {
		if (loading) {
			loadAgain = true;
			return loading;
		}
		loading = load().finally(() => {
			loading = null;
			if (loadAgain && !closed) {
				loadAgain = false;
				void reload();
			}
		});
		return loading;
	}

	function result(): HomeResult {
		if (failure || !home) return { status: failure ?? 'unreachable' };
		return { status: 'ok', revision, home };
	}

	return {
		target,

		get home() {
			return home;
		},

		get revision() {
			return revision;
		},

		// Loads the home if there is no current copy; otherwise answers without a bridge request.
		async ready(): Promise<HomeResult> {
			start();
			await within(opened, openTimeoutMs);
			if (loading) await loading;
			if (!home || failure) await reload();
			return result();
		},

		// Applies accepted commands at once, before the bridge reports them, and returns the revision.
		apply(changes: { type: ResourceType; id: string; data: Record<string, unknown> }[]): number {
			for (const { type, id, data } of changes) {
				const change: Change = { type: 'update', resource: { ...data, id, type } };
				buffer?.push(change);
				applyChange(change);
			}
			flush();
			return revision;
		},

		subscribe(listener: Listener): () => void {
			listeners.add(listener);
			start();
			listener({ kind: 'status', bridge: link });
			if (home && !failure) listener({ kind: 'home', revision, home });
			else void this.ready();
			return () => listeners.delete(listener);
		},

		close() {
			closed = true;
			clearTimeout(flushTimer);
			clearTimeout(restartTimer);
			stream?.close();
			stream = null;
			listeners.clear();
		}
	};
}

let current: { key: string; store: HomeStore } | null = null;

// One bridge at a time: a new configuration closes the store of the previous one.
export function getHomeStore(config: BridgeConfig): HomeStore {
	const key = `${config.address.origin} ${config.certSha256 ?? 'capture'} ${config.appKey}`;
	if (current?.key !== key) {
		closeHomeStore();
		const store = createHomeStore({ connection: connectionFor(config), appKey: config.appKey });
		current = { key, store };
	}
	return current.store;
}

export function closeHomeStore() {
	current?.store.close();
	current = null;
}
