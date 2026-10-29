import { setupServer } from 'msw/node';
import { handlers } from './bridge/handlers.js';

export const server = setupServer(...handlers);
