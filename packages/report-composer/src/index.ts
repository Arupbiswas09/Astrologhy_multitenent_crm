/**
 * Report composer — selects content blocks per section and interpolates
 * variables (docs/06-REPORT-CONTENT-SYSTEM.md §3–§4). Pure and deterministic:
 * same lead data + same blocks → same report, always.
 */

import type { NumerologyProfile } from "@astro-note/numerology";

// ── sections (render order = docs/06 §1) ────────────────────────────────────

export const SECTION_ORDER = [
  "opening",
  "feeling_mirror",
  "life_path_core",
  "expression",
  "soul_urge",
  "personality",
  "focus_bridge",
  "relationship_lens",
  "personal_year",
  "teaser_locked",
  "strengths",
  "challenges",
  "closing_cta",
] as const;

export type ReportSection = (typeof SECTION_ORDER)[number];

// ── life path groups (docs/06 §2) ───────────────────────────────────────────

export type LifePathGroup = "dynamic" | "relational" | "builder" | "seeker";

const GROUPS: Record<LifePathGroup, number[]> = {
  dynamic: [1, 3, 5],
  relational: [2, 6, 9],
  builder: [4, 8, 22],
  seeker: [7, 11, 33],
};

export function lifePathGroup(lifePath: number): LifePathGroup {
  for (const [group, values] of Object.entries(GROUPS) as [LifePathGroup, number[]][]) {
    if (values.includes(lifePath)) return group;
  }
  // Unreachable for engine output (1-9, 11, 22, 33); safe default for garbage.
  return "seeker";
}

// ── block matching ───────────────────────────────────────────────────────────

export interface ComposerBlock {
  id: string;
  section: string;
  match: Record<string, Array<string | number | boolean>> | null;
  priority: number;
  body: string;
  visual_key?: string | null;
}

export interface ComposeInput {
  blocks: ComposerBlock[];
  profile: NumerologyProfile;
  answers: Record<string, string>;
  firstName: string;
  /** Human label of the chosen focus area (from the CMS quiz options). */
  focusAreaLabel: string;
  /** Render time — drives personal year/month + {{current_year}}. */
  now?: Date;
}

export interface ComposedSection {
  section: ReportSection;
  blockId: string | null;
  /** Interpolated markdown (render with a strict-allowlist renderer). */
  body: string;
  visualKey: string | null;
}

export interface ComposedReport {
  sections: ComposedSection[];
  /** The values interpolation used — persisted context for debugging. */
  context: Record<string, string>;
}

function digitSum(n: number): number {
  let sum = 0;
  for (let rest = n; rest > 0; rest = Math.floor(rest / 10)) sum += rest % 10;
  return sum;
}

/** Values a block's `match` keys are compared against (all normalized to string). */
export function buildMatchContext(
  profile: NumerologyProfile,
  answers: Record<string, string>,
): Record<string, string> {
  return {
    life_path: String(profile.lifePath),
    life_path_group: lifePathGroup(profile.lifePath),
    expression: String(profile.expression),
    soul_urge: String(profile.soulUrge),
    personality: String(profile.personality),
    birthday: String(profile.birthday),
    personal_year: String(profile.personalYear),
    is_master: String(profile.lifePathIsMaster),
    has_karmic_debt: String(profile.karmicDebts.length > 0),
    focus_area: answers.focus_area ?? "",
    current_feeling: answers.current_feeling ?? "",
    relationship_status: answers.relationship_status ?? "",
    belief_level: answers.belief_level ?? "",
    gender: answers.gender ?? "",
  };
}

function keyMatches(key: string, allowed: Array<string | number | boolean>, ctx: Record<string, string>): boolean {
  const value = ctx[key];
  if (value === undefined) return false;
  const normalized = allowed.map(String);
  if (normalized.includes(value)) return true;
  // DECISION: master personal years (11/22/33) also match their reduced digit
  // (11→2, 22→4, 33→6) — content inventories carry 9 personal-year variants
  // (docs/06 §2), so masters would otherwise always fall to the wildcard.
  if (key === "personal_year" && ["11", "22", "33"].includes(value)) {
    return normalized.includes(String(digitSum(Number(value))));
  }
  return false;
}

/**
 * docs/06 §3: filter blocks where EVERY match key includes the lead's value
 * (missing key = wildcard) → score = matched key count → highest score wins,
 * tie-break by priority (higher wins), then lowest id (stable).
 */
export function selectBlock(
  blocks: ComposerBlock[],
  section: string,
  ctx: Record<string, string>,
): ComposerBlock | null {
  let best: { block: ComposerBlock; score: number } | null = null;

  for (const block of blocks) {
    if (block.section !== section) continue;
    const entries = Object.entries(block.match ?? {});
    let score = 0;
    let eligible = true;
    for (const [key, allowed] of entries) {
      if (!Array.isArray(allowed) || allowed.length === 0) continue; // treat as wildcard key
      if (keyMatches(key, allowed, ctx)) {
        score++;
      } else {
        eligible = false;
        break;
      }
    }
    if (!eligible) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && block.priority > best.block.priority) ||
      (score === best.score && block.priority === best.block.priority && block.id < best.block.id)
    ) {
      best = { block, score };
    }
  }
  return best?.block ?? null;
}

// ── interpolation (docs/06 §4) ───────────────────────────────────────────────

const TOKEN_RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function interpolate(body: string, vars: Record<string, string>): string {
  return body.replace(TOKEN_RE, (_whole, token: string) => vars[token] ?? "");
}

// ── compose ──────────────────────────────────────────────────────────────────

export function composeReport(input: ComposeInput): ComposedReport {
  const now = input.now ?? new Date();
  const ctx = buildMatchContext(input.profile, input.answers);

  const vars: Record<string, string> = {
    first_name: input.firstName,
    life_path: String(input.profile.lifePath),
    expression: String(input.profile.expression),
    soul_urge: String(input.profile.soulUrge),
    personality: String(input.profile.personality),
    personal_year: String(input.profile.personalYear),
    focus_area_label: input.focusAreaLabel,
    current_year: String(now.getUTCFullYear()),
  };

  const sections: ComposedSection[] = SECTION_ORDER.map((section) => {
    const block = selectBlock(input.blocks, section, ctx);
    return {
      section,
      blockId: block?.id ?? null,
      body: block ? interpolate(block.body, vars) : "",
      visualKey: block?.visual_key ?? null,
    };
  });

  return { sections, context: { ...ctx, ...vars } };
}
