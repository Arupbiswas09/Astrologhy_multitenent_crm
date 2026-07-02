# 06 — Report Content System (`packages/report-composer`)

## 1. Report page structure (in render order)
1. **Hero reveal** — the signature moment. Full-screen: "{{first_name}}, you are a
   Life Path {{life_path}}." The number draws itself in gold ink stroke (SVG,
   2.2s), constellation dots settle around it. This finishes the open loop from step 8.
2. `opening` block — 3–4 sentences that mirror their `current_feeling` answer.
3. `life_path_core` — the main reading (250–350 words), varies by life_path (+ master/karmic variants).
4. **Calculation moment** — interactive: their name letters flip to numbers
   (from `breakdown.nameLetters`), summing animation → Expression number. Builds credibility.
5. `expression`, `soul_urge`, `personality` — shorter blocks (~120 words each), card layout.
6. `focus_bridge` — bridges their numbers to their `focus_area` ("For your love life,
   a 7's guarded heart means…"). **Highest personalization value — write these best.**
7. `relationship_lens` — varies by relationship_status × life_path group.
8. `personal_year` — "Your 2026 is a Personal Year {{personal_year}}" + month note.
   Time-varying section = return visits stay fresh.
9. **Co-registration slot** — tenant's `coreg_embed_code` renders HERE (after peak value
   delivery, before the teaser). Heading: "Readers like you also love…". US/UK/CA
   geo only (CF country header); hidden otherwise.
10. `teaser_locked` — one blurred card: "Your {{karmic/hidden}} number reveals a pattern
    from your past…" → CTA: "It's in your emailed full reading" (drives email opens →
    engagement thresholds for co-reg payouts).
11. `strengths` / `challenges` — twin cards.
12. `closing_cta` + `offers` (placement `report_end`) — affiliate card(s) from CMS with
    `{{sub_id}}` = lead id for attribution.
13. Share row: "Send a friend their number" (link to landing with ?ref=).

## 2. Block inventory to write (owner + Claude drafts, stored in CMS)
| section | variants | count |
|---|---|---|
| opening | 4 (per current_feeling) | 4 |
| life_path_core | 12 (1–9, 11, 22, 33) | 12 |
| expression / soul_urge / personality | 12 each, shorter | 36 |
| focus_bridge | life_path_group(4: 1-3-5 "dynamic", 2-6-9 "relational", 4-8-22 "builder", 7-11-33 "seeker") × focus_area(4) | 16 |
| relationship_lens | status(4) × group(4) | 16 |
| personal_year | 9 | 9 |
| strengths+challenges | 12 pairs | 24 |
| teaser_locked | 3 rotating | 3 |
| closing | 2 | 2 |
| **Total** | | **~122 blocks** ≈ 13k words, one focused drafting week |

Combinations shown to users: 12 × 4 × 4 × 4 × 4 = **12,288 distinct reports.**

## 3. Selection algorithm (deterministic)
For each section: filter tenant's published blocks where every key in `match` includes
the lead's value (missing key = wildcard) → score = number of matched keys → pick
highest score, tie-break by `priority`, then lowest id. Zero matches = fall back to the
section's wildcard block (seed one per section — REQUIRED). Persist chosen block IDs on
the lead (reproducible report even after content edits).

## 4. Interpolation
`{{first_name}} {{life_path}} {{expression}} {{soul_urge}} {{personality}}
{{personal_year}} {{focus_area_label}} {{current_year}}` — escape everything else;
markdown rendered with a strict allowlist (no raw HTML from CMS).

## 5. Copy guidelines (compliance-critical — include in CMS editor help text)
- Voice: warm, second-person, specific-feeling Barnum statements; confident but never
  absolute predictions. "You may find…", "7s tend to…", never "You WILL get rich."
- FORBIDDEN: health claims/cures, guaranteed financial outcomes, "someone is watching
  you"-style fear hooks, negative personal-attribute assertions (Meta ads policy risk
  extends to landers), fake countdowns, invented testimonials.
- Every report includes footer line: "For entertainment and self-reflection purposes."
- Reading level ~grade 6–7; short paragraphs (2–3 sentences); mobile line length.
