# Astro Note — Build Pack

Complete hand-off pack for building the Astro Note numerology funnel with Claude Code + Google Stitch.

## How to use
1. Create a new repo, copy this whole folder in (CLAUDE.md at repo root, docs/ alongside).
2. Run the Stitch prompts in `docs/07-DESIGN-SYSTEM.md` §6, export screens to `design/stitch-exports/` and brand assets (incl. your logos) to `apps/web/public/brand/`.
3. Open the repo in Claude Code and say: "Read CLAUDE.md and docs/, then start Phase 0 from docs/09-BUILD-PHASES.md."
4. Work phase by phase (0→7). ~9–13 working days total.

## Files
- CLAUDE.md — master rules for Claude Code
- docs/01-PRD.md — goals, funnel, KPIs
- docs/02-ARCHITECTURE.md — stack + multi-tenant + why Directus
- docs/03-CMS-SCHEMA.md — every Directus collection & Flow
- docs/04-NUMEROLOGY-ENGINE.md — algorithms + test vectors
- docs/05-QUIZ-FLOW.md — all 9 steps with copy
- docs/06-REPORT-CONTENT-SYSTEM.md — content blocks, selection logic, ~122-block inventory
- docs/07-DESIGN-SYSTEM.md — tokens, animations, Stitch prompts
- docs/08-INTEGRATIONS.md — beehiiv, co-reg, pixels, consent
- docs/09-BUILD-PHASES.md — build order + checklists

## Owner TODO (not Claude Code)
- Logos → apps/web/public/brand/
- Register domain, beehiiv account + publication, VPS (Hetzner ~€5), Vercel account
- Draft the ~122 content blocks (use Claude chat with doc 06 §2 + §5 as the brief)
- Privacy policy + terms text (CMS settings)
