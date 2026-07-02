# 07 — Design System & Stitch Workflow

## 1. Concept: "The Cosmic Notebook"
Astro Note = a private notebook where the universe writes back. Not generic
purple-gradient astrology, not template SaaS. The visual world: **midnight ink, hand-drawn
gold annotations, paper texture, constellation dots that behave like margin notes.**
Numbers are treated as characters — drawn, underlined, circled like a mystic's notes.

## 2. Tokens (CSS variables; tenant `theme` JSON overrides these per site)
```css
--ink-950:#0B0E1C;   /* page background — deep night ink */
--ink-900:#12172B;   /* cards */
--ink-700:#2A3352;   /* borders, dividers */
--paper-100:#F5EFE2; /* primary text on ink; also light-section bg */
--paper-300:#CFC6B2; /* secondary text */
--gold-400:#E4B85C;  /* THE accent: numbers, CTAs, ink strokes */
--gold-200:#F2D89A;  /* gold highlight/glow */
--violet-500:#8B7EC8;/* rare secondary accent: links, personal-year section only */
--radius: 14px;
```
Contrast: body `--paper-100` on `--ink-950` ≈ 14:1 ✅. Gold used for display sizes /
UI chrome, not long body text.

## 3. Typography
- **Display (the numbers + headlines): "Fraunces"** (variable, high-contrast optical
  sizes; use SOFT+WONK axes at large sizes for the hand-inked feel). Numbers rendered
  huge (min 96px on mobile hero).
- **Body: "Satoshi"** (or "General Sans") — warm neutral grotesque, 17px/1.6 mobile.
- **Annotation/utility: "Caveat"** sparingly — the handwritten margin-note moments
  (underlines, "your number" labels). Max 2 instances per screen.
- Self-host all three, `font-display: optional` for Caveat, swap-with-fallback-metrics
  for the others.

## 4. Signature element (spend the boldness here, once)
**The Living Number:** user's Life Path numeral drawn as an SVG gold-ink stroke
(stroke-dasharray animation, 2.2s, slight wobble filter for hand-drawn feel), then a
hand-drawn ellipse circles it (Caveat-style stroke), constellation dots settle around it
and connect with 1px lines. Reused small (24px, pre-drawn) as the report's section
bullet — the number literally follows the user through the report.
Everything else stays quiet and disciplined: generous spacing, few colors, no gradients
except a barely-there radial ink glow behind heroes.

## 5. Animation registry (`animation_key` values used by CMS)
| key | where | spec |
|---|---|---|
| `ink-number-draw` | report hero, landing hero | SVG stroke draw, 2.2s, easeOut |
| `letters-to-numbers` | name input + calc moment | letters flip (rotateX) to values, stagger 40ms |
| `orbit-collapse` | step-8 interstitial | DOB digits orbit center, collapse inward |
| `card-ink-select` | quiz choices | 300ms border ink-draw on select |
| `constellation-settle` | section reveals on scroll | dots fade+drift to grid, IntersectionObserver, once |
| `progress-fill` | quiz progress bar | springy width fill |
All decorative keys disabled under `prefers-reduced-motion`.

## 6. Stitch → Claude Code workflow
1. Owner runs the prompts below in **Google Stitch** (mobile, 390×844 frames), iterates
   until happy, exports: PNG per screen into `design/stitch-exports/`, and any generated
   illustrations/icons into `apps/web/public/brand/` (plus provided logos).
2. Claude Code implements each screen from the export + THIS token system. Where Stitch
   output conflicts with tokens (§2–3), **tokens win** — recolor/retype to match.
   Stitch defines layout/spacing/composition; this doc defines the system.
3. Extract any reusable Stitch illustration as optimized SVG/AVIF (< 40KB each).

### Stitch prompts (paste per screen)
- **Landing:** "Mobile landing page, 390px, for 'Astro Note', a premium numerology
  reading. Deep midnight-ink navy background #0B0E1C, cream text #F5EFE2, single gold
  accent #E4B85C. Elegant high-contrast serif display font for the headline 'Your
  numbers have been waiting for you.' Centerpiece: a large hand-drawn gold number 7
  with a rough ink circle around it and small constellation dots connected by thin
  lines. Full-width gold rounded button 'Begin my reading'. Trust line beneath in small
  cream text. Mystical but minimal and editorial — like a beautiful notebook, NOT a
  purple gradient astrology app."
- **Quiz choice step:** "Mobile quiz screen, same Astro Note system: thin gold progress
  bar top, back arrow, serif question headline 'What's calling for clarity right now?',
  four vertically stacked choice cards on #12172B with 14px radius, subtle icons, one
  card selected with a hand-drawn gold outline. Generous spacing, calm, premium."
- **Date wheel step / Name input step / Interstitial / Email capture / Report hero /
  Report section cards / Co-reg slot / Offer card:** (same system sentence + the layout
  description from docs 05–06 for that screen).
Keep every prompt anchored with: "midnight ink #0B0E1C, cream #F5EFE2, gold #E4B85C,
editorial serif display, hand-drawn ink annotation style, minimal, premium notebook feel."

## 7. Quality floor
390px first; thumb-zone CTAs (bottom 25%); 44px min touch targets; visible focus rings
(gold, 2px offset); dark-only v1 (it IS the brand); test on low-end Android throttled 4×.
