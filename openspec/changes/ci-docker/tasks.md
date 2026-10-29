# Tasks

## 1. Health endpoint

- [x] 1.1 Verify the build is self-contained: copy `build/` and `package.json` to a temp folder without `node_modules`, run `node build`, and check `/` answers 200; record the result in design.md
- [x] 1.2 Add `src/routes/healthz/+server.ts` returning `{"status":"ok"}` with `Cache-Control: no-store` and a unit test for status, body, content type, and header; verify `pnpm test:unit --run` passes
- [x] 1.3 Add an e2e test that `GET /healthz` on the production build returns 200 while the mock bridge has no handler for it; verify `pnpm test:e2e` passes

## 2. Docker image

- [x] 2.1 Add `.dockerignore` (node_modules, build output, test output, `.git`, `.claude`, `openspec`, `data`, `.env*`) and verify every path it lists is a build-irrelevant path
- [x] 2.2 Add the multi-stage `Dockerfile` as in design.md (build on `$BUILDPLATFORM`, runtime `node:24-alpine`, `USER node`, `VOLUME /data`, `EXPOSE 3000`, `HEALTHCHECK` via `node -e fetch`); verify the `multi-stage-dockerfile` skill checklist (pinned base, non-root user, layer order, healthcheck) is met
- [x] 2.3 Add `compose.yaml` (GHCR image, `3000:3000`, `./data:/data`, `restart: unless-stopped`, commented `HUE_BRIDGE_IP` / `HUE_APP_KEY`); verify it parses with `yq '.services.huedash.image' compose.yaml`

## 3. GitHub Actions

- [x] 3.1 Add `.github/workflows/ci.yml` (mise-action with `install_args: node pnpm`, frozen install, lint, check, Chromium install, unit and e2e tests, report upload on failure, concurrency, read-only permissions); verify it parses with `yq` and every action uses the major from design.md
- [x] 3.2 Add `.github/workflows/image.yml` (QEMU, Buildx, GHCR login skipped on PRs, metadata tags, build-push with `type=gha` cache, amd64-only no-push on PRs, both platforms on `main` and `v*`); verify it parses with `yq` and permissions are `contents: read, packages: write`

## 4. Docs

- [x] 4.1 Add a "Self-hosting" section to `README.md` (compose up, port, `/data` must be writable by UID 1000, image tags `latest`/`edge`/semver) and verify the commands match `compose.yaml`
- [x] 4.2 Add CI and image notes to `AGENTS.md` (workflows, tags, Docker only built in CI) and verify `pnpm lint` passes

## 5. Verify in GitHub

- [x] 5.1 Commit on a `ci-docker` branch in atomic conventional commits and verify `git log --oneline` shows them with no co-author lines
- [x] 5.2 After the user pushes the branch, open a PR with `gh pr create` and verify both workflows pass with `gh pr checks`
- [ ] 5.3 After the user merges, verify the `main` image run publishes `edge` and `sha-*` tags for amd64 and arm64 with `gh run view` and the GHCR package page, and remind the user to make the package public

## Workflow follow-up

- Archive the change with `/opsx:archive` after review.
