// Grading of free answers (typed or spoken). Pure functions, unit tested.
import { matchWords } from './compare';

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
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

const letters = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');

/** True when the one-word `short` abbreviates the multi-word `long` ("MCP" / "Model Context Protocol"). */
function abbreviates(short: string, long: string): boolean {
  if (/\s/.test(short.trim()) || !/\s/.test(long.trim())) return false;
  const s = letters(short);
  const l = letters(long);
  if (s.length < 2 || s[0] !== l[0]) return false;
  let k = 0;
  for (const c of l) if (c === s[k]) k++;
  return k === s.length;
}

/** "SSL/TLS" or "closed won / closed lost": each side is a valid answer. "A/B test", "CI/CD pipeline" stay whole. */
function slashSides(form: string): string[] {
  const f = form.trim();
  if (/\s\/\s/.test(f)) return f.split(/\s+\/\s+/).map((x) => x.trim()).filter(Boolean);
  if (/^[^\s/]+(\/[^\s/]+)+$/.test(f)) {
    const sides = f.split('/');
    if (sides.every((x) => letters(x).length >= 3)) return sides;
  }
  return [];
}

/**
 * Every spelling accepted for a term: the full form, the part before a parenthesis,
 * the content of the parenthesis when it is the acronym or the expansion of that part
 * ("MCP (Model Context Protocol)"; a context note like "tag (on social media)" is not an answer),
 * and each side of a slash ("SSL/TLS").
 */
export function termForms(term: string): string[] {
  const full = term.trim();
  const forms = [full];
  const m = /^(.*?)\s*\(([^()]+)\)\s*(.*)$/.exec(full);
  if (m) {
    const before = [m[1]!.trim(), m[3]!.trim()].filter(Boolean).join(' ');
    const inner = m[2]!.trim();
    if (before) forms.push(before);
    if (before && (abbreviates(inner, before) || abbreviates(before, inner))) forms.push(inner);
  }
  for (const f of [...forms]) forms.push(...slashSides(f));
  return [...new Set(forms)];
}

/** Grades a typed term against all its accepted forms (best grade wins). */
export function gradeTerm(answer: string, term: string): Grade {
  let best: Grade = 'wrong';
  for (const f of termForms(term)) {
    const g = gradeTyped(answer, f);
    if (g === 'exact') return g;
    if (g === 'typo') best = g;
  }
  return best;
}

/** What text-to-speech reads for a term: the part before any parenthesis. */
export function spokenForm(term: string): string {
  const s = term.replace(/\s*\([^()]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return s || term.trim();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Hides the answer in a hint (any accepted form, any case) behind "…". */
export function maskTerm(text: string, term: string): string {
  const forms = termForms(term).filter((f) => letters(f).length >= 2).sort((a, b) => b.length - a.length);
  let out = text;
  for (const f of forms) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(f).replace(/\s+/g, '\\s+')}(?=[^\\p{L}\\p{N}]|$)`, 'giu');
    out = out.replace(re, '$1…');
  }
  return out;
}

/** Share (0..1) of the expected words found in a spoken transcript, in any order (contractions expanded). */
export function spokenScore(transcript: string, expected: string): number {
  const said = new Set(matchWords(transcript));
  const words = matchWords(expected);
  if (!words.length) return 0;
  const near = (w: string) => said.has(w) || [...said].some((s) => s.length > 3 && w.length > 3 && levenshtein(s, w) <= 1);
  return words.filter(near).length / words.length;
}

export const SPOKEN_PASS = 0.7;

/** Splits a sentence into tiles for the word-order exercise (punctuation stays on its word). */
export const tiles = (sentence: string) => sentence.split(/\s+/).filter(Boolean);
