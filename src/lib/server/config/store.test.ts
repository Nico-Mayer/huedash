import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigWriteError, createConfigStore, type StoredConfig } from './store.ts';

const config: StoredConfig = {
	version: 1,
	bridge: {
		address: '192.168.1.20',
		id: '001788fffe123456',
		name: 'Living room bridge',
		appKey: 'app-key',
		clientKey: 'client-key',
		certSha256: 'A'.repeat(64)
	},
	pairedAt: '2026-10-29T12:00:00.000Z'
};

let dir: string;
const log = { warn: vi.fn() };

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'huedash-config-'));
	log.warn.mockClear();
});

afterEach(() => rm(dir, { recursive: true, force: true }));

describe('createConfigStore', () => {
	it('returns null when nothing is stored', async () => {
		expect(await createConfigStore(dir, log).read()).toBeNull();
		expect(log.warn).not.toHaveBeenCalled();
	});

	it('round-trips a configuration across store instances', async () => {
		await createConfigStore(dir, log).write(config);

		expect(await createConfigStore(dir, log).read()).toEqual(config);
	});

	it('leaves no temp file behind', async () => {
		await createConfigStore(dir, log).write(config);

		expect(await readdir(dir)).toEqual(['config.json']);
	});

	it.skipIf(process.platform === 'win32')('makes the file readable by its owner only', async () => {
		await createConfigStore(dir, log).write(config);

		expect((await stat(join(dir, 'config.json'))).mode & 0o777).toBe(0o600);
	});

	it('treats invalid JSON as not configured and logs it', async () => {
		await writeFile(join(dir, 'config.json'), '{not json');

		expect(await createConfigStore(dir, log).read()).toBeNull();
		expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('not valid JSON'));
	});

	it('treats a wrong format as not configured and logs it', async () => {
		await writeFile(join(dir, 'config.json'), JSON.stringify({ version: 2 }));

		expect(await createConfigStore(dir, log).read()).toBeNull();
		expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('invalid format'));
	});

	it('names the data directory when it cannot write', async () => {
		const blocked = join(dir, 'not-a-directory');
		await writeFile(blocked, '');

		const error = await createConfigStore(blocked, log)
			.write(config)
			.catch((e) => e);

		expect(error).toBeInstanceOf(ConfigWriteError);
		expect(error.message).toContain(blocked);
	});

	it('forgets the configuration on remove', async () => {
		const store = createConfigStore(dir, log);
		await store.write(config);

		await store.remove();

		expect(await store.read()).toBeNull();
		expect(await createConfigStore(dir, log).read()).toBeNull();
	});
});
