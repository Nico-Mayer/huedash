import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import { E2E_APP_PORT, E2E_DISCOVERY_URL } from './src/mocks/e2e.ts';

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: `http://localhost:${E2E_APP_PORT}` },
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
