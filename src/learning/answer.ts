// Grading of free answers (typed or spoken). Pure functions, unit tested.

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length]!;
}

export type Grade = 'exact' | 'typo' | 'wrong';

/** A typed answer: exact, a small typo (1 edit, 2 for long answers), or wrong. */
export function gradeTyped(answer: string, expected: string): Grade {
  const a = normalize(answer);
  const e = normalize(expected);
  if (!a) return 'wrong';
  if (a === e) return 'exact';
  // Acronyms and short words must be exact; "CI/CD" ~ "ci cd".
  if (a.replace(/ /g, '') === e.replace(/ /g, '')) return 'exact';
  const allowed = e.length <= 4 ? 0 : e.length <= 10 ? 1 : 2;
  return levenshtein(a, e) <= allowed ? 'typo' : 'wrong';
}

/** Share (0..1) of the expected words found in a spoken transcript, in any order. */
export function spokenScore(transcript: string, expected: string): number {
  const said = new Set(normalize(transcript).split(' ').filter(Boolean));
  const words = normalize(expected).split(' ').filter(Boolean);
  if (!words.length) return 0;
  const near = (w: string) => said.has(w) || [...said].some((s) => s.length > 3 && w.length > 3 && levenshtein(s, w) <= 1);
  return words.filter(near).length / words.length;
}

export const SPOKEN_PASS = 0.7;

/** Splits a sentence into tiles for the word-order exercise (punctuation stays on its word). */
export const tiles = (sentence: string) => sentence.split(/\s+/).filter(Boolean);
