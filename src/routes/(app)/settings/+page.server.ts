import { fail, redirect } from '@sveltejs/kit';
import { getBridgeConfig, getConfigStore } from '#lib/server/config/index.ts';
import { checkBridge } from '#lib/server/hue/bridge.ts';
import { connectionFor } from '#lib/server/hue/connection.ts';
import { closeHomeStore } from '#lib/server/hue/store.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const config = await getBridgeConfig();
	if (!config) redirect(303, '/setup');

	return {
		name: config.name,
		source: config.source,
		status: checkBridge({ ...connectionFor(config), appKey: config.appKey })
	};
};

export const actions = {
	forget: async () => {
		const config = await getBridgeConfig();
		if (config?.source === 'env') return fail(409, { forgetError: 'env' as const });

		await getConfigStore().remove();
		closeHomeStore();
		redirect(303, '/setup');
	}
} satisfies Actions;
