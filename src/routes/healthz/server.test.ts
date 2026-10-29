import { describe, expect, it } from 'vitest';
import type { RequestEvent } from './$types';
import { GET } from './+server';

describe('GET /healthz', () => {
	it('reports ok without caching', async () => {
		const response = await GET({} as RequestEvent);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ status: 'ok' });
	});
});
