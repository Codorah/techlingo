// "Remets la phrase dans l'ordre": real example sentences of the learner's words, cut into words.
// Nothing is invented: each item is a sentence already shipped with a term.
import type { Term } from '@/content/schema';
import { shuffle } from './practice';

export interface OrderItem { id: string; termId: string; sentence: string; fr: string; words: string[] }
export interface Chip { id: number; text: string }

export const ORDER = { minWords: 4, maxWords: 11, perSession: 5, retries: 1 } as const;

export const tokenize = (sentence: string) => sentence.trim().split(/\s+/).filter(Boolean);

/** Same words in the same order, ignoring capitalisation. */
export const isSameOrder = (given: string[], target: string[]) =>
  given.length === target.length && given.every((w, i) => w.toLowerCase() === target[i]!.toLowerCase());

/** A shuffle that is never already the right order. */
export function scramble(words: string[], random = Math.random): Chip[] {
  const chips = words.map((text, id) => ({ id, text }));
  if (words.length < 2) return chips;
  for (let i = 0; i < 12; i++) {
    const s = shuffle(chips, random);
    if (!isSameOrder(s.map((c) => c.text), words)) return s;
  }
  return [...chips].reverse();
}

export function buildOrderItems(pool: Term[], count: number = ORDER.perSession, random = Math.random): OrderItem[] {
  const out: OrderItem[] = [];
  const seen = new Set<string>();
  for (const term of shuffle(pool, random)) {
    const s = shuffle(term.sentences, random).find((x) => {
      const n = tokenize(x.text_en).length;
      return n >= ORDER.minWords && n <= ORDER.maxWords && !seen.has(x.text_en);
    });
    if (!s) continue;
    seen.add(s.text_en);
    out.push({ id: `order-${term.id}-${s.id}`, termId: term.id, sentence: s.text_en, fr: s.text_fr, words: tokenize(s.text_en) });
    if (out.length >= count) break;
  }
  return out;
}
