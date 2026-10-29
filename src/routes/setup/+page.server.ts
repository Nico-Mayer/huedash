import { fail, redirect } from '@sveltejs/kit';
import { discoverBridges } from '#lib/server/hue/discovery.ts';
import { checkAddress, pairWithBridge, PAIRING_COOKIE, PAIRING_TTL_MS } from '#lib/server/setup.ts';
import type { Actions } from './$types';

export const actions = {
	discover: async () => ({ discovery: await discoverBridges() }),

	check: async ({ request, cookies }) => {
		const address = String((await request.formData()).get('address') ?? '').trim();
		const result = await checkAddress(address);
		if (!result.ok) return fail(400, { address, checkError: result.error });

		// Self-hosted on a LAN over plain http, so a Secure cookie would never be sent back.
		cookies.set(PAIRING_COOKIE, result.token, {
			path: '/setup',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: PAIRING_TTL_MS / 1000
		});
		return { address, bridge: result.bridge };
	},

	pair: async ({ cookies }) => {
		const result = await pairWithBridge(cookies.get(PAIRING_COOKIE));
		if (result.status === 'paired') {
			cookies.delete(PAIRING_COOKIE, { path: '/setup' });
			redirect(303, '/');
		}
		if (result.status === 'waiting') return { pairing: 'waiting' as const };
		return fail(result.status === 'not-saved' ? 500 : 409, { pairError: result });
	}
} satisfies Actions;
