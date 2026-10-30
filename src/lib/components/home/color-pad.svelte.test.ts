import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../../routes/layout.css';
import ColorPad from './ColorPad.svelte';

async function renderPad(hue = 30, saturation = 70) {
	const onValueChange = vi.fn();
	const onValueCommit = vi.fn();
	await render(ColorPad, { hue, saturation, label: 'Lamp color', onValueChange, onValueCommit });
	return { pad: page.getByRole('slider', { name: 'Lamp color' }), onValueChange, onValueCommit };
}

describe('ColorPad', () => {
	it('commits the color under a click', async () => {
		const { pad, onValueCommit } = await renderPad();
		const { height } = pad.element().getBoundingClientRect();

		await pad.click({ position: { x: 0, y: height / 2 } });

		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith({ hue: 0, saturation: 50 });
	});

	it('follows a drag and commits once on release', async () => {
		const { pad, onValueChange, onValueCommit } = await renderPad();
		const { left, top, width, height } = pad.element().getBoundingClientRect();
		const at = (x: number, y: number) => ({
			clientX: left + x * width,
			clientY: top + y * height,
			pointerId: 1,
			bubbles: true,
			button: 0
		});
		const element = pad.element();

		element.dispatchEvent(new PointerEvent('pointerdown', at(0.25, 0.5)));
		element.dispatchEvent(new PointerEvent('pointermove', at(0.5, 0.5)));
		expect(onValueCommit).not.toHaveBeenCalled();
		element.dispatchEvent(new PointerEvent('pointerup', at(0.5, 0)));

		expect(onValueChange).toHaveBeenLastCalledWith({ hue: 180, saturation: 50 });
		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith({ hue: 180, saturation: 100 });
	});

	it('places the marker at the color', async () => {
		await renderPad(180, 25);
		const marker = document.querySelector<HTMLElement>('[data-color-marker]')!;

		expect(marker.style.left).toBe('50%');
		expect(marker.style.top).toBe('75%');
	});

	it.each([
		['ArrowRight', { hue: 31, saturation: 70 }],
		['ArrowLeft', { hue: 29, saturation: 70 }],
		['ArrowUp', { hue: 30, saturation: 71 }],
		['ArrowDown', { hue: 30, saturation: 69 }],
		['Shift+ArrowRight', { hue: 40, saturation: 70 }]
	])('commits a step for %s', async (key, color) => {
		const { pad, onValueCommit } = await renderPad();
		(pad.element() as HTMLElement).focus();

		const [modifier, arrow] = key.includes('+') ? key.split('+') : [null, key];
		await userEvent.keyboard(modifier ? `{${modifier}>}{${arrow}}{/${modifier}}` : `{${arrow}}`);

		expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(color);
	});

	it('stays within range at the edges', async () => {
		const { pad, onValueCommit } = await renderPad(360, 100);
		(pad.element() as HTMLElement).focus();

		await userEvent.keyboard('{ArrowRight}{ArrowUp}');

		expect(onValueCommit).toHaveBeenLastCalledWith({ hue: 360, saturation: 100 });
	});

	it('announces hue and saturation', async () => {
		const { pad } = await renderPad();

		await expect.element(pad).toHaveAttribute('aria-valuenow', '30');
		await expect.element(pad).toHaveAttribute('aria-valuetext', 'hue 30, 70 % saturation');
	});
});
