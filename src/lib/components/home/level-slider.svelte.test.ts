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
		track: part('track')!,
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

	it('shows the value label only while focused with the keyboard', async () => {
		const { slider, label } = await renderSlider();
		const opacity = () => getComputedStyle(label()!).opacity;
		await expect.poll(opacity).toBe('0');

		(slider.element() as HTMLElement).focus();
		await expect.poll(opacity).toBe('1');

		(slider.element() as HTMLElement).blur();
		await expect.poll(opacity).toBe('0');
	});

	it('fills a vertical slider from the bottom, without a value label', async () => {
		const { slider, track, fill, label } = await renderSlider({
			value: 70,
			orientation: 'vertical'
		});
		const thumb = (slider.element() as HTMLElement).offsetHeight;

		expect(track.offsetHeight).toBeGreaterThanOrEqual(240);
		expect(track.offsetWidth).toBeGreaterThanOrEqual(80);
		expect((fill!.offsetHeight - thumb) / (track.offsetHeight - thumb)).toBeCloseTo(0.7, 2);
		expect(fill!.getBoundingClientRect().bottom).toBe(track.getBoundingClientRect().bottom);

		(slider.element() as HTMLElement).focus();
		expect(label()).toBeNull();
	});

	it('fills with the light color over a faded track', async () => {
		const { track, fill } = await renderSlider();

		expect(getComputedStyle(fill!).backgroundColor).toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(track).backgroundColor).toMatch(/^(oklab|color|rgba)\(.*0\.2\)$/);
	});

	it('mutes the fill without a color', async () => {
		const { fill } = await renderSlider({ tone: { kind: 'light', color: null } });

		expect(getComputedStyle(fill!).backgroundColor).not.toBe('rgb(255, 0, 0)');
		expect(getComputedStyle(fill!).backgroundColor).toMatch(/^(oklab|oklch|color|rgba)\(/);
	});

	it('shows the white range as a gradient instead of a fill', async () => {
		const { track, fill } = await renderSlider({
			tone: { kind: 'white', stops: ['#ff8b14', '#ffffff'] }
		});

		expect(getComputedStyle(track).backgroundImage).toBe(
			'linear-gradient(to right, rgb(255, 139, 20), rgb(255, 255, 255))'
		);
		expect(fill).toBeNull();
	});
});
