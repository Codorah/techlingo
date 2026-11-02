// Adaptive placement test (spec §5.1): 10 questions, a staircase that moves one level up
// after a correct answer and one down after a mistake. The result is the level where the
// user answered correctly at least twice, starting from the top.
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';

export const PLACEMENT_QUESTIONS = 10;
export const PLACEMENT_START: Level = 'B1';

export interface PlacementAnswer { level: Level; correct: boolean }

export function nextPlacementLevel(current: Level, correct: boolean): Level {
  const i = LEVELS.indexOf(current) + (correct ? 1 : -1);
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))]!;
}

export function placementResult(answers: PlacementAnswer[]): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i]!;
    const correctHere = answers.filter((a) => a.level === level && a.correct).length;
    if (correctHere >= 2) return level;
  }
  return answers.some((a) => a.correct) ? 'A2' : 'A1';
}

/** Picks a not-yet-asked term at the requested level, falling back to the closest level. */
export function pickPlacementTerm(terms: Term[], level: Level, asked: Set<string>, random = Math.random): Term | null {
  const order = [...LEVELS].sort((a, b) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(level)) - Math.abs(LEVELS.indexOf(b) - LEVELS.indexOf(level)));
  for (const l of order) {
    const pool = terms.filter((t) => t.level === l && !asked.has(t.id));
    if (pool.length) return pool[Math.floor(random() * pool.length)]!;
  }
  return null;
}

// ── Questions without a giveaway ─────────────────────────────────────────────
// French translations often carry the English term in brackets ("consigne (prompt)"), which
// answers the question by itself. Choices are cleaned, and distractors come from the same
// category and part of speech, so the right one cannot be guessed from its look.

export type PlacementQuestion =
  | { kind: 'meaning'; term: Term; choices: string[]; answer: number }
  | { kind: 'gap'; term: Term; sentence: string; choices: string[]; answer: number };

/** Removes bracketed glosses, which usually repeat the English term. */
export const cleanFr = (s: string) => {
  // Also drops all-caps acronyms ("message météo régulier METAR"), which repeat the English term.
  const cleaned = s.replace(/\s*\([^)]*\)/g, '').replace(/(^|\s)[A-Z]{2,}(?=\s|$)/g, '$1').replace(/\s+/g, ' ').trim();
  return cleaned.length >= 3 ? cleaned : s.replace(/\s*\([^)]*\)/g, '').trim();
};
/** "token (LLM)" -> "token". */
export const baseTerm = (s: string) => s.replace(/\s*\([^)]*\)/g, '').trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const shuffle = <T,>(a: T[], random: () => number) => a.map((x) => [random(), x] as const).sort((x, y) => x[0] - y[0]).map(([, x]) => x);

/** Same category and part of speech first, then closest in level, then closest in length. */
function distractors(terms: Term[], term: Term, text: (t: Term) => string, n: number, random: () => number): Term[] {
  const mine = text(term).toLowerCase();
  const seen = new Set<string>([mine]);
  const score = (t: Term) =>
    (t.categories.some((c) => term.categories.includes(c)) ? 0 : 4)
    + (t.part_of_speech === term.part_of_speech ? 0 : 2)
    + Math.abs(LEVELS.indexOf(t.level) - LEVELS.indexOf(term.level))
    + Math.abs(text(t).length - text(term).length) / 20;
  const ranked = terms
    .filter((t) => t.id !== term.id && t.status !== 'deprecated')
    .map((t) => ({ t, s: score(t) + random() * 0.5 }))
    .sort((a, b) => a.s - b.s);
  const out: Term[] = [];
  for (const { t } of ranked) {
    const key = text(t).toLowerCase();
    if (!key || seen.has(key) || key.includes(mine) || mine.includes(key)) continue;
    seen.add(key); out.push(t);
    if (out.length === n) break;
  }
  return out;
}

/** The sentence with the term replaced by a blank, or null when the term is not in it as is. */
export function blankSentence(sentence: string | undefined, term: string): string | null {
  if (!sentence) return null;
  const re = new RegExp(`\\b${escapeRe(baseTerm(term))}\\b`, 'i');
  return re.test(sentence) ? sentence.replace(re, '_____') : null;
}

/** `index` alternates the question types; from B2 up, filling a gap in a sentence is asked more. */
export function buildPlacementQuestion(terms: Term[], level: Level, asked: Set<string>, index: number, random = Math.random): PlacementQuestion | null {
  const term = pickPlacementTerm(terms, level, asked, random);
  if (!term) return null;
  const preferGap = index % 2 === 1 || LEVELS.indexOf(level) >= LEVELS.indexOf('B2');
  const sentence = preferGap ? blankSentence(term.sentences[0]?.text_en, term.term_en) : null;
  if (sentence) {
    const others = distractors(terms, term, (t) => baseTerm(t.term_en), 3, random);
    if (others.length === 3 && !others.some((o) => blankSentence(term.sentences[0]?.text_en, o.term_en))) {
      const choices = shuffle([baseTerm(term.term_en), ...others.map((o) => baseTerm(o.term_en))], random);
      return { kind: 'gap', term, sentence, choices, answer: choices.indexOf(baseTerm(term.term_en)) };
    }
  }
  const right = cleanFr(term.translation_fr);
  const others = distractors(terms.filter((t) => cleanFr(t.translation_fr).toLowerCase() !== right.toLowerCase()), term, (t) => cleanFr(t.translation_fr), 3, random);
  if (others.length < 3) return null;
  const choices = shuffle([right, ...others.map((o) => cleanFr(o.translation_fr))], random);
  return { kind: 'meaning', term, choices, answer: choices.indexOf(right) };
}
