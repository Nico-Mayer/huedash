import { expect, test, type Page } from '@playwright/test';
import { holdEvents, publish } from '../mocks/e2e-bridge.ts';

// Uses the Living room, so it does not race with rooms.e2e.ts, which changes the Kitchen.
test.describe.configure({ mode: 'serial' });

function livingRoom(page: Page) {
	return page
		.locator('[data-sidebar="menu-item"]')
		.filter({ has: page.getByRole('switch', { name: 'Living room' }) });
}

async function setLivingRoom(page: Page, on: boolean) {
	const card = livingRoom(page);
	const isOn = (await card.getByRole('switch').getAttribute('aria-checked')) === 'true';
	if (isOn === on) return;
	const sent = page.waitForResponse((r) => r.url().endsWith('/api/groups/grouped-living'));
	await card.getByRole('switch').click();
	expect((await sent).status()).toBe(200);
}

// Updates sent before a page's live connection opens never reach it.
async function openLive(page: Page) {
	await page.goto('/');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
}

test('a change in one page shows in another page without reload', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await openLive(first);
	await openLive(second);
	await setLivingRoom(first, true);
	await expect(livingRoom(second).getByText(/^\d+ of \d+ on$/)).toBeVisible();

	let reloaded = false;
	second.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(first, false);

	await expect(livingRoom(second).getByText('All off')).toBeVisible();
	expect(reloaded).toBe(false);
});

test('a group command does not reload page data', async ({ page }) => {
	await openLive(page);
	let reloaded = false;
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) reloaded = true;
	});

	await setLivingRoom(page, true);

	await expect(livingRoom(page).getByText(/^\d+ of \d+ on$/)).toBeVisible();
	await page.waitForTimeout(1500);
	expect(reloaded).toBe(false);
});

function trackDataRequests(page: Page) {
	const urls: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('__data.json')) urls.push(request.url());
	});
	return urls;
}

test('renames and reachability changes show without reloading data', async ({ page }) => {
	await page.goto('/rooms/room-living');
	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
	const requests = trackDataRequests(page);
	const lamp = page.getByRole('list', { name: 'Lights' }).getByRole('listitem').filter({
		hasText: 'Lamp'
	});

	try {
		await publish([{ id: 'room-living', type: 'room', metadata: { name: 'Lounge' } }]);
		await publish([{ id: 'zigbee-lamp', type: 'zigbee_connectivity', status: 'disconnected' }]);

		await expect(page.getByRole('heading', { name: 'Lounge' })).toBeVisible();
		await expect(
			page.getByRole('group', { name: 'Rooms' }).getByRole('switch', { name: 'Lounge' })
		).toBeVisible();
		await expect(lamp).toContainText('Unreachable');
	} finally {
		await publish([{ id: 'room-living', type: 'room', metadata: { name: 'Living room' } }]);
		await publish([{ id: 'zigbee-lamp', type: 'zigbee_connectivity', status: 'connected' }]);
	}

	await expect(page.getByRole('heading', { name: 'Living room' })).toBeVisible();
	await expect(lamp).not.toContainText('Unreachable');
	expect(requests).toEqual([]);
});

test('a command shows in another page before the bridge reports it', async ({ context }) => {
	const first = await context.newPage();
	const second = await context.newPage();
	await openLive(first);
	await openLive(second);
	await setLivingRoom(first, false);

	await holdEvents(true);
	try {
		await setLivingRoom(first, true);

		await expect(livingRoom(second).getByText(/^\d+ of \d+ on$/)).toBeVisible();
	} finally {
		await holdEvents(false);
	}
});

test('a change while the browser was offline shows after it reconnects', async ({ page }) => {
	let blocked = true;
	let first = true;
	await page.route('**/api/events', async (route) => {
		if (first) {
			first = false;
			const open = { kind: 'status', bridge: 'open' };
			return route.fulfill({
				contentType: 'text/event-stream',
				body: `retry: 200\ndata: ${JSON.stringify(open)}\n\n`
			});
		}
		return blocked ? route.abort() : route.continue();
	});
	await page.goto('/');
	const requests = trackDataRequests(page);
	await expect(page.getByText(/Live updates paused/)).toBeVisible();
	const switchedOn =
		(await livingRoom(page).getByRole('switch').getAttribute('aria-checked')) === 'true';

	const response = await page.request.put('/api/groups/grouped-living', {
		data: { on: !switchedOn }
	});
	expect(response.status()).toBe(200);
	blocked = false;

	await expect(page.locator('[data-live]')).toHaveAttribute('data-live', 'open');
	await expect(livingRoom(page).getByRole('switch')).toHaveAttribute(
		'aria-checked',
		String(!switchedOn)
	);
	expect(requests).toEqual([]);
});
