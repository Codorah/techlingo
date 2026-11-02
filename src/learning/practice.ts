// Builds practice sessions from validated content only (spec §5.6): no question is invented,
// listening items reuse a term's own example sentence.
import type { Term } from '@/content/schema';
import type { Playable } from '@/screens/lesson/QuizStep';
import { toPlayable } from '@/screens/lesson/QuizStep';

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Words to practise: learned words first, topped up with the user's role words. */
export function practicePool(terms: Term[], learnedIds: Set<string>, min = 8): Term[] {
  const learned = terms.filter((t) => learnedIds.has(t.id));
  if (learned.length >= min) return learned;
  return [...learned, ...shuffle(terms.filter((t) => !learnedIds.has(t.id))).slice(0, min - learned.length)];
}

export function listeningItem(term: Term, pool: Term[], prompt: string, random = Math.random): Playable | null {
  const sentence = term.sentences[0];
  if (!sentence) return null;
  const others = shuffle(pool.filter((t) => t.id !== term.id && !sentence.text_en.toLowerCase().includes(t.term_en.toLowerCase())), random).slice(0, 3);
  if (others.length < 2) return null;
  const choices = shuffle([term.term_en, ...others.map((o) => o.term_en)], random);
  return { id: `listen-${term.id}`, termId: term.id, prompt, audio: sentence.text_en, choices, answer: choices.indexOf(term.term_en), explanation: `${sentence.text_en} (${sentence.text_fr})` };
}

export function quizItem(term: Term, fillGapLabel: string, random = Math.random): Playable | null {
  const playable = shuffle(term.quiz, random).map((q) => toPlayable(q, fillGapLabel)).find((q) => !!q);
  return playable ? { ...playable, termId: term.id } : null;
}

/** Daily challenge: alternates quiz questions and listening items. */
export function buildChallenge(pool: Term[], labels: { fillGap: string; listen: string }, count = 6): Playable[] {
  const out: Playable[] = [];
  for (const [i, term] of shuffle(pool).entries()) {
    const item = i % 3 === 2 ? listeningItem(term, pool, labels.listen) : quizItem(term, labels.fillGap);
    if (item) out.push(item);
    if (out.length >= count) break;
  }
  return out;
}

export function buildListening(pool: Term[], prompt: string, count = 6): Playable[] {
  return shuffle(pool).map((t) => listeningItem(t, pool, prompt)).filter((x): x is Playable => !!x).slice(0, count);
}
