import { describe, expect, it } from 'vitest';
import { buildChecks, type CheckLabels } from '@/learning/checks';

const labels: CheckLabels = { listen: 'Écoute', read: 'Comment dire', explain: (p) => `${p.en} = ${p.fr}` };
const pairs = [
  { en: 'Let me walk you through it', fr: 'Je vous explique pas à pas' },
  { en: 'Can you hear me?', fr: 'Vous m’entendez ?' },
  { en: 'I will follow up', fr: 'Je reviens vers vous' },
  { en: 'Sounds good', fr: 'Ça me va' }
];

describe('buildChecks', () => {
  it('builds questions whose answer index points at the right choice', () => {
    for (let n = 0; n < 30; n++) {
      const qs = buildChecks(pairs, 'u1', 4, labels);
      expect(qs).toHaveLength(4);
      for (const q of qs) {
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices).size).toBe(3);
        const p = pairs.find((x) => q.explanation === `${x.en} = ${x.fr}`)!;
        expect(q.choices[q.answer]).toBe(q.audio ? p.fr : p.en);
      }
    }
  });
  it('alternates listening and reading', () => {
    const qs = buildChecks(pairs, 'u1', 4, labels);
    expect(qs.map((q) => !!q.audio)).toEqual([true, false, true, false]);
  });
  it('returns nothing without enough distinct pairs', () => {
    expect(buildChecks(pairs.slice(0, 2), 'u1', 4, labels)).toEqual([]);
    expect(buildChecks([pairs[0]!, pairs[0]!, pairs[0]!], 'u1', 4, labels)).toEqual([]);
  });
});
