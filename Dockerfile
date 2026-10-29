# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# Output is plain JavaScript, so build once on the runner's native platform.
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION=12
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --store-dir /pnpm/store

COPY . .
RUN pnpm build

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
	PORT=3000
WORKDIR /app

RUN mkdir /data && chown node:node /data
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/build ./build

USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "build"]
