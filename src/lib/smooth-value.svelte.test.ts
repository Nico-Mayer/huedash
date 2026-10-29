import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SmoothValue } from './smooth-value.svelte.ts';

const motion = vi.hoisted(() => ({ reduced: false }));

vi.mock('svelte/motion', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/motion')>()),
	prefersReducedMotion: {
		get current() {
			return motion.reduced;
		}
	}
}));

let cleanup: (() => void) | undefined;

function follow(start: number) {
	let live = $state(start);
	let smooth!: SmoothValue;
	cleanup = $effect.root(() => {
		smooth = new SmoothValue(() => live);
	});
	return {
		smooth,
		set(value: number) {
			live = value;
			flushSync();
		}
	};
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
	cleanup?.();
	motion.reduced = false;
});

describe('SmoothValue', () => {
	it('starts at the live value', () => {
		const { smooth } = follow(70);

		expect(smooth.current).toBe(70);
	});

	it('moves through values in between to an outside change', async () => {
		const { smooth, set } = follow(80);

		set(30);
		await wait(100);

		expect(smooth.current).toBeGreaterThan(30);
		expect(smooth.current).toBeLessThan(80);
		await expect.poll(() => smooth.current).toBe(30);
	});

	it('shows the input while the user changes the value', async () => {
		const { smooth, set } = follow(80);

		smooth.input(50);
		set(20);
		await wait(400);

		expect(smooth.current).toBe(50);
	});

	it('stays at a committed value when the bridge confirms it', async () => {
		const { smooth, set } = follow(80);

		smooth.input(40);
		smooth.commit(40);
		set(40);
		await wait(50);

		expect(smooth.current).toBe(40);
	});

	it('jumps when the browser prefers reduced motion', async () => {
		motion.reduced = true;
		const { smooth, set } = follow(80);

		set(30);
		await wait(50);

		expect(smooth.current).toBe(30);
	});
});
