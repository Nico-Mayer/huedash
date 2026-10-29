import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThrottle } from './throttle.ts';

let sent: [string, number][];
const send = async (key: string, value: number) => {
	sent.push([key, value]);
	return `sent ${value}`;
};

beforeEach(() => {
	vi.useFakeTimers();
	sent = [];
});

afterEach(() => vi.useRealTimers());

describe('createThrottle', () => {
	it('sends the first change at once and only the last one after the window', async () => {
		const throttled = createThrottle(1000, send);

		const first = throttled('kitchen', 10);
		const second = throttled('kitchen', 20);
		const third = throttled('kitchen', 30);

		expect(sent).toEqual([['kitchen', 10]]);

		await vi.advanceTimersByTimeAsync(1000);

		expect(sent).toEqual([
			['kitchen', 10],
			['kitchen', 30]
		]);
		expect(await first).toBe('sent 10');
		expect(await second).toBe('sent 30');
		expect(await third).toBe('sent 30');
	});

	it('limits each key separately', () => {
		const throttled = createThrottle(1000, send);

		throttled('kitchen', 1);
		throttled('living', 2);

		expect(sent).toEqual([
			['kitchen', 1],
			['living', 2]
		]);
	});

	it('sends at once again after a quiet window', async () => {
		const throttled = createThrottle(1000, send);

		throttled('kitchen', 1);
		await vi.advanceTimersByTimeAsync(1000);
		throttled('kitchen', 2);

		expect(sent).toEqual([
			['kitchen', 1],
			['kitchen', 2]
		]);
	});

	it('passes a failed send to every waiting caller', async () => {
		const throttled = createThrottle(1000, async (_key: string, value: number) => {
			if (value === 2) throw new Error('bridge said no');
			return 'ok';
		});

		await throttled('kitchen', 1);
		const failing = throttled('kitchen', 2);
		const expectation = expect(failing).rejects.toThrow('bridge said no');
		await vi.advanceTimersByTimeAsync(1000);

		await expectation;
	});
});
