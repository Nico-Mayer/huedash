import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { result } = await parent();
	if (result.status !== 'ok') return;

	const [room] = result.home.rooms;
	if (room) redirect(307, resolve('/(app)/rooms/[id]', { id: room.id }));
	const [zone] = result.home.zones;
	if (zone) redirect(307, resolve('/(app)/zones/[id]', { id: zone.id }));
};
