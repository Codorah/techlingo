// Comprehension checks built from content that already exists (key phrases, lesson words):
// no new content to write, and the distractors come from the same unit so they stay plausible.
import type { Playable } from '@/screens/lesson/QuizStep';

export type Pair = { en: string; fr: string };

const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

const norm = (s: string) => s.trim().toLowerCase();

export type CheckLabels = {
  /** Prompt of a "listen, then pick the French meaning" question. */
  listen: string;
  /** Prompt prefix of a "read the French, pick the English" question. */
  read: string;
  /** Written after the answer, in French, with the pair's English and French. */
  explain: (pair: Pair) => string;
};

/**
 * Up to `count` questions, alternating listening (audio → French meaning) and production-ish
 * recognition (French → English phrase). Returns [] when there are not enough distinct pairs
 * to build plausible wrong choices.
 */
export function buildChecks(pairs: Pair[], idPrefix: string, count: number, labels: CheckLabels, extraDistractors: Pair[] = []): Playable[] {
  const dedupe = (list: Pair[]) => list.filter((p, i) => list.findIndex((o) => norm(o.en) === norm(p.en)) === i);
  const distinct = dedupe(pairs);
  const pool = dedupe([...distinct, ...extraDistractors]);
  if (pool.length < 3) return [];
  return shuffle(distinct).slice(0, count).map((target, i): Playable => {
    const listening = i % 2 === 0;
    const key = listening ? 'fr' : 'en';
    const wrong = shuffle(pool.filter((p) => norm(p[key]) !== norm(target[key]))).slice(0, 2).map((p) => p[key]);
    const choices = shuffle([target[key], ...wrong]);
    return {
      id: `${idPrefix}-check${i}`,
      prompt: listening ? labels.listen : `${labels.read} « ${target.fr} »`,
      ...(listening ? { audio: target.en } : {}),
      choices,
      answer: choices.indexOf(target[key]),
      explanation: labels.explain(target)
    };
  });
}
