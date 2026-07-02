/** Collection shapes — mirror of docs/03-CMS-SCHEMA.md (source of truth). */

export type TenantStatus = "draft" | "live";
export type PublishStatus = "draft" | "published";
export type CoregProvider = "none" | "beehiiv_boosts" | "sparkloop";

export interface TenantTheme {
  colors?: Partial<{
    "ink-950": string;
    "ink-900": string;
    "ink-700": string;
    "paper-100": string;
    "paper-300": string;
    "gold-400": string;
    "gold-200": string;
    "violet-500": string;
  }>;
  fonts?: Partial<{ display: string; body: string; annotation: string }>;
  radius?: string;
  logoLight?: string;
  logoDark?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domains: string[];
  status: TenantStatus;
  theme: TenantTheme | null;
  logo_light: string | null;
  logo_dark: string | null;
  favicon: string | null;
  beehiiv_publication_id: string | null;
  coreg_provider: CoregProvider;
  coreg_embed_code: string | null;
  meta_pixel_id: string | null;
  plausible_domain: string | null;
  default_locale: string;
}

export type QuizStepType =
  | "date_input"
  | "text_input"
  | "single_choice"
  | "interstitial"
  | "email_capture";

export interface QuizChoiceOption {
  value: string;
  label: string;
  emoji?: string;
  icon?: string;
}

/** `options` is choice-array for single_choice; a settings object for other types. */
export interface QuizStep {
  id: string;
  flow: string;
  sort: number;
  step_key: string;
  type: QuizStepType;
  headline: string;
  subline: string | null;
  options: QuizChoiceOption[] | Record<string, unknown> | null;
  validation: Record<string, unknown> | null;
  animation_key: string | null;
}

export interface QuizFlow {
  id: string;
  tenant: string;
  slug: string;
  title: string;
  status: PublishStatus;
  email_step_index: number;
  settings: Record<string, unknown> | null;
}

export type BlockSection =
  | "opening"
  | "life_path_core"
  | "expression"
  | "soul_urge"
  | "personality"
  | "focus_bridge"
  | "feeling_mirror"
  | "relationship_lens"
  | "personal_year"
  | "strengths"
  | "challenges"
  | "teaser_locked"
  | "closing_cta";

/**
 * Selection conditions: every key present must include the lead's value
 * (missing key = wildcard), e.g. `{"life_path":[7],"focus_area":["love"]}`.
 */
export type BlockMatch = Record<string, Array<string | number | boolean>>;

export interface ContentBlock {
  id: string;
  tenant: string;
  status: PublishStatus;
  section: BlockSection;
  /** Admin display name + seed idempotency key. */
  label: string;
  match: BlockMatch | null;
  priority: number;
  body: string;
  visual_key: string | null;
}

export type OfferPlacement = "report_end" | "email_only";

export interface Offer {
  id: string;
  tenant: string;
  placement: OfferPlacement;
  title: string;
  body: string;
  cta_label: string;
  /** Affiliate link; supports the `{{sub_id}}` macro (lead id). */
  cta_url: string;
  image: string | null;
  status: PublishStatus;
  sort: number;
}

export interface TenantSettings {
  id: string;
  tenant: string;
  footer_links: Array<{ label: string; url: string }> | null;
  privacy_policy: string | null;
  terms: string | null;
  cookie_banner: string | null;
  support_email: string | null;
  social_links: Array<{ label: string; url: string }> | null;
}

export type BeehiivStatus = "pending" | "subscribed" | "failed";

export interface Lead {
  id: string;
  tenant: string;
  created_at: string;
  email: string;
  first_name: string | null;
  full_birth_name: string;
  dob: string;
  gender: string | null;
  answers: Record<string, string>;
  numbers: Record<string, unknown>;
  selected_blocks: string[];
  utm: Record<string, string> | null;
  consent_marketing: boolean;
  consent_ts: string | null;
  beehiiv_status: BeehiivStatus;
  report_token_issued_at: string | null;
  report_url: string | null;
}

export type LeadCreate = Omit<Lead, "created_at" | "beehiiv_status"> &
  Partial<Pick<Lead, "beehiiv_status">>;
