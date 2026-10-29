type Waiter<R> = { resolve: (result: R) => void; reject: (error: unknown) => void };

type KeyState<T, R> = {
	windowEnds: number;
	pending?: { value: T; waiters: Waiter<R>[] };
};

// Leading and trailing throttle per key: the first call in a window goes out at once, later
// calls replace each other, and the last one goes out when the window ends. Replaced callers
// receive the result of the command that superseded their value.
export function createThrottle<T, R>(
	windowMs: number,
	send: (key: string, value: T) => Promise<R>
): (key: string, value: T) => Promise<R> {
	const keys = new Map<string, KeyState<T, R>>();

	function flush(key: string, state: KeyState<T, R>) {
		const pending = state.pending;
		if (!pending) return;
		state.pending = undefined;
		state.windowEnds = Date.now() + windowMs;
		send(key, pending.value).then(
			(result) => pending.waiters.forEach((w) => w.resolve(result)),
			(error) => pending.waiters.forEach((w) => w.reject(error))
		);
	}

	return (key, value) => {
		const now = Date.now();
		const state = keys.get(key);

		if (!state || (now >= state.windowEnds && !state.pending)) {
			keys.set(key, { windowEnds: now + windowMs });
			return send(key, value);
		}

		return new Promise<R>((resolve, reject) => {
			if (state.pending) {
				state.pending.value = value;
				state.pending.waiters.push({ resolve, reject });
				return;
			}
			state.pending = { value, waiters: [{ resolve, reject }] };
			setTimeout(() => flush(key, state), Math.max(0, state.windowEnds - now));
		});
	};
}
