import { findGroup } from '#lib/group-page.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) =>
	findGroup(await parent(), 'room', params.id);
