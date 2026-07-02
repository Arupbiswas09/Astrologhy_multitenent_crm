# 03 — Directus CMS Schema (source of truth)

Create these collections in Directus. Commit the schema snapshot to `cms/schema.yaml`.
A seed script (`cms/seed.ts`) must populate Astro Note's tenant, quiz flow, and starter
content blocks (block copy provided separately by owner; use doc 06 placeholders until then).

## tenants
| field | type | notes |
|---|---|---|
| id | uuid | |
| slug | string, unique | `astro-note` |
| name | string | "Astro Note" |
| domains | json (string[]) | ["astronote.com","www.astronote.com"] — middleware map source |
| status | dropdown | draft / live |
| theme | json | `{colors:{...}, fonts:{...}, radius, logoLight, logoDark}` (token names per doc 07) |
| logo_light / logo_dark / favicon | file | Stitch-generated assets |
| beehiiv_publication_id | string | per-site publication |
| coreg_provider | dropdown | none / beehiiv_boosts / sparkloop |
| coreg_embed_code | text | raw embed snippet, rendered on report page slot |
| meta_pixel_id / plausible_domain | string | |
| default_locale | string | `en` |

## quiz_flows
| field | type |
|---|---|
| id, tenant (m2o tenants), slug, title, status | |
| email_step_index | integer — which step is the capture (default 9) |
| settings | json — progress bar style, interstitial duration |

## quiz_steps
| field | type | notes |
|---|---|---|
| id, flow (m2o quiz_flows), sort | | |
| step_key | string | stable key used by engine mapping: `dob`, `full_name`, `gender`, `focus_area`, `current_feeling`, `relationship_status`, `belief_level`, `calculating`, `email` |
| type | dropdown | `date_input` / `text_input` / `single_choice` / `interstitial` / `email_capture` |
| headline / subline | string/text | supports `{{name}}` interpolation once known |
| options | json | for single_choice: `[{value,label,emoji?,icon?}]` |
| validation | json | e.g. name: min 2 words; dob: 1920–2015 |
| animation_key | string | maps to a registered animation component (doc 07 §5) |

## content_blocks  ← the report brain
| field | type | notes |
|---|---|---|
| id, tenant, status | | |
| section | dropdown | `opening` / `life_path_core` / `expression` / `soul_urge` / `personality` / `focus_bridge` / `feeling_mirror` / `relationship_lens` / `personal_year` / `strengths` / `challenges` / `teaser_locked` / `closing_cta` |
| match | json | selection conditions, e.g. `{"life_path":[7],"focus_area":["love"]}` — empty = wildcard. Composer picks the most specific matching block (doc 06 §3) |
| priority | integer | tiebreaker, higher wins |
| body | rich text (markdown) | supports `{{first_name}}`, `{{life_path}}`, `{{expression}}`, `{{soul_urge}}`, `{{personal_year}}`, `{{focus_area_label}}` |
| visual_key | string | optional illustration reference for the section |

## offers
| id, tenant, placement (`report_end`/`email_only`), title, body, cta_label, cta_url (affiliate link with `{{sub_id}}` macro), image (file), status, sort |

## leads  (admin-only read)
| field | type |
|---|---|
| id (uuid), tenant, created_at | |
| email, first_name, full_birth_name, dob, gender | PII — restrict role access |
| answers | json (all quiz responses keyed by step_key) |
| numbers | json (engine output snapshot) |
| selected_blocks | json (block IDs used — makes report reproducible even if content edited) |
| utm | json (source/medium/campaign/content/term + fbclid) |
| consent_marketing | boolean, consent_ts | timestamp |
| beehiiv_status | dropdown: pending / subscribed / failed |
| report_token_issued_at | timestamp |

## settings (singleton per tenant via tenant m2o)
Footer links, privacy policy rich text, terms rich text, cookie banner copy,
support email, social links.

## Directus Flows to configure
1. **On leads.create** → POST beehiiv `/v2/publications/{id}/subscriptions`
   (email, utm as custom fields, `send_welcome_email: true`, double opt-in) → update
   `beehiiv_status`. Retry ×3 backoff; on final fail set `failed`.
2. **On leads.create** → notification webhook (optional Slack/Telegram) with tenant + utm_source.
3. **Nightly** → export previous day's leads CSV to a Directus folder (backup/audit).
