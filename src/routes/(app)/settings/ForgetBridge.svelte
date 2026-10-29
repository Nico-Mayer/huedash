<script lang="ts">
	import { enhance } from '$app/forms';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';

	let { name }: { name: string } = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })}
		>Forget bridge</AlertDialog.Trigger
	>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Forget {name}?</AlertDialog.Title>
			<AlertDialog.Description>
				huedash stops controlling your lights until you pair again. The app key stays on the bridge
				until you remove it in the Hue app.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Keep bridge</AlertDialog.Cancel>
			<form method="POST" action="?/forget" use:enhance>
				<AlertDialog.Action type="submit" class="w-full">Forget bridge</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
