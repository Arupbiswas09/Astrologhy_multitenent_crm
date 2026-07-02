# 09 — Build Phases (work in this order; verify checklist before next phase)

## Phase 0 — Scaffold (½ day)
Monorepo (pnpm workspaces, TS strict, ESLint+Prettier, Vitest). Next.js app boots.
`cms/docker-compose.yml` runs Directus+Postgres locally. CI: lint+test+build (GitHub Actions).
✅ `pnpm dev` serves placeholder page; Directus admin reachable at :8055.

## Phase 1 — Numerology engine (1 day)
`packages/numerology` per doc 04. Write tests FIRST from re-derived vectors; edge cases
(Y, hyphens, diacritics, masters, karmic, leap day). 100% branch coverage on reduce/letter logic.
✅ `pnpm --filter numerology test` green.

## Phase 2 — CMS schema + seed (1 day)
Collections per doc 03, roles (public=none, web-read token, admin), Flows 1–3 stubbed.
`cms/seed.ts` inserts Astro Note tenant, quiz flow + 9 steps (copy from doc 05), one
wildcard content block per section (placeholder text), 1 offer, settings.
Schema snapshot committed. `packages/cms-sdk`: typed client, cached fetchers
(`getTenantByHost`, `getQuizFlow`, `getBlocks(tenant)`).
✅ Seed runs idempotently; sdk integration test against local Directus passes.

## Phase 3 — Multi-tenant shell + landing (1–2 days)
`middleware.ts` host→tenant; theme CSS vars injected; 404 tenant page; landing per docs
05+07 with `ink-number-draw` hero; fonts self-hosted; Plausible.
✅ Two fake tenants resolve with different themes locally; Lighthouse mobile ≥ 90 on landing.

## Phase 4 — Quiz engine (2–3 days)
CMS-driven step machine (Zustand + sessionStorage), all 5 step types, validation,
progress bar, animations per registry (doc 07 §5), reduced-motion paths, interstitial.
✅ Full quiz playthrough on 390px; refresh mid-quiz resumes; all events fire.

## Phase 5 — Lead API + report (2–3 days)
`/api/lead` (zod, honeypot, rate limit, MX check) → engine → composer
(`packages/report-composer` per doc 06 §3–4, unit-tested selection) → persist → beehiiv
(one path) → signed token. `/report/[token]` page: hero reveal, calculation moment,
sections, co-reg slot (geo-gated), teaser, offers, share row.
✅ E2E (Playwright): quiz → email → report renders; token revisit works; invalid token 404s;
composer picks most-specific block in tests.

## Phase 6 — Tracking, consent, polish (1–2 days)
Consent banner, Meta Pixel post-consent + CAPI dedup, funnel events complete,
error/empty states, disposable-email list, security headers (CSP allowing beehiiv/coreg
domains only), OG images per tenant.
✅ Lighthouse mobile ≥ 90 on landing/quiz/report; no console errors; CSP clean.

## Phase 7 — Deploy (1 day)
Directus+Postgres+Caddy on VPS (env docs, nightly pg_dump). Vercel project, domains
attached, ISR verified, `x-tenant` works on real domains. Runbook in README: "add a new
site in 30 minutes" (tenant row → domains → beehiiv pub → theme → seed blocks → DNS).
✅ Production quiz→report round trip; beehiiv double-opt-in email received.

## Definition of done (v1)
All phase checklists ✅ · owner can edit any copy/quiz/block in Directus and see it live
≤ 5 min · a second test tenant on another domain serves the same funnel with different
branding with ZERO code changes.

## v1.1 backlog (do not build now)
SparkLoop swap, A/B variants per quiz step (CMS field ready), locale support,
astrology/moon tenant (ephemeris microservice), Directus per-tenant editor roles,
Meta CAPI batching, report PDF export.
