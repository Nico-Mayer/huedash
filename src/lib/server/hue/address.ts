export type BridgeAddress = {
	host: string;
	port: number;
	origin: string;
};

const HOSTNAME =
	/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function parseBridgeAddress(input: string): BridgeAddress | null {
	const match = /^([^:]+)(?::(\d{1,5}))?$/.exec(input.trim());
	if (!match) return null;

	const [, host, portText] = match;
	const looksNumeric = /^[\d.]+$/.test(host);
	if (looksNumeric ? !IPV4.test(host) : !HOSTNAME.test(host)) return null;

	const port = portText ? Number(portText) : 443;
	if (port < 1 || port > 65535) return null;

	const origin = port === 443 ? `https://${host}` : `https://${host}:${port}`;
	return { host: host.toLowerCase(), port, origin: origin.toLowerCase() };
}
