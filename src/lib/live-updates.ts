import type { Home } from './server/hue/home.ts';

export type HueSaturation = { hue: number; saturation: number };

export type SceneStatus = 'inactive' | 'static' | 'dynamic_palette';

export type HomeSnapshot = { revision: number; home: Home };

export type LiveUpdate =
	| { kind: 'hello'; version: string }
	| { kind: 'status'; bridge: 'open' | 'reconnecting' }
	| ({ kind: 'home' } & HomeSnapshot);
