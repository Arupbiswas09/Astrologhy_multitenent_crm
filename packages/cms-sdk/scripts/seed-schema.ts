/**
 * Directus collection/field/relation definitions — docs/03-CMS-SCHEMA.md.
 * Consumed by seed.ts (create-if-missing; never mutates existing schema).
 */

type FieldDef = {
  field: string;
  type: string;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown>;
};

export type CollectionDef = {
  collection: string;
  meta: Record<string, unknown>;
  schema: Record<string, unknown>;
  fields: FieldDef[];
};

export type RelationDef = {
  collection: string;
  field: string;
  related_collection: string;
  schema?: Record<string, unknown>;
};

const uuidPk: FieldDef = {
  field: "id",
  type: "uuid",
  meta: { special: ["uuid"], interface: "input", readonly: true, hidden: true },
  schema: { is_primary_key: true, length: 36 },
};

const tenantM2o: FieldDef = {
  field: "tenant",
  type: "uuid",
  meta: {
    special: ["m2o"],
    interface: "select-dropdown-m2o",
    options: { template: "{{name}}" },
    required: true,
    width: "half",
  },
  schema: {},
};

function statusField(choices: Array<{ text: string; value: string }>, def: string): FieldDef {
  return {
    field: "status",
    type: "string",
    meta: {
      interface: "select-dropdown",
      options: { choices },
      width: "half",
      required: true,
    },
    schema: { default_value: def, is_nullable: false },
  };
}

const publishStatus = statusField(
  [
    { text: "Draft", value: "draft" },
    { text: "Published", value: "published" },
  ],
  "draft",
);

export const COLLECTIONS: CollectionDef[] = [
  {
    collection: "tenants",
    meta: {
      icon: "domain",
      display_template: "{{name}}",
      note: "One row per funnel site. Adding a site = adding a row (docs/02 §1).",
      sort: 1,
    },
    schema: {},
    fields: [
      uuidPk,
      {
        field: "slug",
        type: "string",
        meta: {
          interface: "input",
          options: { slug: true },
          required: true,
          note: "Stable identifier used by middleware, seed, and analytics.",
          width: "half",
        },
        schema: { is_unique: true, is_nullable: false },
      },
      {
        field: "name",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
        schema: { is_nullable: false },
      },
      {
        field: "domains",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "tags",
          note: "Hostnames served by this tenant — the middleware host→tenant map source.",
        },
        schema: {},
      },
      statusField(
        [
          { text: "Draft", value: "draft" },
          { text: "Live", value: "live" },
        ],
        "draft",
      ),
      {
        field: "theme",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: "Design-token overrides (docs/07 §2): {colors:{...}, fonts:{...}, radius, logoLight, logoDark}.",
        },
        schema: {},
      },
      {
        field: "logo_light",
        type: "uuid",
        meta: { special: ["file"], interface: "file-image", width: "half" },
        schema: {},
      },
      {
        field: "logo_dark",
        type: "uuid",
        meta: { special: ["file"], interface: "file-image", width: "half" },
        schema: {},
      },
      {
        field: "favicon",
        type: "uuid",
        meta: { special: ["file"], interface: "file-image", width: "half" },
        schema: {},
      },
      {
        field: "beehiiv_publication_id",
        type: "string",
        meta: { interface: "input", width: "half", note: "Per-site beehiiv publication." },
        schema: {},
      },
      {
        field: "coreg_provider",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "None", value: "none" },
              { text: "beehiiv Boosts", value: "beehiiv_boosts" },
              { text: "SparkLoop", value: "sparkloop" },
            ],
          },
          width: "half",
        },
        schema: { default_value: "none" },
      },
      {
        field: "coreg_embed_code",
        type: "text",
        meta: {
          interface: "input-multiline",
          note: "Raw embed snippet rendered in the report page co-reg slot.",
        },
        schema: {},
      },
      {
        field: "meta_pixel_id",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "plausible_domain",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "default_locale",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: { default_value: "en" },
      },
    ],
  },

  {
    collection: "quiz_flows",
    meta: {
      icon: "quiz",
      display_template: "{{title}}",
      note: "A quiz funnel definition; steps live in quiz_steps.",
      sort: 2,
    },
    schema: {},
    fields: [
      uuidPk,
      tenantM2o,
      {
        field: "slug",
        type: "string",
        meta: { interface: "input", options: { slug: true }, required: true, width: "half" },
        schema: { is_nullable: false },
      },
      {
        field: "title",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
        schema: { is_nullable: false },
      },
      publishStatus,
      {
        field: "email_step_index",
        type: "integer",
        meta: {
          interface: "input",
          width: "half",
          note: "1-based index of the email-capture step.",
        },
        schema: { default_value: 9 },
      },
      {
        field: "settings",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: "Progress bar style, interstitial duration, etc.",
        },
        schema: {},
      },
    ],
  },

  {
    collection: "quiz_steps",
    meta: {
      icon: "format_list_numbered",
      display_template: "{{step_key}}",
      sort_field: "sort",
      note: "One question per screen. Copy is editable here without deploys.",
      sort: 3,
    },
    schema: {},
    fields: [
      uuidPk,
      {
        field: "flow",
        type: "uuid",
        meta: {
          special: ["m2o"],
          interface: "select-dropdown-m2o",
          options: { template: "{{title}}" },
          required: true,
          width: "half",
        },
        schema: {},
      },
      {
        field: "sort",
        type: "integer",
        meta: { interface: "input", hidden: true },
        schema: {},
      },
      {
        field: "step_key",
        type: "string",
        meta: {
          interface: "input",
          required: true,
          width: "half",
          note: "Stable key the engine maps on: dob, full_name, gender, focus_area, current_feeling, relationship_status, belief_level, calculating, email.",
        },
        schema: { is_nullable: false },
      },
      {
        field: "type",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Date input", value: "date_input" },
              { text: "Text input", value: "text_input" },
              { text: "Single choice", value: "single_choice" },
              { text: "Interstitial", value: "interstitial" },
              { text: "Email capture", value: "email_capture" },
            ],
          },
          required: true,
          width: "half",
        },
        schema: { is_nullable: false },
      },
      {
        field: "headline",
        type: "string",
        meta: {
          interface: "input",
          required: true,
          note: "Supports {{first_name}} interpolation once known (step 4+).",
        },
        schema: { is_nullable: false },
      },
      {
        field: "subline",
        type: "text",
        meta: { interface: "input-multiline" },
        schema: {},
      },
      {
        field: "options",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: 'single_choice: [{"value","label","emoji"}]. Other types: settings object (button_label, rotating_texts, …).',
        },
        schema: {},
      },
      {
        field: "validation",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: 'e.g. {"min_words":2} for names, {"min_year":1920,"max_year":2015} for DOB.',
        },
        schema: {},
      },
      {
        field: "animation_key",
        type: "string",
        meta: {
          interface: "input",
          width: "half",
          note: "Registered animation (docs/07 §5): ink-number-draw, letters-to-numbers, orbit-collapse, card-ink-select, constellation-settle, progress-fill.",
        },
        schema: {},
      },
    ],
  },

  {
    collection: "content_blocks",
    meta: {
      icon: "auto_stories",
      display_template: "{{section}} · {{label}}",
      note: "THE REPORT BRAIN. Voice: warm, second person, never absolute predictions ('You may find…', '7s tend to…'). FORBIDDEN: health claims/cures, guaranteed financial outcomes, fear hooks, negative personal-attribute assertions, fake countdowns, invented testimonials (docs/06 §5). Reading level ≈ grade 6–7, short paragraphs.",
      sort: 4,
    },
    schema: {},
    fields: [
      uuidPk,
      tenantM2o,
      publishStatus,
      {
        field: "section",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              "opening",
              "life_path_core",
              "expression",
              "soul_urge",
              "personality",
              "focus_bridge",
              "feeling_mirror",
              "relationship_lens",
              "personal_year",
              "strengths",
              "challenges",
              "teaser_locked",
              "closing_cta",
            ].map((value) => ({ text: value, value })),
          },
          required: true,
          width: "half",
        },
        schema: { is_nullable: false },
      },
      {
        field: "label",
        type: "string",
        meta: {
          interface: "input",
          required: true,
          width: "half",
          note: "Admin display name, e.g. 'Life Path 7 core'.",
        },
        schema: { is_nullable: false },
      },
      {
        field: "match",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: 'Selection conditions — every key must include the lead\'s value; empty = wildcard. Keys: life_path, life_path_group (dynamic|relational|builder|seeker), focus_area, current_feeling, relationship_status, belief_level, personal_year, is_master, has_karmic_debt. E.g. {"life_path":[7],"focus_area":["love"]}.',
        },
        schema: {},
      },
      {
        field: "priority",
        type: "integer",
        meta: { interface: "input", width: "half", note: "Tiebreaker — higher wins." },
        schema: { default_value: 0 },
      },
      {
        field: "body",
        type: "text",
        meta: {
          interface: "input-rich-text-md",
          note: "Markdown. Interpolation: {{first_name}} {{life_path}} {{expression}} {{soul_urge}} {{personality}} {{personal_year}} {{focus_area_label}} {{current_year}}.",
        },
        schema: {},
      },
      {
        field: "visual_key",
        type: "string",
        meta: { interface: "input", width: "half", note: "Optional illustration reference." },
        schema: {},
      },
    ],
  },

  {
    collection: "offers",
    meta: {
      icon: "sell",
      display_template: "{{title}}",
      note: "Affiliate offer cards. cta_url supports the {{sub_id}} macro (lead id) for attribution.",
      sort: 5,
    },
    schema: {},
    fields: [
      uuidPk,
      tenantM2o,
      {
        field: "placement",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Report end", value: "report_end" },
              { text: "Email only", value: "email_only" },
            ],
          },
          required: true,
          width: "half",
        },
        schema: { default_value: "report_end", is_nullable: false },
      },
      {
        field: "title",
        type: "string",
        meta: { interface: "input", required: true },
        schema: { is_nullable: false },
      },
      { field: "body", type: "text", meta: { interface: "input-multiline" }, schema: {} },
      {
        field: "cta_label",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "cta_url",
        type: "string",
        meta: {
          interface: "input",
          note: "Affiliate link; {{sub_id}} is replaced with the lead id.",
        },
        schema: {},
      },
      {
        field: "image",
        type: "uuid",
        meta: { special: ["file"], interface: "file-image", width: "half" },
        schema: {},
      },
      publishStatus,
      { field: "sort", type: "integer", meta: { interface: "input", hidden: true }, schema: {} },
    ],
  },

  {
    collection: "settings",
    meta: {
      icon: "settings",
      display_template: "Settings",
      note: "One row per tenant: footer, legal text, cookie banner, support email.",
      sort: 6,
    },
    schema: {},
    fields: [
      uuidPk,
      tenantM2o,
      {
        field: "footer_links",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "list",
          options: {
            fields: [
              {
                field: "label",
                type: "string",
                name: "label",
                meta: { interface: "input", field: "label", type: "string" },
              },
              {
                field: "url",
                type: "string",
                name: "url",
                meta: { interface: "input", field: "url", type: "string" },
              },
            ],
          },
        },
        schema: {},
      },
      {
        field: "privacy_policy",
        type: "text",
        meta: { interface: "input-rich-text-md" },
        schema: {},
      },
      { field: "terms", type: "text", meta: { interface: "input-rich-text-md" }, schema: {} },
      {
        field: "cookie_banner",
        type: "text",
        meta: { interface: "input-multiline", note: "Consent banner copy." },
        schema: {},
      },
      {
        field: "support_email",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "social_links",
        type: "json",
        meta: { special: ["cast-json"], interface: "input-code", options: { language: "JSON" } },
        schema: {},
      },
      // DECISION: landing copy lives on settings — doc 03 has no landing
      // collection but the "no hardcoded content" rule requires it in the CMS.
      {
        field: "landing_headline",
        type: "string",
        meta: { interface: "input", note: "Landing hero headline." },
        schema: {},
      },
      {
        field: "landing_subline",
        type: "text",
        meta: { interface: "input-multiline" },
        schema: {},
      },
      {
        field: "landing_cta_label",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "landing_trust_row",
        type: "string",
        meta: { interface: "input", note: "Small reassurance line under the CTA." },
        schema: {},
      },
      {
        field: "landing_discover",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: '"What you\'ll discover" cards: [{"title","body"}].',
        },
        schema: {},
      },
    ],
  },

  {
    collection: "leads",
    meta: {
      icon: "contact_mail",
      display_template: "{{email}}",
      note: "PII — admin-only read. Web writes via the leads-writer token only. GDPR/CCPA deletion: delete the row (see README runbook).",
      sort: 7,
    },
    schema: {},
    fields: [
      uuidPk,
      tenantM2o,
      {
        field: "created_at",
        type: "timestamp",
        meta: { special: ["date-created"], interface: "datetime", readonly: true, width: "half" },
        schema: {},
      },
      {
        field: "email",
        type: "string",
        meta: { interface: "input", required: true, width: "half" },
        schema: { is_nullable: false },
      },
      {
        field: "first_name",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "full_birth_name",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      { field: "dob", type: "date", meta: { interface: "datetime", width: "half" }, schema: {} },
      {
        field: "gender",
        type: "string",
        meta: { interface: "input", width: "half" },
        schema: {},
      },
      {
        field: "answers",
        type: "json",
        meta: { special: ["cast-json"], interface: "input-code", options: { language: "JSON" } },
        schema: {},
      },
      {
        field: "numbers",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: "Engine output snapshot at submit time.",
        },
        schema: {},
      },
      {
        field: "selected_blocks",
        type: "json",
        meta: {
          special: ["cast-json"],
          interface: "input-code",
          options: { language: "JSON" },
          note: "Block IDs used — keeps the report reproducible after content edits.",
        },
        schema: {},
      },
      {
        field: "utm",
        type: "json",
        meta: { special: ["cast-json"], interface: "input-code", options: { language: "JSON" } },
        schema: {},
      },
      {
        field: "consent_marketing",
        type: "boolean",
        meta: { interface: "boolean", width: "half" },
        schema: { default_value: false, is_nullable: false },
      },
      {
        field: "consent_ts",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
        schema: {},
      },
      {
        field: "beehiiv_status",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "Pending", value: "pending" },
              { text: "Subscribed", value: "subscribed" },
              { text: "Failed", value: "failed" },
            ],
          },
          width: "half",
        },
        schema: { default_value: "pending" },
      },
      {
        field: "report_token_issued_at",
        type: "timestamp",
        meta: { interface: "datetime", width: "half" },
        schema: {},
      },
      {
        field: "report_url",
        type: "string",
        meta: {
          interface: "input",
          // DECISION: not in doc 03's table, but doc 08 §1 requires report_url
          // as a beehiiv merge field on subscribe; the Flow reads it from the row.
          note: "Signed report link — sent to beehiiv as a merge field.",
        },
        schema: {},
      },
    ],
  },
];

export const RELATIONS: RelationDef[] = [
  { collection: "tenants", field: "logo_light", related_collection: "directus_files" },
  { collection: "tenants", field: "logo_dark", related_collection: "directus_files" },
  { collection: "tenants", field: "favicon", related_collection: "directus_files" },
  { collection: "quiz_flows", field: "tenant", related_collection: "tenants" },
  { collection: "quiz_steps", field: "flow", related_collection: "quiz_flows" },
  { collection: "content_blocks", field: "tenant", related_collection: "tenants" },
  { collection: "offers", field: "tenant", related_collection: "tenants" },
  { collection: "offers", field: "image", related_collection: "directus_files" },
  { collection: "settings", field: "tenant", related_collection: "tenants" },
  { collection: "leads", field: "tenant", related_collection: "tenants" },
];
