import { describe, expect, it } from 'vitest';
import type { Term } from '@/content/schema';
import { buildOrderItems, isSameOrder, scramble, tokenize } from '@/learning/order';

const term = (id: string, ...sentences: string[]): Term => ({
  id, term_en: id, sentences: sentences.map((text_en, i) => ({ id: `${id}-${i}`, text_en, text_fr: 'fr' }))
}) as unknown as Term;

describe('sentence order game', () => {
  it('compares word order and ignores capitalisation', () => {
    expect(isSameOrder(['The', 'API', 'fails'], ['the', 'api', 'FAILS'])).toBe(true);
    expect(isSameOrder(['API', 'The', 'fails'], ['The', 'API', 'fails'])).toBe(false);
  });

  it('never returns the right order from a scramble', () => {
    const words = tokenize('We deploy on Friday afternoon');
    for (let i = 0; i < 100; i++) {
      expect(isSameOrder(scramble(words).map((c) => c.text), words)).toBe(false);
    }
  });

  it('keeps every word exactly once, even when a word repeats', () => {
    const words = tokenize('the cat and the dog');
    const s = scramble(words);
    expect(s.map((c) => c.id).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(s.map((c) => c.text).sort()).toEqual([...words].sort());
  });

  it('only picks sentences of 4 to 11 words, one per term, without duplicates', () => {
    const pool = [
      term('a', 'Too short', 'We deploy on Friday afternoon'),
      term('b', 'We deploy on Friday afternoon', 'One two three four five six seven eight nine ten eleven twelve'),
      term('c', 'Please review my pull request today')
    ];
    const items = buildOrderItems(pool, 5);
    expect(items.map((i) => i.sentence).sort()).toEqual(['Please review my pull request today', 'We deploy on Friday afternoon']);
    expect(new Set(items.map((i) => i.termId)).size).toBe(items.length);
  });
});
