# 05 — Quiz Flow (Astro Note v1)

One question per screen. Progress bar top (thin, animated). Back arrow top-left from
step 2. Auto-advance on choice selection (250ms delay with selected-state animation).
All copy below is seed content — stored in CMS, editable without deploys.

## Landing (pre-quiz)
- Hero: night-ink background, the signature "living number" animation cycling 1→9
  drawn in gold ink strokes. Headline: **"Your numbers have been waiting for you."**
- Subline: "A free, personalized numerology reading — from your name and birth date."
- CTA button (full-width, thumb zone): **Begin my reading** → quiz.
- Trust row: "2-minute reading · 100% free · No signup to start"
- Below fold (scroll): 3 short "what you'll discover" cards + soft testimonials + footer
  (privacy/terms from CMS).

## Steps
| # | step_key | type | Headline | Details |
|---|---|---|---|---|
| 1 | dob | date_input | "First — when were you born?" | Custom 3-wheel picker (day/month/year), large touch targets. Subline: "Your birth date holds your Life Path — the master number of your reading." |
| 2 | full_name | text_input | "Your full birth name" | Subline: "As written on your birth certificate — every letter carries a value." Validation ≥ 2 words. Micro-animation: as they type, tiny gold numbers float up from letters (the letter-value preview — signature moment #2). |
| 3 | gender | single_choice | "How do you identify?" | Female / Male / Other / Prefer not to say. (Optional — skippable link.) |
| 4 | focus_area | single_choice | "{{first_name}}, what's calling for clarity right now?" | ❤️ Love & relationships / 💰 Money & career / 🧭 Life purpose / 🌿 Health & energy — **primary personalization key** |
| 5 | current_feeling | single_choice | "Which feels most like you lately?" | "Stuck in a loop" / "On the edge of something big" / "Pulled in two directions" / "Quietly hopeful" |
| 6 | relationship_status | single_choice | "And your heart — where does it stand?" | In a relationship / Single / It's complicated / Healing |
| 7 | belief_level | single_choice | "How deep does your connection to numerology go?" | "It guides me" / "Curious but new" / "Skeptic — surprise me" (tone-selector: blocks can vary voice by this) |
| 8 | calculating | interstitial | "Reading your numbers…" | 3.5s sequence: their DOB digits orbit → collapse into Life Path number → ink-draw reveal begins → cut to step 9 BEFORE full reveal (open loop). Progress texts rotate: "Mapping your Life Path…", "Weighing every letter of {{first_name}}…", "Aligning your Personal Year…" |
| 9 | email | email_capture | "{{first_name}}, your reading is ready." | "Enter your email to unlock it — we'll also send you a copy so you never lose it." Email field + consent checkbox (unchecked): "Send me my reading plus weekly number guidance. Unsubscribe anytime." Button: **Reveal my reading**. Tiny reassurance: "Free forever. No spam. Your data stays private." |

## Logic notes
- `first_name` = first word of full_name, title-cased; available from step 4 onward.
- Answers 4–7 feed `content_blocks.match` (doc 06). Skipped gender = no effect.
- Email submit → POST /api/lead → on success route to `/report/[token]`.
- If lead API fails: inline retry state, never lose their answers (sessionStorage).
- Abandonment: if user leaves after step 3 but before email — nothing stored server-side
  (privacy); sessionStorage lets them resume on return within the session.

## Micro-interaction spec (all steps)
- Step transitions: slide+fade 280ms, spring easing; progress bar fills with slight overshoot.
- Choice cards: press-scale 0.97, selected → gold border ink-draw around the card.
- Haptic-feel: 60ms subtle scale bounce on tap (no actual vibration API in v1).
- Reduced motion: replace slides with 120ms opacity fades; kill decorative particles.
