# Design

## Context

- `image.yml` runs on pull requests, pushes to `main`, and `v*` tags. It already has semver tag rules in `docker/metadata-action`, but no tag exists yet.
- `ci.yml` runs lint, check, unit, e2e, and `check:standalone` on pull requests and pushes to `main`. Work happens directly on `main`.
- All non-merge commits follow conventional commits. `package.json` has version `0.0.1`, unused.
- `.dockerignore` excludes `.git`, so the image build cannot read git data. `package.json` is in the build context.
- The SvelteKit app version comes from `$app/env` and defaults to a build timestamp. `/api/events` sends it in `hello`, and tabs reload when it differs (live-updates spec).
- The maintainer works on Windows. mise pins Node and pnpm.

## Goals / Non-Goals

**Goals:**

- One command, `mise run release`, that works on Windows, macOS, and Linux.
- Release logic in a single script that is easy to read and test.

**Non-Goals:**

- Releasing from CI, release PRs, GitHub Releases pages.
- Enforcing conventional commits with a hook or linter.

## Decisions

### git-cliff computes versions and writes the changelog

git-cliff reads conventional commits, computes the bump (`--bumped-version`), and renders the changelog from a template in `cliff.toml`. It is a single binary that mise installs.

Evidence: version 2.13.1 shipped in 2026 (Renovate update PRs from April and May 2026, openSUSE advisory 2026-0287), 2.12.0 on 2026-01-20. The repo is `orhun/git-cliff`, widely used.

Alternatives:

- cocogitto (`cog bump --auto`): also a Rust binary, but it adds its own commit checks, hooks, and bump commit format.
- release-please: runs in CI and opens release PRs. It does not fit a local task or a workflow without PRs.
- semantic-release: runs in CI, Node with plugins, more setup.
- changesets: needs a change file for every change. Our commits already carry the information.

`cliff.toml` settings:

- `tag_pattern = "v[0-9].*"`, conventional commits only, merge commits skipped.
- Commit parsers group `feat`, `fix`, `perf`, `refactor`. Others are skipped.
- `[bump]`: `features_always_bump_minor = true`, `breaking_always_bump_major = false`, `initial_tag = "v0.1.0"` (it must match the tag pattern). This gives the 0.x rules in the spec. When we reach 1.0, `breaking_always_bump_major` goes back to `true`.

### The release script is Node, run by a mise task

`scripts/release.js` holds the logic. `mise.toml` has a `release` task that runs it. mise forwards extra arguments (the optional version and `--dry-run`) to the script, so no `usage` spec is needed. Node is already pinned and runs the same on Windows, so we avoid bash in Git Bash vs PowerShell problems. `scripts/check-standalone.js` uses the same pattern.

The script calls `git`, `gh`, and `git-cliff` with `execFileSync`. It uses `semver` for version validation and comparison instead of handwritten parsing.

Order of steps:

```
checks (clean, main, fetch, HEAD == origin/main, CI passed)
  -> version = arg or `git cliff --bumped-version`
  -> validate (semver, greater than last tag, commits since last tag)
  -> print version + `git cliff --unreleased --tag vX.Y.Z`
  -> dry run? stop
  -> confirm? no: stop
  -> `git cliff --tag vX.Y.Z -o CHANGELOG.md`, set package.json version
  -> prettier --write CHANGELOG.md package.json
  -> commit "chore(release): vX.Y.Z", annotated tag vX.Y.Z
  -> git push --atomic origin main vX.Y.Z
```

`--atomic` pushes the commit and the tag together or not at all. If the push fails, the script prints how to undo the local commit and tag (`git tag -d`, `git reset --hard HEAD~1`) instead of doing it on its own.

Alternative: an inline `run` script in `mise.toml`. It is harder to read, and mise uses a different default shell on Windows.

### CI check uses the GitHub CLI

The script runs `gh run list --workflow ci.yml --commit <HEAD sha> --json status,conclusion` and needs a completed run with conclusion `success`. `gh` is pinned in `mise.toml` too. The maintainer logs in once with `gh auth login`.

Alternative: run lint and tests locally. It is slow (e2e), and CI already ran the same checks on that commit.

### Image workflow runs on tags only

`image.yml` triggers on `push: tags: ['v*']`. It always builds `linux/amd64,linux/arm64` and always pushes. Tag rules: `type=semver,pattern={{version}}` and `type=semver,pattern={{major}}.{{minor}}`. `docker/metadata-action` adds `latest` for semver tags by default. The `edge`, `sha`, and `pr` rules and the pull request conditions go away.

### Docker build check moves to CI

`ci.yml` gets a second job, `docker`, that builds the image for `linux/amd64` with `push: false` and the GitHub Actions cache. It is a separate job so it runs in parallel with tests. The release task's CI check covers both jobs, because it reads the conclusion of the whole workflow run.

### The app version comes from package.json

`vite.config.ts` reads `package.json` and sets the SvelteKit `version.name` to its `version`. The value is the same in local builds and in the Docker build, because `package.json` is in the build context and `.git` is not.

Alternative: commit hash. Not available in the Docker build, and it reloads tabs for every build, not every release.

## Risks / Trade-offs

- [A local rebuild with the same version does not reload open tabs] -> Only affects development with `pnpm docker:up`. Reload by hand.
- [`edge` users stop getting updates without notice] -> The README says to use `latest` or a version tag. The project is in alpha with few users.
- [The release commit itself is not tested by CI before the tag is pushed] -> It only changes `CHANGELOG.md` and the `package.json` version. CI still runs on it after the push.
- [git-cliff output does not match Prettier, and `pnpm lint` fails] -> The script formats both files with Prettier before it commits.
- [Squash or merge commits without a conventional prefix are skipped in the changelog] -> Accepted. Work goes directly to `main`.
- [`gh` not logged in] -> The script stops early and says to run `gh auth login`.

## Migration Plan

1. Land the change and wait for CI to pass.
2. `mise install`, `gh auth login`.
3. `mise run release --dry-run` to check version `0.1.0` and the changelog.
4. `mise run release`. Check that the image workflow publishes `0.1.0`, `0.1`, and `latest`.

Rollback: restore the old `image.yml` triggers. Tags and the changelog can stay.
