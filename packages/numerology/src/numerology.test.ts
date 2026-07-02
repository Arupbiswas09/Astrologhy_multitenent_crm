import { describe, expect, it } from "vitest";
import {
  analyzeName,
  computeProfile,
  isMasterNumber,
  letterValue,
  reduceWithTrace,
} from "./index";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HAND DERIVATIONS (docs/04-NUMEROLOGY-ENGINE.md §5 requires re-deriving every
 * vector from the §1–§3 rules before trusting the table; where the doc's table
 * conflicts with the rules, THE RULES WIN and the table is treated as corrected)
 *
 * Pythagorean letter values:
 *   1: A J S   2: B K T   3: C L U   4: D M V   5: E N W
 *   6: F O X   7: G P Y   8: H Q Z   9: I R
 *
 * Y rule (doc §1, pragmatic + deterministic): Y is a VOWEL when the letters
 * immediately before and after it (within its word) are both non-vowels
 * (A E I O U) or a word boundary. Otherwise Y is a consonant.
 *
 * reduce(n): repeatedly sum digits; STOP at master numbers 11/22/33.
 * Karmic debt: any value appearing in a birth-derived reduction chain equal to
 * 13 / 14 / 16 / 19 sets that flag.
 *
 * ── JOHN SMITH · 1990-05-15 ─────────────────────────────────────────────────
 * JOHN  = J1+O6+H8+N5            = 20
 * SMITH = S1+M4+I9+T2+H8         = 24     → all letters 44 → 4+4=8
 *   Expression 8  (doc table 8 ✓)
 * vowels O6+I9                   = 15 → 6
 *   Soul Urge 6   (doc table said 7 — conflicts with §1–§3, corrected to 6)
 * consonants J1+H8+N5+S1+M4+T2+H8= 29 → 2+9 = 11 → MASTER, stop
 *   Personality 11 (doc table said 1 — corrected: 29 reduces to master 11)
 * Life Path: reduce(05)=5, reduce(15)=6, reduce(1990): 1990→19→10→1
 *   5+6+1 = 12 → 3  (doc table 3 ✓)   year chain hits 19 → karmic debt [19]
 * Birthday: reduce(15) = 6
 *
 * ── MARY ANN LEE · 1988-11-02 ───────────────────────────────────────────────
 * MARY = M4+A1+R9+Y7 = 21   (Y after R/word-end → VOWEL)
 * ANN  = A1+N5+N5    = 11
 * LEE  = L3+E5+E5    = 13   → all letters 45 → 9
 *   Expression 9  (doc table said 8 — corrected)
 * vowels A1+Y7+A1+E5+E5 = 19 → 10 → 1  (chain hits 19 → karmic)
 *   Soul Urge 1   (doc table said 7 — corrected)
 * consonants M4+R9+N5+N5+L3 = 26 → 8
 *   Personality 8 (doc table said 1 — corrected)
 * Life Path: reduce(11)=11 (master), reduce(02)=2, reduce(1988)=26→8
 *   11+2+8 = 21 → 3  (doc table 3 ✓)
 * Birthday: 2 · karmic [19]
 *
 * ── DAVID MICHAEL BROWN · 1975-12-29 ────────────────────────────────────────
 * DAVID   = D4+A1+V4+I9+D4       = 22
 * MICHAEL = M4+I9+C3+H8+A1+E5+L3 = 33
 * BROWN   = B2+R9+O6+W5+N5       = 27    → all letters 82 → 10 → 1
 *   Expression 1  (doc table said 5 — corrected)
 * vowels A1+I9+I9+A1+E5+O6 = 31 → 4
 *   Soul Urge 4   (doc table said 6 — corrected)
 * consonants D4+V4+D4+M4+C3+H8+L3+B2+R9+W5+N5 = 51 → 6
 *   Personality 6 (doc table said 8 — corrected)
 * Life Path: reduce(12)=3, reduce(29)=11 (master), reduce(1975)=22 (master)
 *   3+11+22 = 36 → 9  (doc table 9 ✓)
 * Birthday: reduce(29) = 11 (master kept, doc §3 "29→11") · karmic []
 *
 * ── EMMA STONE · 1988-11-06 ─────────────────────────────────────────────────
 * EMMA  = E5+M4+M4+A1    = 14
 * STONE = S1+T2+O6+N5+E5 = 19   → all letters 33 → MASTER, stop
 *   Expression 33 (doc table said 3 — corrected: masters are never reduced)
 * vowels E5+A1+O6+E5 = 17 → 8
 *   Soul Urge 8   (doc table 8 ✓)
 * consonants M4+M4+S1+T2+N5 = 16 → 7  (chain hits 16 → karmic)
 *   Personality 7 (doc table said 4 — corrected)
 * Life Path: 11 + 6 + reduce(1988)=8 → 25 → 7  (doc table 7 ✓) · karmic [16]
 *
 * ── Master DOB check · 1992-11-29 (doc's own worked example) ────────────────
 * reduce(11)=11, reduce(29)=11, reduce(1992)=21→3 → 11+11+3 = 25 → 7 ✓
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NOW = new Date(Date.UTC(2026, 6, 3)); // 2026-07-03, fixed for determinism

describe("letter values (§1)", () => {
  it("maps every letter to its Pythagorean value", () => {
    const table: Record<number, string> = {
      1: "AJS",
      2: "BKT",
      3: "CLU",
      4: "DMV",
      5: "ENW",
      6: "FOX",
      7: "GPY",
      8: "HQZ",
      9: "IR",
    };
    for (const [value, letters] of Object.entries(table)) {
      for (const letter of letters) {
        expect(letterValue(letter), `value of ${letter}`).toBe(Number(value));
      }
    }
  });

  it("is case-insensitive and rejects non-letters", () => {
    expect(letterValue("g")).toBe(7);
    expect(() => letterValue("3")).toThrow(RangeError);
    expect(() => letterValue("!")).toThrow(RangeError);
    expect(() => letterValue("")).toThrow(RangeError);
  });
});

describe("reduceWithTrace (§2)", () => {
  it("reduces to a single digit and records the chain", () => {
    expect(reduceWithTrace(1990)).toEqual({ value: 1, chain: [1990, 19, 10, 1] });
  });

  it("stops at master numbers 11, 22, 33", () => {
    expect(reduceWithTrace(29).value).toBe(11);
    expect(reduceWithTrace(1975).value).toBe(22);
    expect(reduceWithTrace(33).value).toBe(33);
    expect(reduceWithTrace(11).chain).toEqual([11]);
  });

  it("returns single digits unchanged", () => {
    expect(reduceWithTrace(7)).toEqual({ value: 7, chain: [7] });
    expect(reduceWithTrace(0)).toEqual({ value: 0, chain: [0] });
  });

  it("rejects negative or fractional input", () => {
    expect(() => reduceWithTrace(-1)).toThrow(RangeError);
    expect(() => reduceWithTrace(1.5)).toThrow(RangeError);
  });

  it("identifies master numbers", () => {
    expect(isMasterNumber(11)).toBe(true);
    expect(isMasterNumber(22)).toBe(true);
    expect(isMasterNumber(33)).toBe(true);
    expect(isMasterNumber(44)).toBe(false);
    expect(isMasterNumber(9)).toBe(false);
  });
});

describe("Y vowel rule (§1)", () => {
  const vowelsOf = (name: string) =>
    analyzeName(name)
      .letters.filter((l) => l.isVowel)
      .map((l) => l.letter)
      .join("");

  it("Y between consonants is a vowel (LYNN)", () => {
    expect(vowelsOf("LYNN")).toBe("Y");
  });

  it("Y at word end after a consonant is a vowel (MARY)", () => {
    expect(vowelsOf("MARY")).toBe("AY");
  });

  it("Y between vowels is a consonant (MAYA)", () => {
    expect(vowelsOf("MAYA")).toBe("AA");
  });

  it("Y before a vowel at word start is a consonant (YOLANDA)", () => {
    expect(vowelsOf("YOLANDA")).toBe("OAA");
  });

  it("Y at word start before a consonant is a vowel (YVONNE)", () => {
    expect(vowelsOf("YVONNE")).toBe("YOE");
  });
});

describe("name normalization (§3)", () => {
  it("strips diacritics: JOSÉ → JOSE", () => {
    const a = analyzeName("JOSÉ");
    expect(a.letters.map((l) => l.letter).join("")).toBe("JOSE");
    expect(a.total).toBe(13); // J1+O6+S1+E5
  });

  it("ignores non A–Z characters and treats them as word boundaries", () => {
    // O'BRIEN → words O + BRIEN; letters unchanged
    const a = analyzeName("O'Brien");
    expect(a.letters.map((l) => l.letter).join("")).toBe("OBRIEN");
    expect(a.total).toBe(6 + 2 + 9 + 9 + 5 + 5);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(analyzeName("  john   SMITH ")).toEqual(analyzeName("JOHN SMITH"));
  });

  it("hyphens split words, affecting the Y rule (MARY-JANE: Y at word end → vowel)", () => {
    const a = analyzeName("MARY-JANE");
    const y = a.letters.find((l) => l.letter === "Y");
    expect(y?.isVowel).toBe(true);
    expect(a.total).toBe(33); // MARY 21 + JANE 12
  });
});

describe("computeProfile — doc §5 vectors (corrected by hand derivation above)", () => {
  it("JOHN SMITH · 1990-05-15", () => {
    const p = computeProfile({ fullBirthName: "JOHN SMITH", dob: "1990-05-15", now: NOW });
    expect(p.lifePath).toBe(3);
    expect(p.lifePathIsMaster).toBe(false);
    expect(p.expression).toBe(8);
    expect(p.soulUrge).toBe(6);
    expect(p.personality).toBe(11);
    expect(p.birthday).toBe(6);
    expect(p.karmicDebts).toEqual([19]); // 1990 → 19 in the year chain
    expect(p.breakdown.dob).toEqual({
      month: 5,
      day: 15,
      year: 1990,
      reducedParts: [5, 6, 1],
    });
    expect(p.breakdown.nameLetters).toEqual([
      { letter: "J", value: 1, isVowel: false },
      { letter: "O", value: 6, isVowel: true },
      { letter: "H", value: 8, isVowel: false },
      { letter: "N", value: 5, isVowel: false },
      { letter: "S", value: 1, isVowel: false },
      { letter: "M", value: 4, isVowel: false },
      { letter: "I", value: 9, isVowel: true },
      { letter: "T", value: 2, isVowel: false },
      { letter: "H", value: 8, isVowel: false },
    ]);
  });

  it("MARY ANN LEE · 1988-11-02", () => {
    const p = computeProfile({ fullBirthName: "Mary Ann Lee", dob: "1988-11-02", now: NOW });
    expect(p.lifePath).toBe(3);
    expect(p.expression).toBe(9);
    expect(p.soulUrge).toBe(1);
    expect(p.personality).toBe(8);
    expect(p.birthday).toBe(2);
    expect(p.karmicDebts).toEqual([19]); // vowel sum 19
  });

  it("DAVID MICHAEL BROWN · 1975-12-29", () => {
    const p = computeProfile({
      fullBirthName: "DAVID MICHAEL BROWN",
      dob: "1975-12-29",
      now: NOW,
    });
    expect(p.lifePath).toBe(9);
    expect(p.expression).toBe(1);
    expect(p.soulUrge).toBe(4);
    expect(p.personality).toBe(6);
    expect(p.birthday).toBe(11); // 29 → 11, master kept
    expect(p.karmicDebts).toEqual([]);
    expect(p.breakdown.dob.reducedParts).toEqual([3, 11, 22]);
  });

  it("EMMA STONE · 1988-11-06 (master Expression 33 preserved)", () => {
    const p = computeProfile({ fullBirthName: "EMMA STONE", dob: "1988-11-06", now: NOW });
    expect(p.lifePath).toBe(7);
    expect(p.expression).toBe(33);
    expect(p.soulUrge).toBe(8);
    expect(p.personality).toBe(7);
    expect(p.karmicDebts).toEqual([16]); // consonant sum 16
  });

  it("master-day DOB 1992-11-29 → Life Path 7 via 11+11+3=25 (doc worked example)", () => {
    const p = computeProfile({ fullBirthName: "ANY NAME", dob: "1992-11-29", now: NOW });
    expect(p.breakdown.dob.reducedParts).toEqual([11, 11, 3]);
    expect(p.lifePath).toBe(7);
    expect(p.lifePathIsMaster).toBe(false);
  });

  it("master Life Path is preserved and flagged (1985-04-11 → 4+2+23→5 … pick 1983-08-11: 8+2+21→3 …)", () => {
    // Construct a true master LP: 1970-11-27 → 11 + (27→9) + (1970→17→8) = 28 → 10 → 1. No.
    // 1965-05-06 → 5+6+(1965→21→3)=14→5. No. Use 1948-03-08:
    //   3 + 8 + (1948→22 master) = 33 → MASTER 33 life path.
    const p = computeProfile({ fullBirthName: "ANY NAME", dob: "1948-03-08", now: NOW });
    expect(p.breakdown.dob.reducedParts).toEqual([3, 8, 22]);
    expect(p.lifePath).toBe(33);
    expect(p.lifePathIsMaster).toBe(true);
  });
});

describe("karmic debt flags (§2)", () => {
  it("flags 13 from a consonant chain (LYNN: L+N+N = 13)", () => {
    const p = computeProfile({ fullBirthName: "LYNN", dob: "2000-01-01", now: NOW });
    expect(p.personality).toBe(4);
    expect(p.soulUrge).toBe(7); // Y is the only vowel
    expect(p.expression).toBe(2); // 20 → 2
    expect(p.karmicDebts).toEqual([13]);
  });

  it("flags 14 and 19 (MARY-JANE vowels 14, consonants 19) and keeps master Expression 33", () => {
    const p = computeProfile({ fullBirthName: "MARY-JANE", dob: "2000-01-01", now: NOW });
    expect(p.expression).toBe(33);
    expect(p.soulUrge).toBe(5);
    expect(p.personality).toBe(1);
    expect(p.karmicDebts).toEqual([14, 19]);
  });

  it("flags 13 from the full-name chain and returns master Soul Urge (JOSÉ: 13 total, vowels 11)", () => {
    const p = computeProfile({ fullBirthName: "José", dob: "2000-01-01", now: NOW });
    expect(p.expression).toBe(4);
    expect(p.soulUrge).toBe(11);
    expect(p.personality).toBe(2);
    expect(p.karmicDebts).toContain(13);
  });

  it("flags 19 when born on the 19th (birthday chain)", () => {
    const p = computeProfile({ fullBirthName: "ANY NAME", dob: "1985-03-19", now: NOW });
    expect(p.birthday).toBe(1); // 19 → 10 → 1
    expect(p.karmicDebts).toContain(19);
    expect(p.lifePath).toBe(9); // 3 + 1 + (1985→23→5) = 9
  });

  it("does NOT derive karmic flags from time-varying personal year/month chains", () => {
    // Personal year chain for birth 03-05 in 2027: 3+5+(2027→11)=19 → would flag 19
    // if PY chains counted. Karmic debts must be stable birth facts.
    const p = computeProfile({
      fullBirthName: "AA", // letters sum 2 — no karmic anywhere in birth chains
      dob: "2000-03-05",
      now: new Date(Date.UTC(2027, 5, 15)),
    });
    expect(p.karmicDebts).toEqual([]);
  });
});

describe("personal year / month (§3)", () => {
  it("computes PY from birth month/day + current calendar year", () => {
    // birth 05-15, year 2026: 5 + 6 + (2026→10→1) = 12 → 3; July → 3+7=10 → 1
    const p = computeProfile({
      fullBirthName: "JOHN SMITH",
      dob: "1990-05-15",
      now: new Date(Date.UTC(2026, 6, 15)),
    });
    expect(p.personalYear).toBe(3);
    expect(p.personalMonth).toBe(1);
  });

  it("uses the calendar-year boundary (Dec 31 vs Jan 1)", () => {
    const dec = computeProfile({
      fullBirthName: "JOHN SMITH",
      dob: "1990-05-15",
      now: new Date(Date.UTC(2025, 11, 31)),
    });
    const jan = computeProfile({
      fullBirthName: "JOHN SMITH",
      dob: "1990-05-15",
      now: new Date(Date.UTC(2026, 0, 1)),
    });
    expect(dec.personalYear).toBe(2); // 5+6+(2025→9) = 20 → 2
    expect(jan.personalYear).toBe(3);
  });

  it("preserves master personal years", () => {
    // birth 09-01 in 2026: 9 + 1 + 1 = 11 → master kept
    const p = computeProfile({
      fullBirthName: "ANY NAME",
      dob: "1990-09-01",
      now: new Date(Date.UTC(2026, 3, 10)),
    });
    expect(p.personalYear).toBe(11);
    expect(p.personalMonth).toBe(6); // 11 + 4 = 15 → 6
  });
});

describe("input validation & determinism", () => {
  it("accepts the leap day", () => {
    const p = computeProfile({ fullBirthName: "ANY NAME", dob: "1996-02-29", now: NOW });
    expect(p.lifePath).toBe(2); // 2 + 11 + (1996→25→7) = 20 → 2
    expect(p.birthday).toBe(11);
  });

  it("rejects malformed or impossible dates", () => {
    expect(() => computeProfile({ fullBirthName: "A B", dob: "1995-2-9", now: NOW })).toThrow();
    expect(() => computeProfile({ fullBirthName: "A B", dob: "1995-13-01", now: NOW })).toThrow();
    expect(() => computeProfile({ fullBirthName: "A B", dob: "1995-02-30", now: NOW })).toThrow();
    expect(() => computeProfile({ fullBirthName: "A B", dob: "1997-02-29", now: NOW })).toThrow();
    expect(() => computeProfile({ fullBirthName: "A B", dob: "not-a-date", now: NOW })).toThrow();
  });

  it("rejects names without any A–Z letters", () => {
    expect(() => computeProfile({ fullBirthName: "123 !!", dob: "1990-05-15", now: NOW })).toThrow();
    expect(() => computeProfile({ fullBirthName: "   ", dob: "1990-05-15", now: NOW })).toThrow();
  });

  it("defaults `now` to the current date for personal year/month", () => {
    const p = computeProfile({ fullBirthName: "JOHN SMITH", dob: "1990-05-15" });
    expect(p.personalYear).toBeGreaterThanOrEqual(1);
    expect(p.personalMonth).toBeGreaterThanOrEqual(1);
    // Birth-derived numbers are unaffected by `now`
    expect(p.lifePath).toBe(3);
    expect(p.expression).toBe(8);
  });

  it("same input → same output, always", () => {
    const run = () =>
      computeProfile({ fullBirthName: "Emma Stone", dob: "1988-11-06", now: NOW });
    expect(run()).toEqual(run());
  });
});
