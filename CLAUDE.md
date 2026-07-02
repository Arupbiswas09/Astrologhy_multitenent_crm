# CLAUDE.md — Astro Note Build Instructions

You are building **Astro Note**: a mobile-first numerology quiz-funnel website that generates
personalized numerology reports, captures emails, and monetizes via newsletter
co-registration (beehiiv Boosts / SparkLoop) and affiliate offers. It is site #1 of a
multi-site funnel network — everything must be **multi-tenant from day one**, controlled by
a single Directus CMS.

## Read these docs in order before writing any code
1. `docs/01-PRD.md` — product goals, funnel flow, KPIs
2. `docs/02-ARCHITECTURE.md` — stack, repos, multi-tenant design
3. `docs/03-CMS-SCHEMA.md` — Directus collections (source of truth for all content)
4. `docs/04-NUMEROLOGY-ENGINE.md` — exact calculation algorithms (must match test vectors)
5. `docs/05-QUIZ-FLOW.md` — every quiz step, copy, and logic
6. `docs/06-REPORT-CONTENT-SYSTEM.md` — how reports are assembled from content blocks
7. `docs/07-DESIGN-SYSTEM.md` — design tokens, animation specs, Stitch asset integration
8. `docs/08-INTEGRATIONS.md` — beehiiv, tracking, consent
9. `docs/09-BUILD-PHASES.md` — the order to build in; work phase by phase

## Hard rules
- **Mobile-first.** Design and test at 390px width first. Desktop is the adaptation.
- **Performance is a feature.** Budget: LCP < 1.8s on 4G, JS bundle for the quiz route
  < 150KB gz, Lighthouse mobile ≥ 90. Animations must be CSS/Framer-Motion/SVG —
  NO Three.js/WebGL on the funnel path. Lottie only if a file is < 60KB.
- **No hardcoded content.** All copy, quiz steps, content blocks, offers come from
  Directus. If Directus is unreachable, serve the last cached (ISR) version.
- **Tenant-aware everywhere.** Every page resolves tenant from the request hostname via
  `middleware.ts`. Never assume a single site.
- **Determinism.** The numerology engine is pure functions with unit tests. Same input →
  same output, always. Personalization variety comes from quiz answers + content
  selection, not randomness.
- **Privacy.** Consent checkbox before email capture, real unsubscribe links, no PII in
  URLs or client-side logs. Store leads server-side only.
- **Accessibility floor:** visible focus states, `prefers-reduced-motion` respected
  (disable decorative animation, keep functional transitions), semantic HTML, 4.5:1
  contrast for body text.

## Stack (do not substitute without asking)
- Next.js 15 (App Router, TypeScript, Tailwind CSS v4, Framer Motion)
- Directus 11 (self-hosted, Postgres 16) — CMS + admin + Flows automation
- Postgres 16 — shared by Directus; leads live in Directus collections
- Deployment: Vercel (web) + Docker Compose on VPS (Directus + Postgres)
- Email: beehiiv API v2 (subscribe endpoint), Boosts widget on report page
- Analytics: Plausible (self-host optional) + Meta Pixel (fired only after consent)

## Repo layout (monorepo, pnpm workspaces)
```
astro-note/
├── apps/web/                 # Next.js multi-tenant frontend
├── packages/numerology/      # pure TS calculation engine + tests
├── packages/report-composer/ # content-block selection + assembly logic
├── packages/cms-sdk/         # typed Directus client + fetch helpers
├── cms/                      # Directus: docker-compose, schema snapshot, seed script
└── docs/                     # these documents
```

## Working style
- Follow `docs/09-BUILD-PHASES.md`. Finish and verify a phase (run its checklist) before
  moving on. Write tests for `packages/numerology` FIRST (test vectors are in doc 04).
- After each phase, run: `pnpm lint && pnpm test && pnpm build`.
- Commit per phase with conventional commits.
- Design assets (logos, illustrations, screen exports) arrive from Google Stitch in
  `apps/web/public/brand/` and `design/stitch-exports/`. Match the Stitch screens
  pixel-faithfully at 390px; use design tokens from doc 07 — never invent new colors.
- When something is ambiguous, check the docs first; if still ambiguous, choose the
  option that is simpler and faster to load, and leave a `// DECISION:` comment.
