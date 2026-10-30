# Design

## Context

- `(app)/+layout.server.ts` loads the whole home from the bridge with 7 parallel requests (`loadHome`).
- `rooms/[id]/+page.server.ts` and `zones/[id]/+page.server.ts` call `parent()` and pick one group with `findGroup`. On a client navigation, SvelteKit skips the layout node in the response, but a server load that calls `parent()` still runs the parent load on the server (`@sveltejs/kit/src/runtime/server/data/index.js`). So every switch and every hover preload runs `loadHome`.
- Live state comes from `src/lib/live.svelte.ts`. Its overrides are keyed by light, group, and scene id, so they apply to any page. `reload` events and the visibility refresh call `refreshAll()`, which reloads the layout.
- `GroupDetail.svelte` already imports the `GroupPageData` type from `#lib/server/group-page.ts`.

## Goals / Non-Goals

**Goals:**

- A page switch inside the shell needs no network.
- One calm cross-fade on the page column, with the sidebar still.

**Non-Goals:**

- Faster first load or `refreshAll()`. A server-side home cache can come later.
- Direction-aware or per-element transitions.

## Decisions

### Universal page load picks the group

Replace both `+page.server.ts` files with `+page.ts` that calls `findGroup(await parent(), kind, params.id)`. In the browser, `parent()` returns the cached layout data, and without a server load on the page SvelteKit sends no `__data.json` request. During SSR the same load runs on the server with the layout server data.

Move `src/lib/server/group-page.ts` (and its test) to `src/lib/group-page.ts`. It has no runtime server imports; its imports from `server/hue` are types only and are erased.

Alternatives:

- Keep the server load and cache `loadHome` on the server. Still a server round trip per switch, and adds cache invalidation.
- Read the group in `+page.svelte` from `page.data`. Moves lookup logic into components and loses the typed page data.

### View Transitions API through `onNavigate`

In `(app)/+layout.svelte`, `onNavigate` starts `document.startViewTransition` and resolves when the navigation completes. This is the pattern in the SvelteKit docs. Skip it when `startViewTransition` is missing or `prefers-reduced-motion: reduce` matches.

`Sidebar.Inset` gets `view-transition-name: page`. In `layout.css`, the root group gets no animation, so the sidebar stays still, and the `page` group cross-fades in 200 ms (default `ease`). The mobile top bar is inside the inset, so its title fades with the page.

No library: the API is built into all current browsers, and SvelteKit has `onNavigate` for it.

Alternatives:

- `svelte/transition` `fade` inside `{#key page.url.pathname}`. Both pages are in the DOM during the fade, so the column jumps in height and scroll position. Needs layout workarounds.
- `tw-animate-css` enter classes (already installed). Fades the new page in only; the old page disappears at once, which is the harsh part we want to remove.

## Risks / Trade-offs

- [Layout data gets stale between reloads, for example a new room added in the Hue app] → Same as today: the sidebar already uses this data. Bridge `reload` events and the visibility refresh reload it.
- [During a view transition, the page does not take pointer input for up to 200 ms; e2e clicks right after a navigation may need to wait] → Playwright retries actions until they succeed. If tests get flaky, set `reducedMotion: 'reduce'` in the Playwright config and test the transition in one dedicated test.
- [A slow `refreshAll()` while a transition runs] → `refreshAll()` is not a navigation, so `onNavigate` does not run for it.
