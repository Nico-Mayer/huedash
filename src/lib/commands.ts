import { toast } from 'svelte-sonner';

type Target = { kind: 'groups' | 'lights' | 'scenes'; id: string; name: string };

// Resolves to the revision of the home that contains the change, or null when it failed.
export async function sendCommand({ kind, id }: Target, body: object): Promise<number | null> {
	try {
		const response = await fetch(`/api/${kind}/${id}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) return null;
		const { revision } = (await response.json()) as { revision: number };
		return revision;
	} catch {
		return null;
	}
}

// The caller shows the change at once; settle ends that once the home contains it, or on failure.
export async function applyChange(
	target: Target,
	body: object,
	settle: (revision: number | null) => void
) {
	const revision = await sendCommand(target, body);
	settle(revision);
	if (revision === null) {
		toast.error(`Couldn't change ${target.name}. Check that the bridge is on, then try again.`);
	}
}
