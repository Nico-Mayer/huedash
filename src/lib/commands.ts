import { toast } from 'svelte-sonner';

type Target = { kind: 'groups' | 'lights'; id: string; name: string };

export async function sendCommand({ kind, id }: Target, body: object): Promise<boolean> {
	try {
		const response = await fetch(`/api/${kind}/${id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		return response.status === 204;
	} catch {
		return false;
	}
}

// Shows the change at once; the bridge's live update confirms it. On failure it restores the
// previous state and tells the user.
export async function applyChange(target: Target, body: object, revert: () => void) {
	if (await sendCommand(target, body)) return;
	revert();
	toast.error(`Couldn't change ${target.name}. Check that the bridge is on, then try again.`);
}
