# 01 — PRD: Astro Note Numerology Funnel

## 1. One-liner
A beautiful, mobile-first numerology experience: a 9-step interactive quiz → free
personalized numerology report → email capture → newsletter co-registration + affiliate
upsell. Brand: **Astro Note** (logos provided by owner).

## 2. Goals & success metrics
| Goal | Metric | Target (first 90 days) |
|---|---|---|
| Lead generation | Quiz start → email submit | ≥ 35% |
| Engagement | Quiz completion rate (step 1 → report) | ≥ 55% |
| Monetization | Co-reg opt-ins per lead (Boosts widget) | ≥ 0.8 avg |
| Monetization | Earnings per lead (co-reg + affiliate) | ≥ $2.00 |
| Retention | Report link revisit within 7 days | ≥ 15% |
| Performance | LCP mobile 4G | < 1.8s |

## 3. Target user
US/UK/CA mobile paid-social traffic (Meta/TikTok), 70% female, 24–55, interested in
astrology/spirituality/self-discovery. They arrive from an ad promising "your
personalized numerology reading." Attention span: seconds. The page must hook instantly.

## 4. End-to-end funnel flow
```
Ad click → Landing (hero + "Begin Your Reading" CTA)
  → Quiz (9 steps, one question per screen, progress bar, animations)
      steps 1–3: birth data (DOB, full birth name, gender optional)
      steps 4–7: psychographic (focus area, feeling, relationship, belief) ← drives personalization
      step 8:    "calculating" interstitial (3.5s animated sequence)
      step 9:    email capture ("Where should we send your full reading?") + consent
  → Report page (personalized, progressive reveal, chart visuals)
      → mid-report: newsletter co-registration widget (Boosts/SparkLoop Upscribe)
      → end-report: affiliate offer card (from CMS) + "email me my full report" confirm
  → Email sequence (Day 0 report link, D1, D3, D7 — managed in beehiiv, out of code scope)
```

## 5. In scope (v1)
- Multi-tenant Next.js frontend (Astro Note is tenant #1)
- Directus CMS controlling: tenants/sites, quiz flows, content blocks, offers, leads, settings
- Numerology engine: Life Path, Expression, Soul Urge, Personality, Birthday,
  Personal Year/Month, Karmic Debt flags, Master Numbers (11/22/33)
- Report composer + report page with signature animations
- beehiiv subscribe integration + Boosts widget embed slot
- Consent management, Plausible + Meta Pixel (post-consent)
- Admin can clone the whole funnel to a new domain purely via CMS entries

## 6. Out of scope (v1)
- Payments / own paid product; astrology (ephemeris) reports — v2
- User accounts/login; the report is accessed via signed tokenized URL
- Blog/SEO content (v1.1 — CMS schema already supports `pages`)

## 7. Why users will engage (product principles)
1. **Their words come back to them** — quiz answers directly select report content.
2. **The number is the hero** — their Life Path number is revealed with a signature
   ink-draw animation and carried visually through the whole report.
3. **Progressive reveal** — the report unfolds section by section on scroll; one
   "locked" insight teased before email confirm creates the open loop.
4. **Freshness** — Personal Year/Month section changes over time → reasons to return.
5. **Speed feels like magic** — instant transitions, zero jank, haptic-feel taps.

## 8. Risks & mitigations
- Ad account restrictions (personal-attribute claims) → copy guidelines in doc 06 §5.
- Co-reg payout requires engaged subscribers → double opt-in + genuinely useful D0–D7
  emails; geo-gate co-reg widget to US/UK/CA traffic.
- Templated look → design system doc 07; Stitch-designed custom UI; no stock component look.
