import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Live } from './live.svelte.ts';
import type { LiveUpdate } from './live-updates.ts';

const navigation = vi.hoisted(() => ({ refreshAll: vi.fn(async () => {}) }));
vi.mock('$app/navigation', () => navigation);

class FakeSource {
	onopen: ((event: Event) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	close = vi.fn();

	open() {
		this.onopen?.(new Event('open'));
	}
	fail() {
		this.onerror?.(new Event('error'));
	}
	send(update: LiveUpdate) {
		this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(update) }));
	}
}

let source: FakeSource;
let live: Live;

function connect() {
	live = new Live(() => (source = new FakeSource()) as never);
	live.connect();
	source.open();
	source.send({ kind: 'status', bridge: 'open' });
}

beforeEach(() => navigation.refreshAll.mockClear());
afterEach(() => vi.useRealTimers());

describe('Live', () => {
	it('merges light and group updates', () => {
		connect();

		source.send({ kind: 'group', id: 'grouped-kitchen', on: false });
		source.send({ kind: 'group', id: 'grouped-kitchen', brightness: 40 });
		source.send({ kind: 'light', id: 'ceiling', on: true });

		expect(live.groups.get('grouped-kitchen')).toEqual({
			kind: 'group',
			id: 'grouped-kitchen',
			on: false,
			brightness: 40
		});
		expect(live.lights.get('ceiling')).toMatchObject({ on: true });
	});

	it('connects only once', () => {
		const create = vi.fn(() => new FakeSource() as never);
		const once = new Live(create);

		once.connect();
		once.connect();

		expect(create).toHaveBeenCalledOnce();
	});

	it('does not report a lost connection before the first full connection', () => {
		live = new Live(() => (source = new FakeSource()) as never);
		live.connect();
		source.send({ kind: 'status', bridge: 'reconnecting' });

		expect(live.connected).toBe(true);
		expect(navigation.refreshAll).not.toHaveBeenCalled();
	});

	it('reports a lost bridge stream and reloads once it is back', async () => {
		connect();

		source.send({ kind: 'status', bridge: 'reconnecting' });
		expect(live.connected).toBe(false);

		source.send({ kind: 'status', bridge: 'open' });
		expect(live.connected).toBe(true);
		expect(navigation.refreshAll).toHaveBeenCalledOnce();
	});

	it('reports a lost browser connection', () => {
		connect();

		source.fail();

		expect(live.connected).toBe(false);
	});

	it('reloads at most once per second and runs a queued reload afterwards', async () => {
		vi.useFakeTimers();
		connect();

		source.send({ kind: 'reload' });
		source.send({ kind: 'reload' });
		source.send({ kind: 'reload' });
		await vi.advanceTimersByTimeAsync(0);
		expect(navigation.refreshAll).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1000);
		expect(navigation.refreshAll).toHaveBeenCalledTimes(2);
	});

	it('clears overrides after a reload', async () => {
		connect();
		source.send({ kind: 'group', id: 'grouped-kitchen', on: false });

		await live.reload();

		expect(live.groups.size).toBe(0);
	});
});
