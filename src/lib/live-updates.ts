export type StateUpdate = { id: string; on?: boolean; brightness?: number };

export type LiveUpdate =
	| ({ kind: 'light' } & StateUpdate)
	| ({ kind: 'group' } & StateUpdate)
	| { kind: 'reload' }
	| { kind: 'status'; bridge: 'open' | 'reconnecting' };
