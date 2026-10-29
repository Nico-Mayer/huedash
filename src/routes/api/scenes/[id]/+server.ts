import { commandEndpoint } from '#lib/server/api/command-endpoint.ts';
import { commands, sceneCommandSchema } from '#lib/server/hue/commands.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = commandEndpoint(sceneCommandSchema, commands.setScene);
