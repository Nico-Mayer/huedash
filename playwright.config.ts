import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import { E2E_APP_PORT, E2E_DISCOVERY_URL } from './src/mocks/e2e.ts';

export default defineConfig({
	use: { baseURL: `http://localhost:${E2E_APP_PORT}` },
	// Pairing runs first and leaves the bridge paired for the app tests.
	projects: [
		{ name: 'setup', testMatch: ['**/setup.e2e.ts', '**/healthz.e2e.ts'] },
		{
			name: 'app',
			testMatch: '**/*.e2e.ts',
			testIgnore: ['**/setup.e2e.ts', '**/healthz.e2e.ts'],
			dependencies: ['setup']
		}
	],
	webServer: {
		command: 'pnpm build && node --import ./src/mocks/preload.ts server.js',
		port: E2E_APP_PORT,
		stdout: 'pipe',
		env: {
			PORT: String(E2E_APP_PORT),
			HUE_DATA_DIR: join(tmpdir(), 'huedash-e2e-data'),
			HUE_DISCOVERY_URL: E2E_DISCOVERY_URL
		}
	}
});
