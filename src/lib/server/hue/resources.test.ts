import { describe, expect, it, vi } from 'vitest';
import { home } from '../../../mocks/bridge/home.ts';
import { isResourceType, parseResource, parseResources } from './resources.ts';

const logger = () => ({ warn: vi.fn() });

describe('parseResources', () => {
	it('keeps the fields huedash reads from a valid list', () => {
		const lights = parseResources('light', home.lights, logger());

		expect(lights.map((l) => l.id)).toEqual(['ceiling', 'counter', 'lamp', 'plug']);
		expect(lights[0]).toEqual({
			id: 'ceiling',
			owner: { rid: 'device-ceiling', rtype: 'device' },
			metadata: { name: 'Ceiling' },
			on: { on: true },
			dimming: { brightness: 70 },
			color_temperature: {
				mirek: 366,
				mirek_valid: true,
				mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 }
			},
			color: { xy: { x: 0.4573, y: 0.41 } }
		});
	});

	it('skips a light without a name, keeps the others, and logs the id once', () => {
		const log = logger();
		const broken = { ...home.lights[1], id: 'nameless', metadata: {} };

		const lights = parseResources('light', [home.lights[0], broken], log);
		parseResources('light', [broken], log);

		expect(lights.map((l) => l.id)).toEqual(['ceiling']);
		expect(log.warn).toHaveBeenCalledOnce();
		expect(log.warn.mock.calls[0][0]).toContain('light nameless');
	});

	it('accepts the null mirek the bridge sends for a light that shows a color', () => {
		const lamp = home.lights.find((l) => l.id === 'lamp');

		expect(parseResource('light', lamp, logger())?.color_temperature?.mirek).toBeNull();
	});
});

describe('isResourceType', () => {
	it('knows the resources the home is built from', () => {
		expect(isResourceType('light')).toBe(true);
		expect(isResourceType('zigbee_connectivity')).toBe(true);
		expect(isResourceType('button')).toBe(false);
	});
});
