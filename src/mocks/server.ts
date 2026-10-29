import { setupServer } from 'msw/node';
import { handlers } from './bridge/handlers.ts';

export const server = setupServer(...handlers);
