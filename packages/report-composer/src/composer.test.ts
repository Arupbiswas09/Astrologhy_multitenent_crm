import { describe, expect, it } from "vitest";
import { computeProfile } from "@astro-note/numerology";
import {
  SECTION_ORDER,
  buildMatchContext,
  composeReport,
  interpolate,
  lifePathGroup,
  selectBlock,
  type ComposerBlock,
} from "./index";

const NOW = new Date(Date.UTC(2026, 6, 3));

// EMMA STONE 1988-11-06 → LP 7 (seeker), Expression 33, SoulUrge 8, Personality 7
const profile = computeProfile({ fullBirthName: "EMMA STONE", dob: "1988-11-06", now: NOW });
const answers = {
  focus_area: "love",
  current_feeling: "edge",
  relationship_status: "single",
  belief_level: "curious",
};
const ctx = buildMatchContext(profile, answers);

function block(partial: Partial<ComposerBlock> & { id: string; section: string }): ComposerBlock {
  return { match: null, priority: 0, body: "", visual_key: null, ...partial };
}

describe("lifePathGroup (docs/06 §2)", () => {
  it("maps every engine output to a group", () => {
    expect(lifePathGroup(1)).toBe("dynamic");
    expect(lifePathGroup(3)).toBe("dynamic");
    expect(lifePathGroup(5)).toBe("dynamic");
    expect(lifePathGroup(2)).toBe("relational");
    expect(lifePathGroup(6)).toBe("relational");
    expect(lifePathGroup(9)).toBe("relational");
    expect(lifePathGroup(4)).toBe("builder");
    expect(lifePathGroup(8)).toBe("builder");
    expect(lifePathGroup(22)).toBe("builder");
    expect(lifePathGroup(7)).toBe("seeker");
    expect(lifePathGroup(11)).toBe("seeker");
    expect(lifePathGroup(33)).toBe("seeker");
  });
});

describe("selectBlock — docs/06 §3 exact semantics", () => {
  it("picks the most specific matching block over less specific and wildcard", () => {
    const blocks = [
      block({ id: "w", section: "focus_bridge" }), // wildcard
      block({ id: "lp", section: "focus_bridge", match: { life_path: [7] } }),
      block({
        id: "lp-love",
        section: "focus_bridge",
        match: { life_path_group: ["seeker"], focus_area: ["love"] },
      }),
    ];
    expect(selectBlock(blocks, "focus_bridge", ctx)?.id).toBe("lp-love");
  });

  it("excludes blocks where any key fails, even if others match", () => {
    const blocks = [
      block({ id: "w", section: "opening" }),
      block({
        id: "wrong",
        section: "opening",
        match: { life_path: [7], focus_area: ["money"] }, // focus_area fails
      }),
    ];
    expect(selectBlock(blocks, "opening", ctx)?.id).toBe("w");
  });

  it("breaks score ties by priority (higher wins), then lowest id", () => {
    const byPriority = [
      block({ id: "a", section: "s", match: { life_path: [7] }, priority: 1 }),
      block({ id: "b", section: "s", match: { life_path: [7] }, priority: 9 }),
    ];
    expect(selectBlock(byPriority, "s", ctx)?.id).toBe("b");

    const byId = [
      block({ id: "bbb", section: "s", match: { life_path: [7] }, priority: 5 }),
      block({ id: "aaa", section: "s", match: { life_path: [7] }, priority: 5 }),
    ];
    expect(selectBlock(byId, "s", ctx)?.id).toBe("aaa");
  });

  it("falls back to the wildcard when nothing matches, null when section empty", () => {
    const blocks = [block({ id: "w", section: "s" })];
    expect(selectBlock(blocks, "s", { ...ctx, life_path: "4" })?.id).toBe("w");
    expect(selectBlock(blocks, "other", ctx)).toBeNull();
  });

  it("matches numbers and strings interchangeably", () => {
    const blocks = [
      block({ id: "n", section: "s", match: { life_path: ["7"] } }), // string in CMS
    ];
    expect(selectBlock(blocks, "s", ctx)?.id).toBe("n");
  });

  it("master personal years also match their reduced digit (11→2)", () => {
    const blocks = [
      block({ id: "py2", section: "personal_year", match: { personal_year: [2] } }),
      block({ id: "w", section: "personal_year" }),
    ];
    const masterCtx = { ...ctx, personal_year: "11" };
    expect(selectBlock(blocks, "personal_year", masterCtx)?.id).toBe("py2");
  });
});

describe("interpolate (docs/06 §4)", () => {
  it("replaces known tokens and strips unknown ones", () => {
    expect(
      interpolate("{{first_name}} is a {{life_path}} · {{evil_token}} ok", {
        first_name: "Emma",
        life_path: "7",
      }),
    ).toBe("Emma is a 7 ·  ok");
  });

  it("tolerates whitespace inside braces", () => {
    expect(interpolate("{{ first_name }}", { first_name: "Emma" })).toBe("Emma");
  });
});

describe("composeReport", () => {
  const blocks: ComposerBlock[] = [
    ...SECTION_ORDER.map((s) => block({ id: `w-${s}`, section: s, body: `[${s}] wildcard` })),
    block({
      id: "lp7",
      section: "life_path_core",
      match: { life_path: [7] },
      body: "{{first_name}}, you are a Life Path {{life_path}} in {{current_year}}.",
    }),
  ];

  it("returns sections in docs/06 §1 order with the most specific bodies", () => {
    const report = composeReport({
      blocks,
      profile,
      answers,
      firstName: "Emma",
      focusAreaLabel: "love & relationships",
      now: NOW,
    });
    expect(report.sections.map((s) => s.section)).toEqual([...SECTION_ORDER]);
    const core = report.sections.find((s) => s.section === "life_path_core");
    expect(core?.blockId).toBe("lp7");
    expect(core?.body).toBe("Emma, you are a Life Path 7 in 2026.");
    const opening = report.sections.find((s) => s.section === "opening");
    expect(opening?.blockId).toBe("w-opening");
  });

  it("is deterministic — same input, same output", () => {
    const run = () =>
      composeReport({
        blocks,
        profile,
        answers,
        firstName: "Emma",
        focusAreaLabel: "love & relationships",
        now: NOW,
      });
    expect(run()).toEqual(run());
  });
});
