import { SvelteSet } from 'svelte/reactivity';

export class Selection {
	readonly ids = new SvelteSet<string>();
	selecting = $state(false);
	#groupId: string | null = null;

	has(id: string): boolean {
		return this.ids.has(id);
	}

	only(id: string) {
		this.ids.clear();
		this.ids.add(id);
	}

	toggle(id: string) {
		if (this.ids.has(id)) this.ids.delete(id);
		else this.ids.add(id);
	}

	clear() {
		this.ids.clear();
		this.selecting = false;
	}

	start() {
		this.selecting = true;
	}

	done() {
		this.selecting = false;
	}

	forGroup(groupId: string) {
		if (groupId === this.#groupId) return;
		this.#groupId = groupId;
		this.clear();
	}
}

export const selection = new Selection();
