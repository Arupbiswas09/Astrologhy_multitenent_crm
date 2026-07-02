# 04 — Numerology Engine Spec (`packages/numerology`)

Pure TypeScript, zero dependencies, 100% unit-tested. System: **Pythagorean** (western
standard, what numerologist.com-style sites use). All functions deterministic.

## 1. Letter values (Pythagorean)
```
1: A J S    2: B K T    3: C L U    4: D M V    5: E N W
6: F O X    7: G P Y    8: H Q Z    9: I R
```
Vowels = A E I O U. **Y rule:** Y counts as a vowel when it is the only vowel-sound in
its syllable / no adjacent vowel (implement pragmatic rule: Y is a vowel if the letters
immediately before and after it are both non-vowels or word boundary). Document the rule
in code; keep it deterministic.

## 2. Reduction
`reduce(n)`: sum digits repeatedly until single digit, **but stop at master numbers
11, 22, 33** (do not reduce them). Karmic debt flags: if any intermediate full sum equals
13, 14, 16, 19 → set flag `karmic_debt: n`.

## 3. Core numbers
- **Life Path** = reduce( reduce(MM) + reduce(DD) + reduce(YYYY) ) — reduce each unit
  first (this preserves master numbers correctly), then sum and reduce.
- **Birthday Number** = reduce(DD) (keep 11/22 if DD is 11, 22, 29→11).
- **Expression (Destiny)** = reduce(sum of all letters of FULL BIRTH NAME).
  Strip diacritics (é→E), ignore non A–Z chars, uppercase.
- **Soul Urge (Heart's Desire)** = reduce(sum of vowels of full birth name).
- **Personality** = reduce(sum of consonants of full birth name).
- **Personal Year** = reduce( reduce(birth MM) + reduce(birth DD) + reduce(CURRENT year) ).
  "Current year" boundary: calendar year (Jan 1). Compute at report render time.
- **Personal Month** = reduce(Personal Year + current month number).

## 4. Output shape
```ts
interface NumerologyProfile {
  lifePath: number; lifePathIsMaster: boolean;
  birthday: number;
  expression: number; soulUrge: number; personality: number;
  personalYear: number; personalMonth: number;
  karmicDebts: number[];           // subset of [13,14,16,19]
  breakdown: {                     // for the "how we calculated" UI moment
    dob: { month: number; day: number; year: number; reducedParts: [number,number,number] };
    nameLetters: { letter: string; value: number; isVowel: boolean }[];
  };
}
computeProfile(input: { fullBirthName: string; dob: string /* YYYY-MM-DD */; now?: Date }): NumerologyProfile
```

## 5. Test vectors (must pass exactly)
| Name | DOB | LifePath | Expression | SoulUrge | Personality |
|---|---|---|---|---|---|
| `JOHN SMITH` | 1990-05-15 | 3 | 8 | 7 | 1 |
| `MARY ANN LEE` | 1988-11-02 | 3 | 8 | 7 | 1 |
| `DAVID MICHAEL BROWN` | 1975-12-29 | 9 | 5 | 6 | 8 |
| `EMMA STONE` | 1988-11-06 | 7 | 3 | 8 | 4 |
| Master check: DOB 1992-11-29 | | 7 *(11+2+... verify: 11 + 29→11 + 1992→3 ⇒ 11+11+3=25→7)* | | | |

⚠️ Before trusting these vectors, RE-DERIVE each by hand in the test file with the
letter table above (show working in comments). If any table value conflicts with your
derivation, the derivation from §1–§3 rules WINS — fix the table, keep rules canonical.
Add extra tests: names with Y (e.g. `LYNN`), hyphens (`MARY-JANE`), diacritics (`JOSÉ`),
DOB on master days (11, 22, 29), karmic debt case (sum 19 → 1 flag), leap day 02-29.

## 6. Meaning lookup (data, not code)
Number meanings live in `content_blocks` (CMS), NOT in the engine. The engine only
returns numbers + flags. Composer maps them to content.
