# Tasks

## 1. Tools and changelog config

- [x] 1.1 Pin `git-cliff` and `gh` in `mise.toml` (check the names with `mise registry`) and verify `mise install` then `git cliff --version` and `gh --version` work
- [x] 1.2 Add `cliff.toml` with tag pattern, commit groups, skipped types, and 0.x `[bump]` rules from design.md, and verify `git cliff --bumped-version` prints `0.1.0` and `git cliff --unreleased --tag v0.1.0` lists `feat` and `fix` commits but no `chore`, `test`, or merge commits
- [x] 1.3 Add `semver` as a dev dependency and verify `pnpm install` succeeds

## 2. Release task

- [x] 2.1 Write `scripts/release.js` with the checks (clean tree, `main`, in sync with `origin/main`, CI passed for `HEAD` through `gh`) and verify each failure on a scratch clone prints its message and changes nothing
- [x] 2.2 Add version selection (computed or argument), validation (semver, greater than last tag, commits since last tag), and the dry run, and verify `--dry-run`, `--dry-run 1.0.0`, and `--dry-run 0.0.1` behave as the spec scenarios say
- [x] 2.3 Add the confirmation, changelog and `package.json` update, Prettier formatting, release commit, annotated tag, and `git push --atomic`, and verify on a scratch clone with a local bare remote that declining changes nothing and confirming pushes commit and tag together
- [x] 2.4 Add the `release` task to `mise.toml` that forwards the version and `--dry-run`, and verify `mise run release --dry-run` works in PowerShell
- [x] 2.5 Document releasing in `README.md` and add `mise run release` to the commands table in `AGENTS.md`, and verify `pnpm lint` passes

## 3. Workflows

- [x] 3.1 Change `image.yml` to run only on `v*` tags, always push both platforms, and keep only the semver tag rules, and verify with `actionlint` or a YAML check
- [ ] 3.2 Add a `docker` job to `ci.yml` that builds `linux/amd64` without pushing, using the GitHub Actions cache, and verify it passes on the next push to `main` (`gh run list --workflow ci.yml`)
- [x] 3.3 Update the image tags table in `README.md` (remove `edge` and `sha-*`) and the "CI and image" section in `AGENTS.md`, and verify `pnpm lint` passes

## 4. App version

- [x] 4.1 Set the SvelteKit `version.name` from `package.json` in `vite.config.ts` and verify `pnpm build` succeeds and `/api/events` sends `hello` with the `package.json` version; `pnpm test:unit --run` passes

## 5. First release

- [ ] 5.1 After CI passes on `main`, run `mise run release --dry-run` and verify it shows `0.1.0` with a sensible changelog
- [ ] 5.2 Run `mise run release` and verify the image workflow publishes `0.1.0`, `0.1`, and `latest` for both platforms (`gh run list --workflow image.yml`)

## Workflow follow-up

- Archive the change after review.
