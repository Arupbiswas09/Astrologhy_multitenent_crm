# 02 — Architecture

## 1. CMS decision: Directus 11 (not Payload)
Chosen because the network's core requirement is **many websites, one admin**:
- **Multi-site by data model:** every content collection carries a `tenant` relation.
  One Directus instance manages unlimited sites; adding a site = insert a `tenants` row.
- **Roles & policies:** per-tenant editor roles possible later (VA edits site A only).
- **Flows (built-in automation):** on lead insert → webhook to beehiiv, Slack notify,
  enrich UTM — no extra worker service needed.
- **Postgres-native + REST & GraphQL out of the box**, file/asset library for per-tenant
  logos, schema snapshots for versioned migrations.
- Self-hosted, free at our scale (BSL license: free under $5M total finances).
Alternative considered: Strapi v5 (fine, but weaker admin UX for non-devs and no Flows).

## 2. System diagram
```
                 ┌──────────────── Cloudflare DNS/proxy ────────────────┐
 astronote.com ──┤                                                      │
 site2.com ──────┤   all domains → Vercel (single Next.js deployment)   │
 siteN.com ──────┘                                                      │
                       │ middleware.ts: Host header → tenant slug
                       ▼
              Next.js 15 App Router (ISR + edge cache)
               │            │                     │
               │            │ POST /api/lead      │ GET content (build/ISR)
               ▼            ▼                     ▼
   packages/numerology   Route handlers ──► Directus 11 (VPS, Docker)
   packages/report-composer   │                 │  Postgres 16
   (pure TS, runs on server)  │                 │  Flows → beehiiv API,
                              └── beehiiv API ◄─┘         Meta CAPI (later)
```

## 3. Multi-tenancy
- `middleware.ts` maps `Host` → tenant slug (lookup cached in edge config / in-memory map
  refreshed every 5 min from Directus `tenants`). Sets `x-tenant` header.
- All CMS queries filter by tenant. All routes live once; theming via CSS variables
  injected from tenant `theme` JSON (colors, fonts, logo URLs).
- Unknown host → 404 tenant-not-found page.
- Local dev: `?tenant=astro-note` query override + `.env` default tenant.

## 4. Data flow — the report
1. Quiz answers held in client state (Zustand) + mirrored to `sessionStorage`.
2. On email submit → `POST /api/lead` with answers + UTM + consent flag.
3. Server: validate (zod) → run `numerology` engine → run `report-composer`
   (fetch tenant's content blocks from Directus, cached) → persist `leads` row with
   computed numbers + selected block IDs → subscribe to beehiiv (double opt-in)
   → return signed report token (JWT, 30-day exp, HMAC secret).
4. Client routes to `/report/[token]` — server component verifies token, loads lead row,
   re-composes report (deterministic), renders. Link is shareable/revisitable and is the
   Day-0 email link.

## 5. Performance strategy
- Landing + quiz shell statically generated per tenant (ISR, revalidate 300s).
- Quiz steps = one route, client-side step machine (no navigation cost between steps).
- Fonts: self-hosted, `size-adjust` fallbacks, preload display font woff2 only.
- Images: AVIF/WebP via next/image; Stitch exports run through squoosh in CI.
- Animations: Framer Motion (LazyMotion, domAnimation only), SVG stroke animations,
  CSS transforms. Respect `prefers-reduced-motion`.
- Third-party: Boosts/SparkLoop script loaded only on report page, `strategy="lazyOnload"`.
  Meta Pixel behind consent, loaded via Partytown if it hurts TBT.

## 6. Environments & config
- `.env` (web): `DIRECTUS_URL`, `DIRECTUS_STATIC_TOKEN` (read-only role),
  `REPORT_TOKEN_SECRET`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `DEFAULT_TENANT`.
- `cms/docker-compose.yml`: Directus + Postgres + Caddy (TLS). Nightly `pg_dump` cron.
- Directus schema tracked via `npx directus schema snapshot` → `cms/schema.yaml`
  committed; applied on deploy with `schema apply`.

## 7. Security
- Directus admin behind strong password + 2FA; public role has zero access; web reads
  via static token role limited to published content collections (no `leads` read).
- `POST /api/lead`: rate-limit (upstash-style token bucket in memory per IP), honeypot
  field, server-side email validation (syntax + MX), reject disposable domains (list).
- Report tokens are HMAC-signed; no sequential IDs exposed anywhere.
