import { refreshAll } from '$app/navigation';
import { SvelteMap } from 'svelte/reactivity';
import type { LiveUpdate, StateUpdate } from './live-updates.ts';

type Source = Pick<EventSource, 'onopen' | 'onerror' | 'onmessage' | 'close'>;

const RELOAD_GAP_MS = 1000;

export class Live {
	readonly lights = new SvelteMap<string, StateUpdate>();
	readonly groups = new SvelteMap<string, StateUpdate>();

	#browserOpen = $state(false);
	#bridgeOpen = $state(false);
	#wasOpen = $state(false);
	#lost = false;
	#source: Source | undefined;
	#reloading: Promise<void> | undefined;
	#again = false;

	constructor(private createSource: (url: string) => Source = (url) => new EventSource(url)) {}

	// Before the first full connection there is nothing to have lost yet.
	get connected(): boolean {
		return !this.#wasOpen || (this.#browserOpen && this.#bridgeOpen);
	}

	connect() {
		if (this.#source) return;
		const source = this.createSource('/api/events');
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
			case 'light':
				this.lights.set(update.id, { ...this.lights.get(update.id), ...update });
				break;
			case 'group':
				this.groups.set(update.id, { ...this.groups.get(update.id), ...update });
				break;
			case 'reload':
				this.reload();
				break;
			case 'status':
				this.#bridgeOpen = update.bridge === 'open';
				this.#settle();
				break;
		}
	}

	// At most one reload per second; a request during that time runs once afterwards.
	// Fresh data already contains the live values, so the overrides are cleared.
	reload(): Promise<void> {
		if (this.#reloading) {
			this.#again = true;
			return this.#reloading;
		}
		this.#reloading = refreshAll()
			.then(() => {
				this.lights.clear();
				this.groups.clear();
			})
			.finally(() =>
				setTimeout(() => {
					this.#reloading = undefined;
					if (this.#again) {
						this.#again = false;
						this.reload();
					}
				}, RELOAD_GAP_MS)
			);
		return this.#reloading;
	}

	#settle() {
		const open = this.#browserOpen && this.#bridgeOpen;
		if (open && this.#lost) {
			this.#lost = false;
			this.reload();
		}
		if (open) this.#wasOpen = true;
		else if (this.#wasOpen) this.#lost = true;
	}
}

export const live = new Live();
