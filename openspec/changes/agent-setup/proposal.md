# Proposal

## Why

huedash is starting from an empty folder. Before any code exists, agents and humans need shared rules for stack, library choice, and workflow, so every later change (project-setup, testing-setup, ci-docker, then features) follows the same constraints without repeating them.

## What Changes

- Initialize the folder as a git repository and create the GitHub repository with the `gh` CLI.
- Fill `openspec/config.yaml` with project `context` and per-artifact `rules`:
  - Self-hosted app: Docker image plus docker compose, running on the user's LAN.
  - SvelteKit (Svelte 5) for UI and server code.
  - UI built with shadcn-svelte; custom components build on bits-ui primitives when one fits.
  - Hue API v2 (CLIP v2) only, called from the SvelteKit server, never directly from the browser.
  - Typed Hue client generated from the openhue-api OpenAPI spec instead of a handwritten client.
  - Config: env vars override; otherwise a setup wizard stores bridge settings in a `/data` volume. Per-device UI preferences live in localStorage.
  - No authentication for now.
  - CI on GitHub Actions, images published to GHCR.
  - Rule: before handrolling code, search for a well-maintained library (recent releases, active repo) and record the choice and the reason in design.md.
- Add agent workflow guidelines (`CLAUDE.md` / `AGENTS.md`) covering the OpenSpec flow, the planned change order, and the library-first rule.
- Set up agent skills for the tech stack:
  - Reuse skills already installed globally where they fit (for example the Svelte plugin skills, `interface-design`, `ux-writing`, `playwright-cli`, `find-docs`) and reference them in the guidelines instead of installing duplicates.
  - Search the skills.sh directory for maintained skills covering the remaining gaps (for example SvelteKit, shadcn-svelte, bits-ui, Tailwind, Docker, GitHub Actions) and install them per project with the `npx skills` CLI.
  - Review the existing `.claude` OpenSpec skills and commands and keep them.
- Define UI standards for agents and humans:
  - UI copy and wording guidelines (voice, tone, labels, error and empty states), based on the `ux-writing` skill.
  - Interface standards (layout, tokens, states, component use), based on the `interface-design` skill and shadcn-svelte defaults.
- Pin tool versions in `mise.toml`.

## Capabilities

### New Capabilities

None. This change only adds tooling, configuration, and documentation. It does not add runtime behavior.

### Modified Capabilities

None.

## Impact

- New files: `.gitignore`, `CLAUDE.md` and/or `AGENTS.md`, UI copy and interface standards docs, installed project skills.
- Modified files: `openspec/config.yaml`, `mise.toml`, `.claude/`.
- New tool dependency: the `npx skills` CLI (vercel-labs/skills), used at setup time only.
- New GitHub repository created via `gh`.
- No application code or dependencies yet. The planned follow-up changes, in order: project-setup, testing-setup, ci-docker, bridge-pairing, room-control, scenes, live-updates.
