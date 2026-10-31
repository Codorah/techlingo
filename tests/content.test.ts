import { describe, expect, it } from 'vitest';
import { autoQuiz } from '@/content/autoQuiz';
import { QuizQuestion, Term } from '@/content/schema';
import { loadContent } from '../scripts/content/lib';

const base = {
  status: 'draft', level: 'B1', roles: [{ role: 'web-developer', priority: 50 }], categories: ['api'], part_of_speech: 'noun',
  definition_en: 'A definition.', explanation_fr: 'Une explication.', why_it_matters_fr: 'Parce que.'
} as const;
const mk = (id: string, term_en: string, translation_fr: string, sentence: string) =>
  Term.parse({ ...base, id, term_en, translation_fr, sentences: [{ id: `${id}-1`, text_en: sentence, text_fr: 'Phrase.' }] });

describe('content', () => {
  it('the repository content is valid (no schema or reference errors)', () => {
    const c = loadContent();
    expect(c.errors).toEqual([]);
    expect(c.terms.length).toBeGreaterThan(0);
  });

  it('a validated term needs 2 sentences and 3 questions', () => {
    const r = Term.safeParse({ ...base, status: 'validated', id: 'x', term_en: 'X', translation_fr: 'X', sentences: [{ id: 'x-1', text_en: 'One.', text_fr: 'Un.' }] });
    expect(r.success).toBe(false);
  });

  it('a deprecated term needs replacedBy', () => {
    const r = Term.safeParse({ ...mk('old', 'Old', 'Ancien', 'Old one.'), status: 'deprecated' });
    expect(r.success).toBe(false);
  });

  it('auto quiz builds valid, deterministic questions from the term itself', () => {
    const pool = [
      mk('webhook', 'Webhook', 'Rappel HTTP', 'We added a webhook for payments.'),
      mk('payload', 'Payload', 'Charge utile', 'The payload is JSON.'),
      mk('endpoint', 'Endpoint', 'Point de terminaison', 'Call the endpoint.'),
      mk('rest-api', 'REST API', 'API REST', 'Our REST API is versioned.')
    ];
    const q = autoQuiz(pool[0]!, pool);
    expect(q.map((x) => x.type)).toEqual(['mcq', 'fill_gap', 'mcq', 'speak_it']);
    q.forEach((x) => expect(QuizQuestion.safeParse(x).success).toBe(true));
    const gap = q[1]!;
    if (gap.type === 'fill_gap') expect(gap.payload.sentence_en).toBe('We added a ___ for payments.');
    expect(autoQuiz(pool[0]!, pool)).toEqual(q);
  });
});
