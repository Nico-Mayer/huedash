# Design

## Context

SvelteKit 3 app with adapter-node, pnpm 12 and Node 24 pinned in `mise.toml`. `pnpm build` writes `build/`. All packages are devDependencies, so the adapter-node output should be self-contained (SvelteKit bundles everything that is not a runtime dependency). Tests: `pnpm test:unit --run` (Vitest, Node and Chromium), `pnpm test:e2e` (Playwright against `node --import ./src/mocks/preload.ts build`). Repo is public at `github.com/Nico-Mayer/huedash`. Docker is not installed locally.

Checked versions (2026-10-29):

| Item | Version | Released |
|---|---|---|
| `node:24-alpine` image | amd64, arm64/v8 | updated 2026-10-28 |
| `actions/checkout` | v7.0.1 | 2026-07-20 |
| `jdx/mise-action` | v5.2.4 | 2026-10-27 |
| `actions/upload-artifact` | v7.0.2 | 2026-10-07 |
| `docker/setup-qemu-action` | v4.4.0 | 2026-09-15 |
| `docker/setup-buildx-action` | v4.4.1 | 2026-09-16 |
| `docker/login-action` | v4.7.0 | 2026-10-23 |
| `docker/metadata-action` | v6.2.0 | 2026-07-02 |
| `docker/build-push-action` | v7.4.0 | 2026-09-15 |

## Goals / Non-Goals

**Goals:**
- `docker compose up` with the example file runs huedash on the LAN.
- Every PR and push to `main` runs the same checks as local development.
- Images for `amd64` and `arm64` (Raspberry Pi and similar home servers are common hosts).

**Non-Goals:**
- No release automation, changelog, image signing, or vulnerability scanning.
- No behavior for `HUE_BRIDGE_IP` / `HUE_APP_KEY` yet (bridge-pairing). The compose file only shows them, commented out.

## Decisions

### Multi-stage Dockerfile on `node:24-alpine`
- `build` stage runs on `$BUILDPLATFORM`: install pnpm, `pnpm install --frozen-lockfile`, `pnpm build`. The output is plain JavaScript, so building once on the runner's native platform avoids slow QEMU emulation.
- `runtime` stage on the target platform: copy `build/` and `package.json`, `ENV NODE_ENV=production PORT=3000`, `USER node`, `VOLUME /data`, `EXPOSE 3000`, `CMD ["node", "build"]`.
- `HEALTHCHECK` runs `node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`. No `wget` or `curl` needed.
- pnpm version comes from a build arg that defaults to the major in `mise.toml`, installed with `npm install -g pnpm@$PNPM_VERSION`.
- Verified (task 1.1): `node build` serves the app from a folder with only `build/` and `package.json`, so the runtime stage installs no dependencies.

Alternatives:
- Distroless Node image. Rejected for now: no shell makes debugging on home servers harder; small size gain.
- `node:24-slim` (Debian). Rejected: larger than Alpine with no native modules that need glibc.

### `/healthz` as a SvelteKit server route
`src/routes/healthz/+server.ts` returns `json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } })`. See `specs/health-check/spec.md`.

### Compose example
`compose.yaml` with `image: ghcr.io/nico-mayer/huedash:latest`, `ports: "3000:3000"`, `volumes: ./data:/data`, `restart: unless-stopped`, and commented env vars. A named volume is the alternative; a bind mount makes `/data` easy to inspect and back up.

The container runs as `node` (UID 1000). A bind-mounted `./data` must be writable by UID 1000. The README says so.

### CI workflow (`ci.yml`)
Triggers: `pull_request`, `push` to `main`. One job on `ubuntu-latest`:
1. `actions/checkout`
2. `jdx/mise-action` with `install_args: node pnpm`, so tool versions come from `mise.toml` (single source)
3. `pnpm install --frozen-lockfile`
4. `pnpm lint`, `pnpm check`
5. `pnpm exec playwright install --with-deps chromium`
6. `pnpm test:unit --run`, `pnpm test:e2e`
7. On failure, upload `playwright-report/` and `test-results/` with `actions/upload-artifact`

`concurrency` cancels older runs on the same ref. `permissions: contents: read`.

Alternative: `actions/setup-node` + `pnpm/action-setup`. Rejected: duplicates the versions already in `mise.toml`.

### Image workflow (`image.yml`)
Triggers: `push` to `main`, tags `v*`, `pull_request`. Steps: checkout, QEMU, Buildx, GHCR login (skipped on PRs), `docker/metadata-action` for tags, `docker/build-push-action` with GitHub Actions cache (`type=gha`).
- PR: `linux/amd64` only, `push: false`.
- `main`: both platforms, tags `edge`, `sha-<short>`.
- `v*` tag: both platforms, semver tags `{{version}}`, `{{major}}.{{minor}}`, and `latest`.
`permissions: contents: read, packages: write`. Image name `ghcr.io/${{ github.repository }}` lowercased by metadata-action.

Separate workflows so a failing image build does not hide test results, and the image can be rebuilt without rerunning tests.

### Action versions
Pin each action to its current major (`@v7`, `@v5`, ...), matching the table above. The `github-actions-templates` skill uses older majors; the table wins.

## Risks / Trade-offs

- [No local Docker] → The Dockerfile is verified only in CI. Task order puts the CI image build on a PR before relying on it. Needs the user to push.
- [GHCR package starts private] → The README and the summary tell the user to set it public once after the first push.
- [arm64 build under QEMU is slow] → Only the small runtime stage runs emulated; the build stage runs natively.
- [Bind mount permissions on `/data`] → Documented; bridge-pairing will add a clear error when `/data` is not writable.
- [`mise-action` installs every tool in `mise.toml`] → `install_args: node pnpm` limits it to what CI needs.
