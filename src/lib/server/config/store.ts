import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

export const storedConfigSchema = z.object({
	version: z.literal(1),
	bridge: z.object({
		address: z.string().min(1),
		id: z.string().min(1),
		name: z.string(),
		appKey: z.string().min(1),
		clientKey: z.string(),
		certSha256: z.string().regex(/^[0-9A-F]{64}$/)
	}),
	pairedAt: z.iso.datetime()
});

export type StoredConfig = z.infer<typeof storedConfigSchema>;

export class ConfigWriteError extends Error {
	constructor(
		readonly dataDir: string,
		options?: ErrorOptions
	) {
		super(
			`Cannot write ${join(dataDir, 'config.json')}. The data directory must be writable.`,
			options
		);
		this.name = 'ConfigWriteError';
	}
}

type Logger = Pick<Console, 'warn'>;

export type ConfigStore = ReturnType<typeof createConfigStore>;

export function createConfigStore(dataDir: string, log: Logger = console) {
	const file = join(dataDir, 'config.json');
	let cached: StoredConfig | null | undefined;

	async function load(): Promise<StoredConfig | null> {
		let text: string;
		try {
			text = await readFile(file, 'utf8');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				log.warn(`Cannot read ${file}, treating the bridge as not configured.`, error);
			}
			return null;
		}

		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch {
			log.warn(`${file} is not valid JSON, treating the bridge as not configured.`);
			return null;
		}

		const parsed = storedConfigSchema.safeParse(json);
		if (!parsed.success) {
			log.warn(`${file} has an invalid format, treating the bridge as not configured.`);
			return null;
		}
		return parsed.data;
	}

	return {
		file,

		async read(): Promise<StoredConfig | null> {
			cached ??= await load();
			return cached;
		},

		async write(config: StoredConfig): Promise<void> {
			const temp = `${file}.${process.pid}.tmp`;
			try {
				await writeFile(temp, JSON.stringify(config, null, 2), { mode: 0o600 });
				await rename(temp, file);
			} catch (error) {
				await rm(temp, { force: true }).catch(() => {});
				throw new ConfigWriteError(dataDir, { cause: error });
			}
			cached = config;
		},

		async remove(): Promise<void> {
			await rm(file, { force: true });
			cached = null;
		}
	};
}
