import { X509Certificate } from 'node:crypto';
import { generate } from 'selfsigned';

export type BridgeCertificate = { key: string; cert: string; sha256: string };

export async function createBridgeCertificate(
	bridgeId = '001788fffe123456'
): Promise<BridgeCertificate> {
	const pems = await generate([{ name: 'commonName', value: bridgeId }], { algorithm: 'sha256' });
	const sha256 = new X509Certificate(pems.cert).fingerprint256.replaceAll(':', '');
	return { key: pems.private, cert: pems.cert, sha256 };
}
