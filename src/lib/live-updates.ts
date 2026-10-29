export type StateUpdate = { id: string; on?: boolean; brightness?: number };

export type SceneStatus = 'inactive' | 'static' | 'dynamic_palette';

export type LiveUpdate =
	| ({ kind: 'light' } & StateUpdate)
	| ({ kind: 'group' } & StateUpdate)
	| { kind: 'scene'; id: string; active: SceneStatus }
	| { kind: 'reload' }
	| { kind: 'status'; bridge: 'open' | 'reconnecting' };
