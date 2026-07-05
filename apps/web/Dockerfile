# syntax=docker/dockerfile:1
# Multi-stage build for the multi-tenant web app (pnpm monorepo → Next.js
# standalone). Runs self-hosted behind Caddy + Cloudflare CDN (docs/02 §6,
# amended: Vercel replaced by VPS + Cloudflare).

FROM node:22-alpine AS base
RUN corepack enable

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /repo

# Manifests first — layer-cached installs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/numerology/package.json packages/numerology/
COPY packages/report-composer/package.json packages/report-composer/
COPY packages/cms-sdk/package.json packages/cms-sdk/
RUN pnpm install --frozen-lockfile --filter @astro-note/web...

COPY . .

# Build-time CMS access makes tenant pages SSG at image build; the build
# still succeeds (on-demand ISR) when the CMS is unreachable.
ARG DIRECTUS_URL
ARG DIRECTUS_STATIC_TOKEN
ARG DEFAULT_TENANT=astro-note
ENV DIRECTUS_URL=$DIRECTUS_URL \
    DIRECTUS_STATIC_TOKEN=$DIRECTUS_STATIC_TOKEN \
    DEFAULT_TENANT=$DEFAULT_TENANT \
    REPORT_TOKEN_SECRET=build-placeholder-not-used-at-build!! \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @astro-note/web build

# ── run ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
