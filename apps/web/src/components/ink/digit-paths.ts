/**
 * Hand-drawn single-stroke numeral paths — the "Living Number" signature
 * element (docs/07 §4). Drawn on a 100×140 box, monoline with round caps;
 * the wobble is baked into the path data (no runtime filters — cheaper).
 * Master numbers (11/22/33) render as two digits side by side.
 */

export const DIGIT_W = 100;
export const DIGIT_H = 140;

export const DIGIT_PATHS: Record<string, string> = {
  "0": "M50,17 Q28,20 27,68 Q27,119 50,121 Q73,122 73,69 Q72,20 50,17",
  "1": "M36,36 Q46,28 55,17 Q54,60 54,90 Q55,110 56,123",
  "2": "M29,40 Q28,18 50,16 Q73,15 73,36 Q73,56 54,74 Q37,90 30,117 Q52,113 74,115",
  "3": "M31,29 Q45,13 61,19 Q75,25 70,43 Q66,59 50,63 Q70,65 73,86 Q76,110 57,119 Q39,127 28,111",
  "4": "M60,17 Q45,55 29,86 L76,87 M61,58 Q61,90 62,124",
  "5": "M69,18 L37,19 Q35,40 32,58 Q47,52 58,56 Q75,62 73,86 Q71,112 50,119 Q34,124 27,109",
  "6": "M62,17 Q45,32 37,55 Q29,77 33,98 Q38,121 58,120 Q76,118 75,96 Q74,75 56,72 Q40,70 35,85",
  "7": "M28,21 Q50,18 74,20 Q60,60 50,90 Q46,105 44,123",
  "8": "M50,63 Q31,55 32,36 Q33,17 50,17 Q67,17 68,36 Q69,55 50,63 Q28,71 28,95 Q28,121 50,121 Q72,121 72,95 Q72,71 50,63",
  "9": "M67,42 Q66,64 47,68 Q28,71 27,47 Q27,21 49,18 Q69,16 69,42 Q69,80 63,99 Q59,112 53,122",
};

/** Sketchy encircling ellipse with overshoot, parametric in content width. */
export function ellipsePath(w: number): string {
  const cx = Math.round(w / 2);
  return [
    `M${w - 6},72`,
    `Q${w + 4},26 ${cx + 8},19`,
    `Q${6},10 ${5},64`,
    `Q${4},108 ${cx - 6},119`,
    `Q${w + 8},130 ${w - 1},84`,
    `Q${w - 3},58 ${w - 17},44`,
  ].join(" ");
}

/** Margin-note constellation dot positions (deterministic) for a w×140 box. */
export function constellationDots(w: number): Array<[number, number]> {
  const rel: Array<[number, number]> = [
    [0.08, 0.14],
    [0.9, 0.08],
    [1.04, 0.44],
    [0.86, 0.9],
    [0.12, 0.86],
    [-0.06, 0.4],
    [0.32, 0.02],
  ];
  return rel.map(([fx, fy]) => [Math.round(fx * w), Math.round(fy * DIGIT_H)]);
}

/** Which dots connect (indexes into constellationDots) — sparse, margin-note feel. */
export const DOT_LINKS: Array<[number, number]> = [
  [0, 6],
  [6, 1],
  [1, 2],
  [3, 4],
];

/** Digits used to render a value: 3 → ["3"], 22 → ["2","2"]. */
export function digitsOf(value: number): string[] {
  return String(Math.abs(Math.trunc(value))).split("");
}
