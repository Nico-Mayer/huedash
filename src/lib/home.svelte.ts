import { version } from '$app/env';
import { SvelteMap } from 'svelte/reactivity';
import type { HomeSnapshot, HueSaturation, LiveUpdate, SceneStatus } from './live-updates.ts';
import type { HomeResult } from './server/hue/home.ts';

type Source = Pick<EventSource, 'onopen' | 'onerror' | 'onmessage' | 'close'>;

export type StateChange = {
	on?: boolean;
	brightness?: number;
	mirek?: number | null;
	hueSaturation?: HueSaturation | null;
};

type Entry<T> = { token: number; revision: number | null; value: T };

let tokens = 0;

// Values the user set that the home does not show yet: from the click until the server answers
// failure, or sends a home with the command's revision.
export class PendingChanges<T extends object> {
	readonly #entries = new SvelteMap<string, Entry<T>>();

	get(id: string): T | undefined {
		return this.#entries.get(id)?.value;
	}

	begin(id: string, value: T): number {
		const token = ++tokens;
		this.#entries.set(id, { token, revision: null, value: { ...this.get(id), ...value } });
		return token;
	}

	// Only the latest change for an id settles it, so an older answer cannot undo a newer value.
	settle(id: string, token: number, revision: number | null, current: number) {
		const entry = this.#entries.get(id);
		if (entry?.token !== token) return;
		if (revision === null || revision <= current) this.#entries.delete(id);
		else this.#entries.set(id, { ...entry, revision });
	}

	sweep(current: number) {
		for (const [id, entry] of this.#entries) {
			if (entry.revision !== null && entry.revision <= current) this.#entries.delete(id);
		}
	}

	clear() {
		this.#entries.clear();
	}
}

export class LiveHome {
	readonly lights = new PendingChanges<StateChange>();
	readonly groups = new PendingChanges<StateChange>();
	// By room or zone id: recalling a scene changes the status of every scene in it.
	readonly scenes = new PendingChanges<Record<string, SceneStatus>>();

	#snapshot = $state.raw<HomeSnapshot | null>(null);
	#browserOpen = $state(false);
	#bridgeOpen = $state(false);
	#wasOpen = $state(false);
	#fresh = false;
	#source: Source | undefined;

	readonly #createSource: (url: string) => Source;
	readonly #reload: () => void;

	constructor(
		createSource: (url: string) => Source = (url) => new EventSource(url),
		reload: () => void = () => location.reload()
	) {
		this.#createSource = createSource;
		this.#reload = reload;
	}

	get snapshot(): HomeSnapshot | null {
		return this.#snapshot;
	}

	get revision(): number {
		return this.#snapshot?.revision ?? 0;
	}

	// Before the first full connection there is nothing to have lost yet.
	get connected(): boolean {
		return !this.#wasOpen || this.open;
	}

	get open(): boolean {
		return this.#browserOpen && this.#bridgeOpen;
	}

	// The page data and the stream both carry a home; the newer one wins.
	current(loaded: HomeResult): HomeResult {
		const snapshot = this.#snapshot;
		if (snapshot && (loaded.status !== 'ok' || snapshot.revision >= loaded.revision)) {
			return { status: 'ok', ...snapshot };
		}
		return loaded;
	}

	connect() {
		if (this.#source) return;
		const source = this.#createSource('/api/events');
		this.#source = source;
		source.onopen = () => {
			this.#browserOpen = true;
			this.#settle();
		};
		source.onerror = () => {
			this.#browserOpen = false;
			this.#settle();
		};
		source.onmessage = (event) => this.apply(JSON.parse(event.data) as LiveUpdate);
	}

	apply(update: LiveUpdate) {
		switch (update.kind) {
			case 'hello':
				if (update.version !== version) this.#reload();
				// A restarted server counts revisions from the start again.
				this.#fresh = true;
				break;
			case 'status':
				this.#bridgeOpen = update.bridge === 'open';
				this.#settle();
				break;
			case 'home':
				if (!this.#fresh && update.revision <= this.revision) return;
				this.#fresh = false;
				this.#snapshot = { revision: update.revision, home: update.home };
				this.lights.sweep(update.revision);
				this.groups.sweep(update.revision);
				this.scenes.sweep(update.revision);
				break;
		}
	}

	#settle() {
		if (this.open) this.#wasOpen = true;
	}
}

export const live = new LiveHome();
