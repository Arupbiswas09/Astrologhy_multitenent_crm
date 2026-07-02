/**
 * Seed content — Astro Note tenant, quiz flow + 9 steps (copy from docs/05),
 * wildcard content blocks per section (docs/06 §3 requires one per section),
 * demonstration variant blocks, one offer, settings.
 *
 * Copy follows docs/06 §5: warm second person, hedged ("may", "tend to"),
 * no health/financial claims, grade 6–7 reading level.
 */

export const TENANTS = [
  {
    slug: "astro-note",
    name: "Astro Note",
    domains: ["astronote.com", "www.astronote.com", "localhost", "127.0.0.1"],
    status: "live",
    theme: {
      colors: {
        "ink-950": "#0B0E1C",
        "ink-900": "#12172B",
        "ink-700": "#2A3352",
        "paper-100": "#F5EFE2",
        "paper-300": "#CFC6B2",
        "gold-400": "#E4B85C",
        "gold-200": "#F2D89A",
        "violet-500": "#8B7EC8",
      },
      radius: "14px",
      logoLight: "/brand/astro-note-logo-horizontal-transparent-cream.png",
      logoDark: "/brand/astro-note-logo-horizontal-transparent-ink.png",
    },
    coreg_provider: "none",
    coreg_embed_code: null,
    beehiiv_publication_id: null,
    meta_pixel_id: null,
    plausible_domain: "astronote.com",
    default_locale: "en",
  },
  {
    // Second tenant proves multi-tenancy (docs/09 Phase 3 checklist). Palette
    // stays within doc 07 tokens — accents swapped, no invented colors.
    slug: "moon-letter",
    name: "Moon Letter",
    domains: ["moonletter.local", "www.moonletter.local"],
    status: "live",
    theme: {
      colors: {
        "gold-400": "#8B7EC8",
        "gold-200": "#B4AAE0",
        "violet-500": "#E4B85C",
      },
      radius: "10px",
      logoLight: "/brand/astro-note-mark-transparent-cream.png",
      logoDark: "/brand/astro-note-mark-transparent-ink.png",
    },
    coreg_provider: "none",
    coreg_embed_code: null,
    beehiiv_publication_id: null,
    meta_pixel_id: null,
    plausible_domain: "moonletter.local",
    default_locale: "en",
  },
] as const;

export const QUIZ_FLOW = {
  slug: "main",
  title: "Your Reading",
  status: "published",
  email_step_index: 9,
  settings: { progress_style: "thin-gold", interstitial_ms: 3500 },
};

export const QUIZ_STEPS = [
  {
    sort: 1,
    step_key: "dob",
    type: "date_input",
    headline: "First — when were you born?",
    subline: "Your birth date holds your Life Path — the master number of your reading.",
    options: {},
    validation: { required: true, min_year: 1920, max_year: 2015 },
    animation_key: null,
  },
  {
    sort: 2,
    step_key: "full_name",
    type: "text_input",
    headline: "Your full birth name",
    subline: "As written on your birth certificate — every letter carries a value.",
    options: { placeholder: "e.g. Maria Louise Carter" },
    validation: { required: true, min_words: 2, max_length: 80 },
    animation_key: "letters-to-numbers",
  },
  {
    sort: 3,
    step_key: "gender",
    type: "single_choice",
    headline: "How do you identify?",
    subline: null,
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "other", label: "Other" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
    validation: { optional: true, skip_label: "Skip this question" },
    animation_key: "card-ink-select",
  },
  {
    sort: 4,
    step_key: "focus_area",
    type: "single_choice",
    headline: "{{first_name}}, what's calling for clarity right now?",
    subline: null,
    options: [
      { value: "love", label: "Love & relationships", emoji: "❤️" },
      { value: "money", label: "Money & career", emoji: "💰" },
      { value: "purpose", label: "Life purpose", emoji: "🧭" },
      { value: "health", label: "Health & energy", emoji: "🌿" },
    ],
    validation: { required: true },
    animation_key: "card-ink-select",
  },
  {
    sort: 5,
    step_key: "current_feeling",
    type: "single_choice",
    headline: "Which feels most like you lately?",
    subline: null,
    options: [
      { value: "stuck", label: "Stuck in a loop" },
      { value: "edge", label: "On the edge of something big" },
      { value: "torn", label: "Pulled in two directions" },
      { value: "hopeful", label: "Quietly hopeful" },
    ],
    validation: { required: true },
    animation_key: "card-ink-select",
  },
  {
    sort: 6,
    step_key: "relationship_status",
    type: "single_choice",
    headline: "And your heart — where does it stand?",
    subline: null,
    options: [
      { value: "relationship", label: "In a relationship" },
      { value: "single", label: "Single" },
      { value: "complicated", label: "It's complicated" },
      { value: "healing", label: "Healing" },
    ],
    validation: { required: true },
    animation_key: "card-ink-select",
  },
  {
    sort: 7,
    step_key: "belief_level",
    type: "single_choice",
    headline: "How deep does your connection to numerology go?",
    subline: null,
    options: [
      { value: "guided", label: "It guides me" },
      { value: "curious", label: "Curious but new" },
      { value: "skeptic", label: "Skeptic — surprise me" },
    ],
    validation: { required: true },
    animation_key: "card-ink-select",
  },
  {
    sort: 8,
    step_key: "calculating",
    type: "interstitial",
    headline: "Reading your numbers…",
    subline: null,
    options: {
      duration_ms: 3500,
      rotating_texts: [
        "Mapping your Life Path…",
        "Weighing every letter of {{first_name}}…",
        "Aligning your Personal Year…",
      ],
    },
    validation: {},
    animation_key: "orbit-collapse",
  },
  {
    sort: 9,
    step_key: "email",
    type: "email_capture",
    headline: "{{first_name}}, your reading is ready.",
    subline: "Enter your email to unlock it — we'll also send you a copy so you never lose it.",
    options: {
      button_label: "Reveal my reading",
      consent_label: "Send me my reading plus weekly number guidance. Unsubscribe anytime.",
      reassurance: "Free forever. No spam. Your data stays private.",
      placeholder: "you@example.com",
    },
    validation: { required: true },
    animation_key: null,
  },
] as const;

type BlockSeed = {
  section: string;
  label: string;
  match: Record<string, Array<string | number | boolean>> | null;
  priority: number;
  body: string;
  visual_key?: string;
};

/** Wildcard fallbacks — REQUIRED one per section (docs/06 §3). */
export const WILDCARD_BLOCKS: BlockSeed[] = [
  {
    section: "opening",
    label: "Opening · wildcard",
    match: null,
    priority: 0,
    body: "{{first_name}}, your numbers tell a quieter story than the noise of any single week. They don't predict — they describe the shape of your energy, and lately that shape has been asking for your attention.\n\nRead this the way you'd read a letter from an old friend: slowly, and with an open hand.",
  },
  {
    section: "life_path_core",
    label: "Life Path · wildcard",
    match: null,
    priority: 0,
    body: "Your Life Path is **{{life_path}}** — the number your birth date reduces to, and the through-line of this whole reading. Think of it less as a label and more as a *direction of pull*: the kind of work, love, and challenge that tends to find you, again and again, until you meet it on purpose.\n\nPeople who share your path often describe the same paradox. From the outside, their life looks like a series of choices; from the inside, it feels like a series of recognitions — moments of \"oh, it's this again,\" each one arriving with slightly better timing than the last. That's the path doing what paths do. It doesn't demand perfection. It rewards *participation*.\n\nWhat tends to trip up a {{life_path}} isn't lack of ability — it's forgetting which battles are actually theirs. When you take on struggles that belong to someone else's path, your energy leaks; when you return to your own, it compounds. You may have felt both within the same month.\n\nYour numbers below — Expression, Soul Urge, Personality — are the instruments. The Life Path is the song. As you scroll, notice which lines make you exhale. That reaction is data. The sections that follow are built from your answers, so the reading gets more specific from here.",
  },
  {
    section: "expression",
    label: "Expression · wildcard",
    match: null,
    priority: 0,
    body: "Your Expression number — **{{expression}}** — is drawn from every letter of your birth name. If the Life Path is the road, Expression is the vehicle: the talents and instincts you use to move.\n\nAn Expression {{expression}} tends to work best when it stops imitating how others get things done. Your name carries its own method. The calculation moment above showed you the raw material — this is what it builds.",
  },
  {
    section: "soul_urge",
    label: "Soul Urge · wildcard",
    match: null,
    priority: 0,
    body: "The vowels of your name — the breath in it — reduce to your Soul Urge: **{{soul_urge}}**. This is the private number. It names what actually feeds you, which is not always what you've been taught to want.\n\nWhen life feels flat even though nothing is wrong, it's usually this number being ignored. Small, regular acts that honor it tend to change more than grand gestures.",
  },
  {
    section: "personality",
    label: "Personality · wildcard",
    match: null,
    priority: 0,
    body: "Your consonants shape your Personality number — **{{personality}}** — the version of you people meet before they know you. It's the outer door, and it's doing more work than you give it credit for.\n\nThere's often a gap between this number and the Soul Urge behind it. That gap isn't fake; it's a filter. Knowing what your door signals helps you decide who gets a key.",
  },
  {
    section: "focus_bridge",
    label: "Focus bridge · wildcard",
    match: null,
    priority: 0,
    body: "You said {{focus_area_label}} is what's calling for clarity — so let's bring your numbers to exactly that.\n\nA {{life_path}} approaching this area tends to over-rely on its strongest muscle and neglect its quietest one. The pattern to watch this season: progress here may come from doing *less* of what you're best at, and slightly more of what you usually delegate, avoid, or rush.",
  },
  {
    section: "feeling_mirror",
    label: "Feeling mirror · wildcard",
    match: null,
    priority: 0,
    body: "The feeling you named at the start of this reading isn't a detour from your chart — it's the current weather inside it. Numbers set the climate; seasons still turn.\n\nHold your answer lightly as you read on. It tends to change faster than people expect once it's been said out loud.",
  },
  {
    section: "relationship_lens",
    label: "Relationship lens · wildcard",
    match: null,
    priority: 0,
    body: "Hearts don't follow arithmetic — but they do follow patterns, and yours are consistent. A {{life_path}} tends to love the way it lives: with the same strengths, and the same blind spot.\n\nWhatever your current chapter looks like, the useful question isn't \"is this right?\" but \"am I showing up as my number at its best, or at its most defended?\" One of those attracts the connection you actually want.",
  },
  {
    section: "personal_year",
    label: "Personal Year · wildcard",
    match: null,
    priority: 0,
    body: "Right now you're moving through a **Personal Year {{personal_year}}** — the cycle your birth date makes with {{current_year}}. Personal Years turn like seasons: nine of them, each asking a different question.\n\nA Year {{personal_year}} tends to reward what matches its tempo and quietly resist what doesn't. If some efforts have felt oddly heavy and others oddly easy lately, this is often why. Check back next month — this section updates as your cycle moves.",
    visual_key: "orbit",
  },
  {
    section: "strengths",
    label: "Strengths · wildcard",
    match: null,
    priority: 0,
    body: "**Where you're strong.** Your combination of a {{life_path}} path with an Expression {{expression}} gives you a reliable pair: one number that senses the direction, one that can actually build the road. When they agree, people around you feel it as calm competence.\n\nYour strengths are most visible to others exactly when they feel most ordinary to you. That's worth remembering before you discount them.",
  },
  {
    section: "challenges",
    label: "Challenges · wildcard",
    match: null,
    priority: 0,
    body: "**Where it gets heavy.** Every chart carries friction — yours tends to appear when your inner {{soul_urge}} wants one thing and your outer {{personality}} keeps performing another. Left unattended, that split leaks energy as procrastination or people-pleasing.\n\nThe repair is rarely dramatic. It usually starts with saying the true thing ten seconds earlier than you normally would.",
  },
  {
    section: "teaser_locked",
    label: "Teaser · wildcard",
    match: null,
    priority: 0,
    body: "One more number surfaced while we calculated your chart — a pattern carried from your past that tends to explain a habit you've never had words for. It changes how the rest of your reading lands.\n\nIt's waiting in your emailed full reading.",
  },
  {
    section: "closing_cta",
    label: "Closing · wildcard",
    match: null,
    priority: 0,
    body: "{{first_name}}, this reading is a beginning, not a verdict. Numbers describe the instrument — you decide the music.\n\nYour full reading is on its way to your inbox, and your Personal Year section will keep updating as your cycle turns. Come back to it; it will read differently in a month, because you will be different in a month.",
  },
];

/** Demonstration variants — prove most-specific selection end-to-end. */
export const VARIANT_BLOCKS: BlockSeed[] = [
  {
    section: "opening",
    label: "Opening · stuck",
    match: { current_feeling: ["stuck"] },
    priority: 10,
    body: "That looping feeling you named — the same week repeating in different clothes — usually means a cycle is *finishing*, not failing. Loops tighten right before they release.\n\n{{first_name}}, your numbers below show where this loop wants to break. Notice which section makes your shoulders drop; that's the exit.",
  },
  {
    section: "opening",
    label: "Opening · edge",
    match: { current_feeling: ["edge"] },
    priority: 10,
    body: "You said it yourself: something big feels close. That edge-of-it sensation tends to show up when a Personal Year is changing gears — and yours has more to say about timing than most.\n\nRead on slowly, {{first_name}}. Thresholds reward the people who don't rush them.",
  },
  {
    section: "opening",
    label: "Opening · torn",
    match: { current_feeling: ["torn"] },
    priority: 10,
    body: "Being pulled in two directions isn't indecision, {{first_name}} — it's two true things competing for the same hours. Your chart holds both threads without dropping either.\n\nAs you read, watch how your {{life_path}} energy wants to braid them rather than choose between them.",
  },
  {
    section: "opening",
    label: "Opening · hopeful",
    match: { current_feeling: ["hopeful"] },
    priority: 10,
    body: "Quiet hope is the most honest signal there is — it doesn't perform, it just persists. Your numbers don't need to shout to agree with it.\n\n{{first_name}}, they've been pointing the same direction you've been leaning. Here's the map.",
  },
  {
    section: "life_path_core",
    label: "Life Path 7 core",
    match: { life_path: [7] },
    priority: 10,
    body: "Your Life Path is **7** — the seeker's number. Sevens are born with a question mark where most people carry a period. You don't take reality at face value; you take it apart, quietly, and put it back together in private before you say a word.\n\nPeople may read your silence as distance. It isn't. It's *depth taking its time*. A 7 processes underground: weeks of apparent stillness, then a conclusion that arrives whole, like a spring surfacing far from where the rain fell. The friends who understand this get the best of you; the ones who rush you get the guarded version.\n\nThe 7's gift is discernment — you feel the difference between what's true and what's merely loud. The 7's tax is loneliness *when the door stays shut too long*. You may notice both operating in the same week: proud of your inner world, and quietly wishing someone had the patience to visit it.\n\nWhat tends to change everything for a 7 is choosing, deliberately, a small number of people and pursuits worthy of full access. Not many. A few. Sevens don't scale trust — they concentrate it, and concentrated, it becomes the rarest kind of loyalty there is.\n\nYour remaining numbers show how this seeker's core dresses for the world — and where it goes to rest.",
  },
  {
    section: "focus_bridge",
    label: "Focus bridge · seeker × love",
    match: { life_path_group: ["seeker"], focus_area: ["love"] },
    priority: 10,
    body: "For your love life, a seeker's heart (7s, 11s, 33s) guards its door — not because it feels little, but because it feels *precisely*, and precision is expensive to share.\n\nThe pattern to watch: you may test people with silence and call it patience. The ones worth keeping will knock twice; your work is opening on the second knock instead of the fifth. Depth is your love language — let someone actually read it.",
  },
];

export const OFFERS = [
  {
    placement: "report_end",
    title: "Go deeper: the full Numerology Starter Kit",
    body: "A guided workbook for living with your numbers — monthly cycle prompts, name-change math, and compatibility worksheets. From our partners; we may earn a commission.",
    cta_label: "Explore the kit",
    cta_url: "https://example.com/numerology-kit?tid={{sub_id}}",
    status: "published",
    sort: 1,
  },
];

export const SETTINGS = {
  footer_links: [
    { label: "Privacy", url: "/privacy" },
    { label: "Terms", url: "/terms" },
  ],
  privacy_policy:
    "# Privacy Policy\n\n_Placeholder — owner supplies final text._\n\nWe collect the answers you give in the quiz and the email address you submit, to generate your reading and send it to you. We never sell personal data. To have your data deleted, email us and we will remove your record.\n\nFor entertainment and self-reflection purposes.",
  terms:
    "# Terms of Service\n\n_Placeholder — owner supplies final text._\n\nAstro Note provides readings for entertainment and self-reflection purposes only. They are not medical, financial, or legal advice.",
  cookie_banner:
    "We use one lightweight, cookie-free analytics tool to understand how the site is used. Marketing pixels load only if you accept.",
  support_email: "support@astronote.com",
  social_links: [],
  landing_headline: "Your numbers have been waiting for you.",
  landing_subline:
    "A free, personalized numerology reading — from your name and birth date.",
  landing_cta_label: "Begin my reading",
  landing_trust_row: "2-minute reading · 100% free · No signup to start",
  landing_discover: [
    {
      title: "Your Life Path, decoded",
      body: "The single number your birth date reduces to — and what it says about the direction your life keeps pulling toward.",
    },
    {
      title: "Every letter, weighed",
      body: "Your birth name carries values. Watch them turn into your Expression, Soul Urge, and Personality numbers.",
    },
    {
      title: "The year you're in",
      body: "Your Personal Year sets the season's tempo. Learn what this cycle rewards — and what it quietly resists.",
    },
  ],
};
