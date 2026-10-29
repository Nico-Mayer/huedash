import { setupServer } from 'msw/node';
import { DISCOVERY_URL, discoveryHandler, handlers } from './bridge/handlers.ts';

export const server = setupServer(...handlers, discoveryHandler(DISCOVERY_URL));
