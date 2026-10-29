export function setupRedirect(pathname: string, configured: boolean): string | null {
	if (pathname === '/healthz' || pathname.startsWith('/api/')) return null;

	const inSetup = pathname === '/setup' || pathname.startsWith('/setup/');
	if (!configured && !inSetup) return '/setup';
	if (configured && inSetup) return '/';
	return null;
}
