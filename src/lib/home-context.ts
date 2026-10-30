import { createContext } from 'svelte';
import type { HomeResult } from './server/hue/home.ts';

export const [getHomeResult, setHomeResult] = createContext<() => HomeResult>();
