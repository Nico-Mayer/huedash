import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { getBridgeConfig } from '#lib/server/config/index.ts';
import { setupRedirect } from '#lib/server/setup-redirect.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const target = setupRedirect(event.url.pathname, (await getBridgeConfig()) !== null);
	if (target) redirect(303, target);
	return resolve(event);
};
