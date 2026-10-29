import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../../routes/layout.css';
import LevelSlider from './LevelSlider.svelte';

function renderSlider() {
	render(LevelSlider, {
		value: 40,
		min: 1,
		max: 100,
		format: (value: number) => `${value} %`,
		thumbLabel: 'Kitchen brightness'
	});
	return {
		slider: page.getByRole('slider', { name: 'Kitchen brightness' }),
		opacity: () => getComputedStyle(page.getByText('40 %').element()).opacity
	};
}

describe('LevelSlider', () => {
	it('names the thumb and reports its range and value', async () => {
		const { slider } = renderSlider();

		await expect.element(slider).toHaveAttribute('aria-valuemin', '1');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '100');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '40 %');
	});

	it('shows the value label only while focused with the keyboard', async () => {
		const { slider, opacity } = renderSlider();
		await expect.poll(opacity).toBe('0');

		(slider.element() as HTMLElement).focus();
		await expect.poll(opacity).toBe('1');

		(slider.element() as HTMLElement).blur();
		await expect.poll(opacity).toBe('0');
	});
});
