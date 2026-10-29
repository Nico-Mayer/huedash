import { findGroup } from '#lib/server/group-page.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) =>
	findGroup(await parent(), 'zone', params.id);
