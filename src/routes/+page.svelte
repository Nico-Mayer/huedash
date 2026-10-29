<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
</script>

<main class="flex min-h-svh items-center justify-center p-6">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>huedash</Card.Title>
			<Card.Description>Your Philips Hue dashboard.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground">Bridge setup is coming soon.</p>
		</Card.Content>
		<Card.Footer>
			<Button disabled>Pair bridge</Button>
		</Card.Footer>
	</Card.Root>
</main>
