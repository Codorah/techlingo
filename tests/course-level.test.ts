import { describe, expect, it } from 'vitest';
import type { ShippedPath } from '@/content/schema';
import { unitLevel, unitsForLevel } from '@/learning/course';

const terms = { a: { id: 'a', level: 'A2' }, b: { id: 'b', level: 'B1' }, c: { id: 'c', level: 'B2' }, d: { id: 'd', level: 'C1' } } as unknown as ShippedPath['terms'];
const unit = (id: string, ids: string[]) => ({ id, lessons: [{ term_ids: ids }] }) as unknown as ShippedPath['units'][number];
const units = [unit('u1', ['a']), unit('u2', ['b']), unit('u3', ['c']), unit('u4', ['d']), unit('u5', ['d'])];

describe('course levels', () => {
  it('averages the levels of the words', () => {
    expect(unitLevel(unit('x', ['a', 'c']), terms)).toBe('B1');
  });
  it('keeps everything without a level', () => {
    expect(unitsForLevel(units, terms, null)).toHaveLength(5);
  });
  it('skips units two levels below the learner', () => {
    expect(unitsForLevel(units, terms, 'B2').map((x) => x.u.id)).toEqual(['u2', 'u3', 'u4', 'u5']);
    expect(unitsForLevel(units, terms, 'A2').map((x) => x.u.id)).toEqual(['u1', 'u2', 'u3', 'u4', 'u5']);
  });
  it('never leaves fewer than 3 units and keeps the hardest', () => {
    expect(unitsForLevel(units, terms, 'C1').map((x) => x.u.id)).toEqual(['u3', 'u4', 'u5']);
  });
});
