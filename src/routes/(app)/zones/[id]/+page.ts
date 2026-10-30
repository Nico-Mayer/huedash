import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({ kind: 'zone' as const, id: params.id });
