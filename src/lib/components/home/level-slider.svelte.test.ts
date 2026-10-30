import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../../routes/layout.css';
import LevelSlider, { type SliderTone } from './LevelSlider.svelte';

async function renderSlider({
	value = 40,
	orientation = 'horizontal',
	tone = { kind: 'light', color: '#ff0000' }
}: {
	value?: number;
	orientation?: 'horizontal' | 'vertical';
	tone?: SliderTone;
} = {}) {
	const { container } = await render(LevelSlider, {
		value,
		min: 0,
		max: 100,
		orientation,
		tone,
		format: (value: number) => `${value} %`,
		thumbLabel: 'Kitchen brightness'
	});
	const part = (name: string) => container.querySelector<HTMLElement>(`[data-slider-${name}]`);
	return {
		slider: page.getByRole('slider', { name: 'Kitchen brightness' }),
		fill: part('fill'),
		label: () => page.getByText(`${value} %`).query()
	};
}

describe('LevelSlider', () => {
	it('names the thumb and reports its range and value', async () => {
		const { slider } = await renderSlider();

		await expect.element(slider).toHaveAttribute('aria-valuemin', '0');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '100');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '40 %');
	});

	it('has no value label when vertical', async () => {
		const { slider, label } = await renderSlider({ orientation: 'vertical' });

		(slider.element() as HTMLElement).focus();
		expect(label()).toBeNull();
	});

	it('has no fill in white mode', async () => {
		const { fill } = await renderSlider({
			tone: { kind: 'white', stops: ['#ff8b14', '#ffffff'] }
		});

		expect(fill).toBeNull();
	});
});
