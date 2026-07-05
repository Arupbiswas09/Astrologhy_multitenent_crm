# Astro Note

Mobile-first numerology quiz funnel: 9-step quiz → free personalized report → email
capture → newsletter co-registration + affiliate offers. **Multi-tenant** — one codebase +
one Directus CMS serve the whole funnel network. Site #1: Astro Note.

Built per `docs/01…09` (read them in order). Phases 0–6 of `docs/09-BUILD-PHASES.md` are
implemented and verified; Phase 7 (production deploy) is a runbook below.

## Repo layout

```
apps/web/                 Next.js 15 multi-tenant frontend (App Router, Tailwind v4)
packages/numerology/      pure Pythagorean engine — 35 tests, 100% coverage
packages/report-composer/ block selection + interpolation — 11 tests
packages/cms-sdk/         typed Directus client, fetch helpers, seed scripts
cms/                      docker-compose (Directus 11 + Postgres 16 + prod Caddy/backup),
                          schema.yaml snapshot, seed entrypoint
docs/                     the spec — source of truth
```

## Local development

```bash
pnpm install
pnpm cms:up                      # Directus at :8055 (admin@example.com / astro-note-admin)
pnpm cms:seed                    # idempotent: schema, roles/tokens, flows, 2 tenants, content
cp apps/web/.env.example apps/web/.env.local
pnpm dev                         # web at :3000 — localhost resolves tenant astro-note
```

- Tenant override in dev: `http://localhost:3000/?tenant=moon-letter`
- Verify everything: `pnpm lint && pnpm test && pnpm build`
- E2E (needs seeded Directus): `pnpm --filter @astro-note/web test:e2e`
- Integration tests: `pnpm --filter @astro-note/cms-sdk test:integration`

## How it works

- `apps/web/src/middleware.ts` maps Host → tenant slug (5-min cached map from Directus,
  stale-if-error) and rewrites to `/t/<slug>/…` (per-tenant ISR, 300 s). Unknown host → 404.
- Quiz steps, landing copy, report content blocks, offers, legal text: **all in Directus**.
  The web app only ships structure + fallbacks for CMS outages.
- `POST /api/lead`: zod → honeypot → rate limit (5/min/IP) → disposable-domain block →
  MX check (fail-open) → numerology engine → composer → lead row (with chosen block IDs +
  signed 30-day report token + report_url) → `{token}`. beehiiv subscribe happens ONLY in
  the Directus Flow (consent-gated) — never double-subscribe.
- `/report/<token>`: HMAC-verified, per-lead, `noindex`. Persisted blocks keep the report
  reproducible; the Personal Year section stays live so return visits change.
- Consent: banner (Accept / Essential). Plausible is always-on (cookieless); Meta Pixel
  loads only after Accept; server CAPI Lead is sent only with marketing consent, deduped
  via `event_id = lead id`.

## Phase 7 — production deploy runbook

**CMS (VPS, e.g. Hetzner):**
1. Copy `cms/` to the server, `cp .env.example .env`, set strong `DIRECTUS_SECRET`,
   `DIRECTUS_ADMIN_PASSWORD`, `DIRECTUS_ADMIN_TOKEN`, `DB_PASSWORD`, `CMS_DOMAIN`,
   `DIRECTUS_PUBLIC_URL=https://<CMS_DOMAIN>`, beehiiv keys.
2. `docker compose --profile production up -d` (adds Caddy TLS + nightly pg_dump to
   `cms/data/backups`, 14-day retention). Point `CMS_DOMAIN` DNS at the VPS first.
3. Run the seed from your machine against production:
   `DIRECTUS_URL=https://<CMS_DOMAIN> DIRECTUS_ADMIN_TOKEN=… DIRECTUS_WEB_TOKEN=… DIRECTUS_LEADS_TOKEN=… pnpm cms:seed`
4. In Directus: enable 2FA for admin, replace placeholder privacy/terms, paste real
   content blocks (~122 per `docs/06 §2`), set `beehiiv_publication_id` on the tenant.

**Web (Docker on the VPS, behind Caddy + Cloudflare):**
1. The web app runs as a container (`apps/web/Dockerfile`, Next.js standalone) defined
   by `cms/web-compose.yml` → deployed to `/opt/astro-note-web` on the VPS by CI.
   Runtime env lives in `/opt/astro-note-web/.env` (internal `DIRECTUS_URL=http://directus:8055`).
2. Caddy (from the CMS stack) terminates TLS for both `CMS_DOMAIN` and `WEB_DOMAIN`
   (set in `/opt/astro-note/.env`) and proxies `WEB_DOMAIN` → the web container.
3. **Cloudflare (domain day)**: add the brand domain as a zone (free plan) → point
   registrar nameservers at Cloudflare → DNS A record `@` and `www` → VPS IP with
   **Proxied (orange cloud)** → SSL/TLS mode "Full (strict)". Add a Cache Rule:
   cache eligible for `/_next/static/*` and `/brand/*` (long TTL); BYPASS `/api/*`
   and `/report/*`. Cloudflare then provides the CDN + the `cf-ipcountry` header the
   co-reg geo-gate reads. Finally set `WEB_DOMAIN=<domain>` in `/opt/astro-note/.env`,
   restart Caddy, and add the domain to the tenant's `domains` in Directus.
4. Smoke test: quiz → email → report on the real domain; confirm beehiiv double-opt-in
   email arrives (welcome email must use the `report_url` merge field, docs/08 §1).

**Add a new site in ~30 minutes (zero code):**
1. Directus → tenants: new row (slug, name, domains, status `live`, theme JSON — palette
   from docs/07 §2, logo paths), `beehiiv_publication_id`, optional pixel/plausible ids.
2. Duplicate the quiz flow + 9 steps for the tenant (or re-run seed with the tenant in
   `seed-data.ts`), add the 13 wildcard blocks minimum (composer requires them), offer,
   settings row.
3. Vercel: add the new domains. DNS → Vercel. Done — middleware picks it up within 5 min.

## Privacy / data deletion (GDPR/CCPA manual process)

Delete the lead row in Directus (leads collection) — the report link stops working
immediately (the page 404s when the row is gone). beehiiv unsubscribe/deletion is handled
in beehiiv. Document requests via the support inbox listed in the tenant's settings.

## Owner TODO (not code)

- Draft the ~122 content blocks (docs/06 §2 inventory; seed ships wildcard fallbacks +
  demo variants only)
- Final privacy policy + terms text (CMS settings)
- beehiiv: publication per tenant, double opt-in ON, welcome email with `report_url`
- Ad accounts: keep copy inside docs/06 §5 compliance rules
