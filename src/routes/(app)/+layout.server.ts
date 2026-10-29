import { redirect } from '@sveltejs/kit';
import { getBridgeConfig } from '#lib/server/config/index.ts';
import { connectionFor } from '#lib/server/hue/connection.ts';
import { loadHome } from '#lib/server/hue/home.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const config = await getBridgeConfig();
	if (!config) redirect(303, '/setup');

	return {
		bridgeName: config.name,
		result: await loadHome({ ...connectionFor(config), appKey: config.appKey })
	};
};
