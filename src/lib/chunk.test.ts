import { describe, expect, it } from 'vitest';
import { chunkSentences } from './chunk';

describe('chunkSentences', () => {
  it('returns nothing for empty text', () => {
    expect(chunkSentences('   ')).toEqual([]);
  });
  it('keeps short text in one chunk', () => {
    expect(chunkSentences('Une phrase. Une autre.')).toEqual(['Une phrase. Une autre.']);
  });
  it('groups whole sentences without exceeding the limit', () => {
    const s = 'A'.repeat(100) + '.';
    const chunks = chunkSentences(`${s} ${s} ${s}`, 220);
    expect(chunks).toHaveLength(2);
    expect(chunks.every((c) => c.length <= 220)).toBe(true);
  });
  it('never splits inside a long sentence', () => {
    const long = 'B'.repeat(300) + '.';
    expect(chunkSentences(long, 220)).toEqual([long]);
  });
});
