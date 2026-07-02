# 08 — Integrations, Tracking & Consent

## 1. beehiiv (per tenant)
- Subscribe on lead create (Directus Flow preferred; fallback: direct call from
  `/api/lead` if Flow latency is an issue — pick ONE path, don't double-subscribe).
- `POST https://api.beehiiv.com/v2/publications/{pubId}/subscriptions`
  body: `{ email, reactivate_existing: true, send_welcome_email: true,
  utm_source/utm_medium/utm_campaign, custom_fields: [{name:"life_path",value},
  {name:"focus_area",value},{name:"first_name",value},{name:"report_url",value}] }`
- Double opt-in ON (protects co-reg engagement metrics + deliverability).
- Day-0 welcome email in beehiiv uses `report_url` merge field.

## 2. Co-registration widget
- Render tenant's `coreg_embed_code` in the report page slot (§06-9) inside a
  `<CoRegSlot/>` component: lazy-load script on slot visibility, geo-gate via
  `request.headers["cf-ipcountry"] ∈ {US,GB,CA}` (pass flag from server), else hide slot
  entirely and expand the offers section instead.
- Start with beehiiv Boosts (native, no approval barrier); the CMS field makes swapping
  to SparkLoop Upscribe a content edit, not a deploy.

## 3. Analytics & pixels
- **Plausible** (lightweight, no consent needed as configured cookieless):
  events — `quiz_start`, `quiz_step_{n}`, `email_submitted`, `report_viewed`,
  `coreg_impression`, `coreg_click`, `offer_click`, with tenant + utm_source props.
  This event chain IS the funnel dashboard.
- **Meta Pixel + CAPI:** load only after consent accept. Fire `Lead` on email submit
  (browser + server CAPI event with event_id dedup, hashed email). ViewContent on
  report. Pixel ID per tenant from CMS.
- UTM + fbclid captured on first hit → sessionStorage → sent with lead.

## 4. Consent
- First visit banner (CMS copy): Accept / Essential only. Essential = Plausible only.
  Store choice in localStorage `an_consent`. No marketing pixels before accept.
- Email consent is a SEPARATE unchecked checkbox at step 9 (doc 05). `consent_marketing`
  + timestamp stored on lead. Footer links: Privacy, Terms (CMS singletons).
- Data deletion: support email in footer; admin deletes lead row in Directus (document
  the manual GDPR/CCPA process in README).

## 5. Email validation on /api/lead
zod schema → syntax → domain MX lookup (dns/promises, 800ms timeout, fail-open) →
disposable-domain blocklist (bundle a maintained list). Honeypot field `website` must be
empty. Rate limit: 5 posts/min/IP.

## 6. Affiliate links
`offers.cta_url` supports `{{sub_id}}` (lead uuid) — enables per-lead conversion
attribution in affiliate dashboards (e.g. ClickBank tid). Open in new tab, `rel="sponsored noopener"`.
