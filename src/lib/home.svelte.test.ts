import { version } from '$app/env';
import { describe, expect, it, vi } from 'vitest';
import { LiveHome, PendingChanges } from './home.svelte.ts';
import type { LiveUpdate } from './live-updates.ts';
import type { Home } from './server/hue/home.ts';

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

const home = (name: string): Home => ({
	lights: {},
	rooms: [
		{
			kind: 'room',
			id: 'room-kitchen',
			name,
			groupedLightId: 'grouped-kitchen',
			on: true,
			brightness: 50,
			lightIds: [],
			colorTemperature: null,
			whiteStops: null,
			color: false,
			scenes: []
		}
	],
	zones: []
});

function connect() {
	let source!: FakeSource;
	const reload = vi.fn();
	const live = new LiveHome(() => (source = new FakeSource()) as never, reload);
	live.connect();
	source.open();
	source.send({ kind: 'hello', version });
	source.send({ kind: 'status', bridge: 'open' });
	return { live, source, reload };
}

describe('LiveHome', () => {
	it('takes the home from the stream', () => {
		const { live, source } = connect();

		source.send({ kind: 'home', revision: 3, home: home('Kitchen') });

		expect(live.snapshot).toEqual({ revision: 3, home: home('Kitchen') });
	});

	it('ignores a home that is not newer', () => {
		const { live, source } = connect();

		source.send({ kind: 'home', revision: 3, home: home('Kitchen') });
		source.send({ kind: 'home', revision: 2, home: home('Old') });

		expect(live.snapshot?.home.rooms[0].name).toBe('Kitchen');
	});

	it('accepts the first home after a reconnect, even with a lower revision', () => {
		const { live, source } = connect();
		source.send({ kind: 'home', revision: 30, home: home('Kitchen') });

		source.send({ kind: 'hello', version });
		source.send({ kind: 'home', revision: 2, home: home('Cooking') });

		expect(live.snapshot).toEqual({ revision: 2, home: home('Cooking') });
	});

	it('prefers the newer of page data and stream', () => {
		const { live, source } = connect();
		source.send({ kind: 'home', revision: 3, home: home('Stream') });

		expect(live.current({ status: 'ok', revision: 2, home: home('Page') })).toMatchObject({
			home: { rooms: [{ name: 'Stream' }] }
		});
		expect(live.current({ status: 'ok', revision: 4, home: home('Page') })).toMatchObject({
			home: { rooms: [{ name: 'Page' }] }
		});
		expect(live.current({ status: 'unreachable' })).toMatchObject({ status: 'ok' });
	});

	it('reloads the page when the server runs another version', () => {
		const { source, reload } = connect();

		source.send({ kind: 'hello', version: `${version}-new` });

		expect(reload).toHaveBeenCalledOnce();
	});

	it('connects only once', () => {
		const create = vi.fn(() => new FakeSource() as never);
		const once = new LiveHome(create);

		once.connect();
		once.connect();

		expect(create).toHaveBeenCalledOnce();
	});

	it('does not report a lost connection before the first full connection', () => {
		let source!: FakeSource;
		const live = new LiveHome(() => (source = new FakeSource()) as never);
		live.connect();
		source.send({ kind: 'status', bridge: 'reconnecting' });

		expect(live.connected).toBe(true);
	});

	it('reports a lost bridge stream until it is back', () => {
		const { live, source } = connect();

		source.send({ kind: 'status', bridge: 'reconnecting' });
		expect(live.connected).toBe(false);

		source.send({ kind: 'status', bridge: 'open' });
		expect(live.connected).toBe(true);
	});

	it('reports a lost browser connection', () => {
		const { live, source } = connect();

		source.fail();

		expect(live.connected).toBe(false);
	});

	it('keeps a pending change until a home with its revision arrives', () => {
		const { live, source } = connect();
		const token = live.groups.begin('grouped-kitchen', { on: false });

		live.groups.settle('grouped-kitchen', token, 5, live.revision);
		source.send({ kind: 'home', revision: 4, home: home('Kitchen') });
		expect(live.groups.get('grouped-kitchen')).toEqual({ on: false });

		source.send({ kind: 'home', revision: 5, home: home('Kitchen') });
		expect(live.groups.get('grouped-kitchen')).toBeUndefined();
	});
});

describe('PendingChanges', () => {
	it('drops a change that failed', () => {
		const pending = new PendingChanges<{ on?: boolean }>();
		const token = pending.begin('ceiling', { on: true });

		pending.settle('ceiling', token, null, 0);

		expect(pending.get('ceiling')).toBeUndefined();
	});

	it('drops a change at once when the home already holds its revision', () => {
		const pending = new PendingChanges<{ on?: boolean }>();
		const token = pending.begin('ceiling', { on: true });

		pending.settle('ceiling', token, 3, 3);

		expect(pending.get('ceiling')).toBeUndefined();
	});

	it('combines changes and lets only the newest answer settle them', () => {
		const pending = new PendingChanges<{ on?: boolean; brightness?: number }>();
		const older = pending.begin('ceiling', { on: true });
		const newer = pending.begin('ceiling', { brightness: 40 });

		pending.settle('ceiling', older, null, 0);
		expect(pending.get('ceiling')).toEqual({ on: true, brightness: 40 });

		pending.settle('ceiling', newer, null, 0);
		expect(pending.get('ceiling')).toBeUndefined();
	});
});
