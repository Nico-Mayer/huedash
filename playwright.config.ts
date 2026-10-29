import { defineConfig } from '@playwright/test';
import { MOCK_BRIDGE_IP } from './src/mocks/bridge/handlers.ts';

const port = 4173;

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL: `http://localhost:${port}` },
	webServer: {
		command: 'pnpm build && node --import ./src/mocks/preload.ts build',
		port,
		stdout: 'pipe',
		env: { PORT: String(port), HUE_BRIDGE_IP: MOCK_BRIDGE_IP }
	}
});
