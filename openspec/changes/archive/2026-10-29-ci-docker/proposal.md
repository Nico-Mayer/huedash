# Proposal

## Why

huedash ships as a self-hosted Docker image, but there is no image, no compose example, and no CI yet. Every feature change from bridge-pairing onward should be checked automatically, and users need a published image to run.

## What Changes

- Add a multi-stage `Dockerfile` that builds the SvelteKit app and runs it as a non-root Node server, with a `/data` volume and a health check.
- Add a `GET /healthz` endpoint the container health check calls.
- Add `.dockerignore`.
- Add `compose.yaml` as the example for self-hosting (image from GHCR, port, `/data` volume, optional bridge env vars).
- Add a GitHub Actions CI workflow for pull requests and pushes to `main`: lint, type check, unit and component tests, e2e tests, build.
- Add a GitHub Actions image workflow that builds the image for `linux/amd64` and `linux/arm64` and publishes it to GHCR:
  - Push to `main`: tags `edge` and `sha-<short>`.
  - Git tag `v*`: semver tags and `latest`.
  - Pull requests: build only, no push.
- Document self-hosting in `README.md` and CI and image commands in `AGENTS.md`.

## Capabilities

### New Capabilities

- `health-check`: an unauthenticated endpoint that reports the server is up, for container health checks.

### Modified Capabilities

None.

## Impact

- New files: `Dockerfile`, `.dockerignore`, `compose.yaml`, `.github/workflows/ci.yml`, `.github/workflows/image.yml`, `src/routes/healthz/+server.ts` and its test.
- Modified files: `README.md`, `AGENTS.md`.
- New external dependency: GitHub Container Registry (`ghcr.io/nico-mayer/huedash`). The first published package is private by default and must be made public once in GitHub package settings.
- Docker is not installed on the dev machine. The image is built and verified in GitHub Actions, which needs the commits pushed to GitHub.
- Out of scope: release automation (changelog, version bumps), image signing, vulnerability scanning, the env vars' behavior (bridge-pairing).
