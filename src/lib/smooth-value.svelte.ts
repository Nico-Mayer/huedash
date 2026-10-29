import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion, Tween } from 'svelte/motion';

const DURATION_MS = 300;

export class SmoothValue {
	#tween: Tween<number>;
	#input = $state<number | null>(null);

	constructor(live: () => number) {
		this.#tween = Tween.of(live, {
			duration: () => (prefersReducedMotion.current ? 0 : DURATION_MS),
			easing: cubicOut
		});
	}

	get current(): number {
		return this.#input ?? Math.round(this.#tween.current);
	}

	input(value: number) {
		this.#input = value;
	}

	// Jump, so the bridge confirming this value does not animate it in from the old one.
	commit(value: number) {
		this.#input = null;
		this.#tween.set(value, { duration: 0 });
	}
}
