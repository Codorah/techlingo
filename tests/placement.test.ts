import { describe, expect, it } from 'vitest';
import type { Term } from '@/content/schema';
import { baseTerm, blankSentence, buildPlacementQuestion, cleanFr } from '@/learning/placement';

const term = (id: string, term_en: string, translation_fr: string, sentence: string, level: Term['level'] = 'B1'): Term => ({
  id, status: 'draft', level, roles: [{ role: 'web-developer', priority: 50 }], categories: ['api'], term_en, translation_fr,
  part_of_speech: 'noun', definition_en: 'x', explanation_fr: 'x', why_it_matters_fr: 'x', context_fr: [],
  sentences: [{ id: `${id}-s`, text_en: sentence, text_fr: 'x' }], common_mistakes: [], related_terms: [], quiz: []
} as unknown as Term);

const pool = [
  term('prompt', 'prompt', 'consigne (prompt)', 'Write a clear prompt for the model.'),
  term('token', 'token (LLM)', 'jeton (unité de texte)', 'Each token costs money.'),
  term('embedding', 'embedding', 'plongement vectoriel (embedding)', 'We store each embedding in the index.'),
  term('endpoint', 'endpoint', 'point de terminaison', 'The endpoint returns JSON.'),
  term('payload', 'payload', 'charge utile', 'The payload is too large.'),
  term('latency', 'latency', 'latence', 'High latency hurts the user.')
];

describe('placement questions', () => {
  it('removes the bracketed English term from French choices', () => {
    expect(cleanFr('consigne (prompt)')).toBe('consigne');
    expect(baseTerm('token (LLM)')).toBe('token');
  });

  it('never leaks the answer in a meaning question', () => {
    for (let i = 0; i < 30; i++) {
      const q = buildPlacementQuestion(pool, 'B1', new Set(), 0, Math.random)!;
      expect(q.kind).toBe('meaning');
      expect(q.choices).toHaveLength(4);
      expect(q.choices.every((c) => !c.includes('('))).toBe(true);
      expect(q.choices[q.answer]).toBe(cleanFr(q.term.translation_fr));
    }
  });

  it('blanks the term in a gap question and keeps 4 distinct English choices', () => {
    const q = buildPlacementQuestion(pool, 'B2', new Set(), 1)!;
    expect(q.kind).toBe('gap');
    if (q.kind !== 'gap') return;
    expect(q.sentence).toContain('_____');
    expect(q.sentence.toLowerCase()).not.toContain(baseTerm(q.term.term_en).toLowerCase());
    expect(new Set(q.choices).size).toBe(4);
    expect(q.choices[q.answer]).toBe(baseTerm(q.term.term_en));
  });

  it('returns null sentence when the term is absent', () => {
    expect(blankSentence('Nothing here', 'prompt')).toBeNull();
  });
});
