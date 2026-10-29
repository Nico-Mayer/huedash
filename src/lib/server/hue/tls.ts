import type { TLSSocket } from 'node:tls';
import { Agent, buildConnector, type Dispatcher } from 'undici';

export type BridgeFetch = typeof fetch;

// Node's fetch accepts an undici dispatcher, but the DOM RequestInit type does not declare it.
export function fetchWith(dispatcher: Dispatcher): BridgeFetch {
	return (input, init) => fetch(input, { ...init, dispatcher } as RequestInit);
}

export class CertificateMismatchError extends Error {
	constructor(
		readonly expected: string,
		readonly actual: string
	) {
		super(`Bridge certificate ${actual || '(none)'} does not match pinned ${expected}`);
		this.name = 'CertificateMismatchError';
	}
}

export type CertificatePin =
	{ mode: 'pinned'; sha256: string } | { mode: 'capture'; onCapture: (sha256: string) => void };

export function normalizeFingerprint(fingerprint: string): string {
	return fingerprint.replaceAll(':', '').toUpperCase();
}

export function isCertificateMismatch(error: unknown): error is CertificateMismatchError {
	for (let current = error; current instanceof Error; current = current.cause) {
		if (current instanceof CertificateMismatchError) return true;
	}
	return false;
}

export function createBridgeAgent(pin: CertificatePin): Agent {
	// Bridge certificates are not issued by a public CA, so trust comes from the pinned fingerprint.
	// Resumed TLS sessions can report no peer certificate, so session caching is off.
	const connect = buildConnector({ rejectUnauthorized: false, maxCachedSessions: 0 });

	return new Agent({
		connect(options, callback) {
			connect(options, (error, socket) => {
				if (error) return callback(error, null);

				const certificate = (socket as TLSSocket).getPeerCertificate?.();
				const actual = certificate?.fingerprint256
					? normalizeFingerprint(certificate.fingerprint256)
					: '';

				if (pin.mode === 'capture') {
					pin.onCapture(actual);
					return callback(null, socket);
				}

				const expected = normalizeFingerprint(pin.sha256);
				if (actual !== expected) {
					socket.destroy();
					return callback(new CertificateMismatchError(expected, actual), null);
				}
				callback(null, socket);
			});
		}
	});
}
