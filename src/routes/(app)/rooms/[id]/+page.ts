import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({ kind: 'room' as const, id: params.id });
