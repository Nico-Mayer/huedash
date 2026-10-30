<script lang="ts">
	import type { HueSaturation } from '#lib/live-updates.ts';

	let {
		hue,
		saturation,
		label,
		onValueChange,
		onValueCommit
	}: HueSaturation & {
		label: string;
		onValueChange: (color: HueSaturation) => void;
		onValueCommit: (color: HueSaturation) => void;
	} = $props();

	let dragging = $state(false);

	// Full value, like the server's hue and saturation to xy conversion.
	const SPECTRUM =
		'linear-gradient(to top, white, transparent), linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)';

	// Keeps the marker inside the pad at the edges; matches the marker's radius.
	const INSET = 14;

	const clamp = (value: number, max: number) => Math.round(Math.min(max, Math.max(0, value)));

	function colorAt(event: PointerEvent & { currentTarget: HTMLElement }): HueSaturation {
		const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - left - INSET) / (width - 2 * INSET);
		const y = (event.clientY - top - INSET) / (height - 2 * INSET);
		return { hue: clamp(x * 360, 360), saturation: clamp((1 - y) * 100, 100) };
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (event.button !== 0) return;
		event.currentTarget.focus();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragging = true;
		onValueChange(colorAt(event));
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (dragging) onValueChange(colorAt(event));
	}

	function onpointerup(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!dragging) return;
		dragging = false;
		onValueCommit(colorAt(event));
	}

	const keySteps: Record<string, [number, number]> = {
		ArrowLeft: [-1, 0],
		ArrowRight: [1, 0],
		ArrowUp: [0, 1],
		ArrowDown: [0, -1]
	};

	function onkeydown(event: KeyboardEvent) {
		const step = keySteps[event.key];
		if (!step) return;
		event.preventDefault();
		const size = event.shiftKey ? 10 : 1;
		onValueCommit({
			hue: clamp(hue + step[0] * size, 360),
			saturation: clamp(saturation + step[1] * size, 100)
		});
	}
</script>

<div
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={360}
	aria-valuenow={hue}
	aria-valuetext="hue {hue}, {saturation} % saturation"
	class={[
		'relative h-[clamp(15rem,40svh,18rem)] w-full touch-none rounded-3xl inset-ring-1 ring-ring/50 inset-ring-foreground/10 outline-hidden select-none focus-visible:ring-[3px]',
		dragging ? 'cursor-grabbing' : 'cursor-pointer'
	]}
	style:background-image={SPECTRUM}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={() => (dragging = false)}
	{onkeydown}
>
	<span class="pointer-events-none absolute inset-3.5">
		<span
			data-color-marker
			class="pointer-events-none absolute size-7 -translate-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_2px_6px_rgb(0_0_0/0.35)]"
			style:left="{(hue / 360) * 100}%"
			style:top="{100 - saturation}%"
			style:background-color="hsl({hue} 100% {100 - saturation / 2}%)"
		></span>
	</span>
</div>
