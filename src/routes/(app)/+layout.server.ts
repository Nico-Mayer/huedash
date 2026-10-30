import { redirect } from '@sveltejs/kit';
import { getBridgeConfig } from '#lib/server/config/index.ts';
import { getHomeStore } from '#lib/server/hue/store.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const config = await getBridgeConfig();
	if (!config) redirect(303, '/setup');

	return { bridgeName: config.name, result: await getHomeStore(config).ready() };
};
