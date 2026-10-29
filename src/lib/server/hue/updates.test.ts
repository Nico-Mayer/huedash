import { describe, expect, it } from 'vitest';
import { toUpdates } from './updates.ts';

const event = (type: string, data: object[]) => ({ type, id: 'e', creationtime: '', data });

describe('toUpdates', () => {
	it('turns light state into a light update with rounded brightness', () => {
		const message = [
			event('update', [
				{ id: 'ceiling', type: 'light', on: { on: true }, dimming: { brightness: 66.8 } }
			])
		];

		expect(toUpdates(message)).toEqual([
			{ kind: 'light', id: 'ceiling', on: true, brightness: 67 }
		]);
	});

	it('reports a valid color temperature as white', () => {
		const message = [
			event('update', [
				{
					id: 'ceiling',
					type: 'light',
					color_temperature: { mirek: 250, mirek_valid: true },
					color: { xy: { x: 0.38, y: 0.38 } }
				}
			])
		];

		expect(toUpdates(message)).toEqual([
			{
				kind: 'light',
				id: 'ceiling',
				mirek: 250,
				hueSaturation: null,
				swatch: expect.stringMatching(/^#[0-9a-f]{6}$/)
			}
		]);
	});

	it('reports xy without a valid color temperature as a color', () => {
		const message = [
			event('update', [
				{
					id: 'lamp',
					type: 'light',
					color_temperature: { mirek: null, mirek_valid: false },
					color: { xy: { x: 0.64, y: 0.33 } }
				}
			])
		];

		const [update] = toUpdates(message);
		expect(update).toMatchObject({ kind: 'light', id: 'lamp', mirek: null });
		expect(update).toHaveProperty('hueSaturation.saturation', 100);
		expect(update).toHaveProperty('swatch', '#ff0000');
	});

	it('ignores color fields of groups', () => {
		const message = [
			event('update', [
				{ id: 'grouped-kitchen', type: 'grouped_light', color_temperature: { mirek: 250 } }
			])
		];

		expect(toUpdates(message)).toEqual([]);
	});

	it('turns grouped light state into a group update', () => {
		const message = [
			event('update', [{ id: 'grouped-kitchen', type: 'grouped_light', on: { on: false } }])
		];

		expect(toUpdates(message)).toEqual([{ kind: 'group', id: 'grouped-kitchen', on: false }]);
	});

	it.each([
		['a renamed light', event('update', [{ id: 'l', type: 'light', metadata: { name: 'New' } }])],
		['a new room', event('add', [{ id: 'r', type: 'room' }])],
		['a removed light', event('delete', [{ id: 'l', type: 'light' }])],
		[
			'a connectivity change',
			event('update', [{ id: 'z', type: 'zigbee_connectivity', status: 'connectivity_issue' }])
		],
		['a zone change', event('update', [{ id: 'z', type: 'zone', children: [] }])]
	])('asks for one reload on %s', (_name, message) => {
		expect(toUpdates([message, message])).toEqual([{ kind: 'reload' }]);
	});

	it('drops resource types the pages do not show', () => {
		const message = [
			event('update', [
				{ id: 'b', type: 'button', button: { last_event: 'short_release' } },
				{ id: 'm', type: 'motion', motion: { motion: true } }
			])
		];

		expect(toUpdates(message)).toEqual([]);
	});

	it('drops updates without state, error events and malformed messages', () => {
		expect(
			toUpdates([event('update', [{ id: 'l', type: 'light', effects: { status: 'no_effect' } }])])
		).toEqual([]);
		expect(toUpdates([event('error', [{ id: 'l', type: 'light' }])])).toEqual([]);
		expect(toUpdates({ not: 'an array' })).toEqual([]);
	});

	it('passes on only the state the pages show', () => {
		const message = [
			event('update', [
				{
					id: 'ceiling',
					id_v1: '/lights/1',
					type: 'light',
					owner: { rid: 'device', rtype: 'device' },
					on: { on: true },
					effects: { status: 'no_effect' },
					color_temperature: { mirek: 300, mirek_valid: true, mirek_schema: {} }
				}
			])
		];

		expect(toUpdates(message)).toEqual([
			{
				kind: 'light',
				id: 'ceiling',
				on: true,
				mirek: 300,
				hueSaturation: null,
				swatch: expect.any(String)
			}
		]);
	});
});

describe('toUpdates for scenes', () => {
	it('turns a scene status into a scene update', () => {
		const message = [
			event('update', [{ id: 'scene-relax', type: 'scene', status: { active: 'static' } }])
		];

		expect(toUpdates(message)).toEqual([{ kind: 'scene', id: 'scene-relax', active: 'static' }]);
	});

	it.each([
		['a new scene', event('add', [{ id: 's', type: 'scene' }])],
		['a removed scene', event('delete', [{ id: 's', type: 'scene' }])],
		['a renamed scene', event('update', [{ id: 's', type: 'scene', metadata: { name: 'New' } }])],
		['changed scene actions', event('update', [{ id: 's', type: 'scene', actions: [] }])]
	])('asks for a reload on %s', (_name, message) => {
		expect(toUpdates([message])).toEqual([{ kind: 'reload' }]);
	});
});
