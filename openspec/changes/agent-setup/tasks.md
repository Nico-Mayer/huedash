# Tasks

## 1. Repository and tools

- [x] 1.1 Pin Node.js 24 LTS in `mise.toml` next to the OpenSpec CLI and verify `mise install` succeeds and `node --version` reports 24.x
- [x] 1.2 Run `git init -b main` and add a `.gitignore` (node_modules, build output, `.env`, `/data`, OS and editor files) and verify `git status` lists only intended files

## 2. OpenSpec config

- [x] 2.1 Fill `context` in `openspec/config.yaml` with stack, architecture (self-hosted Docker, Hue API v2 via SvelteKit server, generated client from openhue-api, env vars over `/data` config, localStorage for UI prefs, no auth), and CI target (GitHub Actions, GHCR); verify `openspec context --json` succeeds and `openspec instructions proposal --change agent-setup --json` shows the context
- [x] 2.2 Add `rules` for design (record library choice with maintenance evidence and alternatives) and tasks (prefer maintained dependency, custom UI on bits-ui primitives); verify `openspec instructions design --change agent-setup --json` and `openspec instructions tasks --change agent-setup --json` show the rules

## 3. Project skills

- [x] 3.1 Read `SKILL.md` of `huntabyte/shadcn-svelte@shadcn-svelte` and `github/awesome-copilot@multi-stage-dockerfile`, then install both with `DISABLE_TELEMETRY=1 npx skills@1.7.4 add <owner/repo> --skill <name> -a claude-code`; verify `npx skills list` shows both under the project
- [x] 3.2 Compare `SKILL.md` of `wshobson/agents@github-actions-templates` and `callstackincubator/agent-skills@github-actions`, install the better fit, and verify `npx skills list` shows it
- [x] 3.3 Read `SKILL.md` of `wshobson/agents@tailwind-design-system`; install it only if it matches Tailwind v4 and shadcn-svelte conventions; verify the decision is recorded in AGENTS.md (task 4.1) and `npx skills list` matches it
- [x] 3.4 Verify the existing `.claude` OpenSpec skills and `opsx` commands still load and `skills-lock.json` exists for the installed skills

## 4. Guidelines

- [x] 4.1 Write `AGENTS.md`: OpenSpec flow (explore, propose, apply, archive), planned change order, library-first rule, which global skills to use for which task (Svelte plugin, `interface-design`, `ux-writing`, `playwright-cli`, `find-docs`) and how to get them, and installed project skills; verify every skill named is present in `npx skills list` or the global skill list
- [x] 4.2 Create `CLAUDE.md` containing `@AGENTS.md` and verify a new Claude Code session in the repo loads the AGENTS.md content

## 5. Publish

- [x] 5.1 Make atomic conventional commits for groups 1-4 and verify `git log --oneline` shows one commit per group with no co-author lines
- [ ] 5.2 Create the public GitHub repo with `gh repo create huedash --public --source . --push` and verify `gh repo view` shows the pushed `main` branch

## Workflow follow-up

- Archive the change with `/opsx:archive` after review.
