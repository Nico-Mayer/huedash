export type HueSaturation = { hue: number; saturation: number };

export type StateUpdate = {
	id: string;
	on?: boolean;
	brightness?: number;
	// Lights only. A light shows either a white or a color, so setting one clears the other.
	mirek?: number | null;
	hueSaturation?: HueSaturation | null;
};

export type SceneStatus = 'inactive' | 'static' | 'dynamic_palette';

export type LiveUpdate =
	| ({ kind: 'light' } & StateUpdate)
	| ({ kind: 'group' } & StateUpdate)
	| { kind: 'scene'; id: string; active: SceneStatus }
	| { kind: 'reload' }
	| { kind: 'status'; bridge: 'open' | 'reconnecting' };
