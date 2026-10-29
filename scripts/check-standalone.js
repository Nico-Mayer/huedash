// Starts the production build the way the Docker image does (only build/, server.js and
// package.json, no node_modules) and checks that it serves requests.
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = 4185;
const base = `http://127.0.0.1:${port}`;
const dir = await mkdtemp(join(tmpdir(), 'huedash-standalone-'));

for (const entry of ['build', 'server.js', 'package.json']) {
	await cp(entry, join(dir, entry), { recursive: true });
}

const server = spawn(process.execPath, ['server.js'], {
	cwd: dir,
	env: { ...process.env, PORT: String(port), HUE_BRIDGE_IP: '192.0.2.10', HUE_APP_KEY: 'check' },
	stdio: ['ignore', 'inherit', 'inherit']
});

async function waitForHealth() {
	let last = 'no answer';
	for (let attempt = 0; attempt < 40; attempt++) {
		try {
			const response = await fetch(`${base}/healthz`);
			if (response.ok) return;
			last = `status ${response.status}`;
		} catch (error) {
			last = error.cause?.message ?? error.message;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`server did not answer /healthz within 10 s (${last})`);
}

async function checkEvents() {
	const controller = new AbortController();
	const response = await fetch(`${base}/api/events`, { signal: controller.signal });
	const type = response.headers.get('content-type');
	controller.abort();
	if (response.status !== 200 || type !== 'text/event-stream') {
		throw new Error(`/api/events answered ${response.status} ${type}`);
	}
}

let failed = false;
try {
	await waitForHealth();
	await checkEvents();
	console.log('standalone build OK: /healthz and /api/events answer without node_modules');
} catch (error) {
	console.error(`standalone build FAILED: ${error.message}`);
	failed = true;
} finally {
	const exited = new Promise((resolve) => server.once('exit', resolve));
	server.kill();
	await exited;
	await rm(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
