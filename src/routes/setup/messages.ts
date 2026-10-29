import type { DiscoveryResult } from '#lib/server/hue/discovery.ts';
import type { CheckResult, PairResult } from '#lib/server/setup.ts';

export type CheckError = Extract<CheckResult, { ok: false }>['error'];

export function checkErrorMessage(error: CheckError, address: string): string {
	switch (error) {
		case 'invalid-address':
			return 'Enter an IP address like 192.168.1.20, or a hostname.';
		case 'unreachable':
			return `Couldn't reach ${address}. Check the address and that the bridge is on.`;
		case 'not-a-bridge':
			return `The device at ${address} isn't a Hue bridge. Check the address.`;
	}
}

export function discoveryMessage(result: DiscoveryResult): string | null {
	if (result.status === 'found') {
		return result.bridges.length ? null : 'No bridge found on your network. Enter its IP address.';
	}
	return result.reason === 'rate-limited'
		? 'Too many searches right now. Wait a few minutes, or enter the IP address.'
		: "Couldn't search for bridges. Enter the IP address instead.";
}

export function pairErrorMessage(result: PairResult): string {
	switch (result.status) {
		case 'expired':
			return 'Setup took too long. Use a different address to start again.';
		case 'not-saved':
			return `Paired, but couldn't save the settings. Make sure ${result.dataDir} is writable by the container user (UID 1000).`;
		case 'failed':
			if (result.reason === 'certificate-mismatch') {
				return "The bridge's certificate changed during setup. Start again.";
			}
			if (result.reason === 'pairing-failed')
				return 'The bridge refused the connection. Try again.';
			return 'Lost contact with the bridge. Check that it is on, then try again.';
		default:
			return 'Something unexpected happened. Try again.';
	}
}

export function formatFingerprint(sha256: string): string {
	return `${sha256.slice(0, 16).match(/../g)?.join(':')}…`;
}
