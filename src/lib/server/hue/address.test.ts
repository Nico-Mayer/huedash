import { describe, expect, it } from 'vitest';
import { parseBridgeAddress } from './address.ts';

describe('parseBridgeAddress', () => {
	it('accepts an IPv4 address on the default port', () => {
		expect(parseBridgeAddress('192.168.1.20')).toEqual({
			host: '192.168.1.20',
			port: 443,
			origin: 'https://192.168.1.20'
		});
	});

	it('accepts a hostname and trims whitespace', () => {
		expect(parseBridgeAddress('  Hue-Bridge.local ')?.origin).toBe('https://hue-bridge.local');
	});

	it('accepts an explicit port', () => {
		expect(parseBridgeAddress('192.168.1.20:8443')).toEqual({
			host: '192.168.1.20',
			port: 8443,
			origin: 'https://192.168.1.20:8443'
		});
	});

	it.each([
		'',
		'not an ip!',
		'192.168.1.256',
		'1.2.3',
		'host:0',
		'host:70000',
		'http://1.2.3.4',
		'a/b'
	])('rejects %j', (input) => {
		expect(parseBridgeAddress(input)).toBeNull();
	});
});
