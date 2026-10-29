import { loadGroupPage } from '#lib/server/group-page.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => loadGroupPage('zone', params.id);
