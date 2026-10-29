import { describe, expect, it } from 'vitest';
import { setupRedirect } from './setup-redirect.ts';

describe('setupRedirect', () => {
	it.each([
		['/', false, '/setup'],
		['/rooms', false, '/setup'],
		['/setup', false, null],
		['/healthz', false, null],
		['/', true, null],
		['/setup', true, '/'],
		['/healthz', true, null],
		['/api/groups/x', false, null]
	])('%s with configured=%s redirects to %s', (path, configured, target) => {
		expect(setupRedirect(path, configured)).toBe(target);
	});
});
