import { describe, expect, it } from "vitest";
import { deriveFirstName, interpolateQuizCopy } from "./interpolate";
import { formatDob, validateDob, validateEmail, validateFullName } from "./quiz-validation";

describe("validateDob", () => {
  it("accepts real dates inside the year range", () => {
    expect(validateDob({ year: 1990, month: 5, day: 15 })).toBeNull();
    expect(validateDob({ year: 1996, month: 2, day: 29 })).toBeNull(); // leap day
  });

  it("rejects impossible dates", () => {
    expect(validateDob({ year: 1990, month: 2, day: 30 })).toMatch(/doesn't exist/);
    expect(validateDob({ year: 1997, month: 2, day: 29 })).toMatch(/doesn't exist/);
  });

  it("enforces the CMS year range (docs/05: 1920–2015)", () => {
    expect(validateDob({ year: 1919, month: 1, day: 1 })).toMatch(/between 1920 and 2015/);
    expect(validateDob({ year: 2016, month: 1, day: 1 })).toMatch(/between/);
    expect(
      validateDob({ year: 2018, month: 1, day: 1 }, { min_year: 1900, max_year: 2020 }),
    ).toBeNull();
  });

  it("formats zero-padded YYYY-MM-DD", () => {
    expect(formatDob({ year: 1990, month: 5, day: 3 })).toBe("1990-05-03");
  });
});

describe("validateFullName", () => {
  it("requires at least two words with letters", () => {
    expect(validateFullName("Maria Carter")).toBeNull();
    expect(validateFullName("  Mary-Jane   Lee ")).toBeNull();
    expect(validateFullName("Maria")).toMatch(/full birth name/);
    expect(validateFullName("")).toMatch(/stays private/);
    expect(validateFullName("123 456")).toMatch(/full birth name/);
  });

  it("enforces max length", () => {
    expect(validateFullName("a".repeat(50) + " " + "b".repeat(50))).toMatch(/under 80/);
  });
});

describe("validateEmail", () => {
  it("accepts normal addresses and rejects junk", () => {
    expect(validateEmail("reader@example.com")).toBeNull();
    expect(validateEmail("a.b+c@sub.domain.co")).toBeNull();
    expect(validateEmail("")).toMatch(/unlock/);
    expect(validateEmail("nope")).toMatch(/doesn't look right/);
    expect(validateEmail("a@b")).toMatch(/doesn't look right/);
    expect(validateEmail("a @b.com")).toMatch(/doesn't look right/);
  });
});

describe("deriveFirstName / interpolateQuizCopy", () => {
  it("title-cases the first word", () => {
    expect(deriveFirstName("maria louise carter")).toBe("Maria");
    expect(deriveFirstName("MARY-JANE lee")).toBe("Mary-jane");
    expect(deriveFirstName("  ")).toBeNull();
  });

  it("interpolates {{first_name}} when known", () => {
    expect(interpolateQuizCopy("{{first_name}}, what's calling?", "Maria")).toBe(
      "Maria, what's calling?",
    );
  });

  it("degrades gracefully when unknown", () => {
    expect(interpolateQuizCopy("{{first_name}}, what's calling?", null)).toBe("What's calling?");
    expect(interpolateQuizCopy("Weighing every letter of {{first_name}}…", null)).toBe(
      "Weighing every letter of you…",
    );
    expect(interpolateQuizCopy("No tokens here", null)).toBe("No tokens here");
  });
});
