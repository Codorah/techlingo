import { describe, expect, it } from 'vitest';
import { Term } from '@/content/schema';
import { compareSentence } from '@/learning/compare';
import { nextPlacementLevel, placementResult } from '@/learning/placement';
import { DEFAULT_RETENTION, isDue, ratingFromLesson, replay, review, stateOf } from '@/learning/srs';
import { daysAway, displayedStreak, recordActivity } from '@/learning/streak';
import { pickSpinTerm, roleCategories, spinCandidates } from '@/learning/wheel';

const DAY = 86_400_000;
const t0 = new Date('2026-10-01T09:00:00Z');

describe('FSRS scheduling', () => {
  it('a new word reviewed "Good" is scheduled later than one reviewed "Again"', () => {
    const good = review(null, 3, t0);
    const again = review(null, 1, t0);
    expect(new Date(good.due).getTime()).toBeGreaterThan(new Date(again.due).getTime());
    expect(stateOf(good)).toBe('learning');
    expect(stateOf(null)).toBe('new');
  });

  it('a failed word comes back soon and counts a lapse', () => {
    let card = review(null, 3, t0);
    card = review(card, 3, new Date(card.due));
    card = review(card, 4, new Date(card.due));
    const lapsesBefore = card.lapses;
    const failed = review(card, 1, new Date(card.due));
    expect(failed.lapses).toBe(lapsesBefore + 1);
    expect(new Date(failed.due).getTime() - new Date(card.due).getTime()).toBeLessThan(DAY);
  });

  it('after a 30-day break the word is due, and a success still grows the interval', () => {
    let card = review(null, 3, t0);
    card = review(card, 3, new Date(card.due));
    const late = new Date(new Date(card.due).getTime() + 30 * DAY);
    expect(isDue(card, late)).toBe(true);
    const after = review(card, 3, late);
    expect(after.scheduledDays).toBeGreaterThan(card.scheduledDays);
  });

  it('a higher desired retention schedules reviews sooner', () => {
    let card = review(null, 3, t0);
    card = review(card, 3, new Date(card.due));
    const at = new Date(card.due);
    const strict = review(card, 3, at, 0.95);
    const relaxed = review(card, 3, at, 0.8);
    expect(new Date(strict.due).getTime()).toBeLessThan(new Date(relaxed.due).getTime());
    expect(DEFAULT_RETENTION).toBe(0.9);
  });

  it('replaying a history gives the same card as reviewing step by step', () => {
    const a = review(null, 3, t0);
    const b = review(a, 4, new Date(a.due));
    const replayed = replay([{ rating: 4, reviewedAt: new Date(a.due).toISOString() }, { rating: 3, reviewedAt: t0.toISOString() }]);
    expect(replayed).toEqual(b);
  });

  it('maps lesson results to a rating', () => {
    expect(ratingFromLesson(0)).toBe(1);
    expect(ratingFromLesson(2 / 3)).toBe(2);
    expect(ratingFromLesson(1, 8)).toBe(3);
    expect(ratingFromLesson(1, 10)).toBe(4);
  });
});

describe('sentence comparison (speaking)', () => {
  it('scores a perfect transcript 10/10, ignoring case and punctuation', () => {
    const r = compareSentence('We deploy to production every Friday.', 'we deploy to production every friday');
    expect(r.score).toBe(10);
    expect(r.words.every((w) => w.recognized)).toBe(true);
  });

  it('marks missed words and expands contractions', () => {
    const r = compareSentence("It's a REST API for the mobile app.", 'it is a rest api for the app');
    expect(r.words.find((w) => w.word === 'mobile')?.recognized).toBe(false);
    expect(r.words.find((w) => w.word === "It's")?.recognized).toBe(true);
    expect(r.score).toBe(9);
  });

  it('tolerates a one-letter slip on long words', () => {
    expect(compareSentence('The deployment failed.', 'the deployments failed').score).toBe(10);
  });

  it('gives 0 for an empty transcript', () => {
    expect(compareSentence('Hello world', '').score).toBe(0);
  });
});

describe('streak', () => {
  const base = { streak: 4, bestStreak: 6, lastActiveDay: '2026-10-30', streakFreezes: 0 };
  it('continues the next day, keeps it the same day', () => {
    expect(recordActivity(base, '2026-10-31').streak).toBe(5);
    expect(recordActivity(base, '2026-10-30').streak).toBe(4);
  });
  it('uses a freeze for one missed day, resets after more', () => {
    const r = recordActivity({ ...base, streakFreezes: 1 }, '2026-11-01');
    expect(r.streak).toBe(5);
    expect(r.usedFreeze).toBe(true);
    expect(recordActivity(base, '2026-11-03').streak).toBe(1);
  });
  it('never punishes a clock that went backwards', () => {
    expect(recordActivity(base, '2026-10-20')).toMatchObject({ streak: 4, lastActiveDay: '2026-10-30' });
  });
  it('displays 0 after a long break and counts days away', () => {
    expect(displayedStreak(base, '2026-11-05')).toBe(0);
    expect(daysAway(base, '2026-11-05')).toBe(6);
  });
});

describe('placement test', () => {
  it('moves up after a correct answer and down after a mistake, within bounds', () => {
    expect(nextPlacementLevel('B1', true)).toBe('B2');
    expect(nextPlacementLevel('A1', false)).toBe('A1');
    expect(nextPlacementLevel('C1', true)).toBe('C1');
  });
  it('returns the highest level answered correctly twice', () => {
    expect(placementResult([
      { level: 'B1', correct: true }, { level: 'B2', correct: true }, { level: 'C1', correct: false },
      { level: 'B2', correct: true }, { level: 'C1', correct: false }, { level: 'B2', correct: false }
    ])).toBe('B2');
    expect(placementResult([{ level: 'B1', correct: false }, { level: 'A2', correct: false }])).toBe('A1');
  });
});

describe('daily spin selection', () => {
  const mk = (id: string, level: 'A2' | 'B1' | 'C1', role: string, cats: string[], priority = 50) => Term.parse({
    id, level, status: 'draft', roles: [{ role, priority }], categories: cats, term_en: id, translation_fr: id, part_of_speech: 'noun',
    definition_en: 'Definition.', explanation_fr: 'Explication.', why_it_matters_fr: 'Parce que.', sentences: [{ id: `${id}-1`, text_en: 'One sentence.', text_fr: 'Une phrase.' }]
  });
  const terms = [
    mk('rest-api', 'A2', 'web-developer', ['api']), mk('webhook', 'B1', 'web-developer', ['api']),
    mk('css-grid', 'A2', 'web-developer', ['frontend']), mk('sharding', 'C1', 'web-developer', ['databases']),
    mk('kotlin', 'A2', 'mobile-developer', ['mobile-platforms']), mk('firewall', 'A2', 'cybersecurity', ['security'])
  ];
  const base = { terms, progress: new Map(), primaryRole: 'web-developer', secondaryRoles: ['mobile-developer'], level: 'A2' as const, recentSpins: [], today: '2026-10-31', now: new Date('2026-10-31T10:00:00Z') };

  it('only picks words of the user’s roles, up to one level above', () => {
    const ids = spinCandidates(base).filter((c) => c.weight > 0).map((c) => c.term.id);
    expect(ids.sort()).toEqual(['css-grid', 'kotlin', 'rest-api', 'webhook']);
  });

  it('never repeats yesterday’s word', () => {
    const ids = spinCandidates({ ...base, recentSpins: [{ termId: 'rest-api', day: '2026-10-30' }] }).filter((c) => c.weight > 0).map((c) => c.term.id);
    expect(ids).not.toContain('rest-api');
  });

  it('category mode stays inside the category', () => {
    for (let i = 0; i < 20; i++) expect(pickSpinTerm({ ...base, category: 'api', random: () => i / 20 })?.categories).toContain('api');
  });

  it('prefers new words over learning words that are not due, and skips recently mastered ones', () => {
    const future = new Date('2026-11-20T00:00:00Z').toISOString();
    const progress = new Map([
      ['rest-api', { state: 'learning' as const, card: { due: future, stability: 3, difficulty: 5, scheduledDays: 20, learningSteps: 0, reps: 3, lapses: 0, state: 2 } }],
      ['webhook', { state: 'mastered' as const, card: { due: future, stability: 40, difficulty: 4, scheduledDays: 40, learningSteps: 0, reps: 6, lapses: 0, state: 2, lastReview: '2026-10-25T10:00:00Z' } }]
    ]);
    const c = Object.fromEntries(spinCandidates({ ...base, progress }).map((x) => [x.term.id, x.weight]));
    expect(c['css-grid']!).toBeGreaterThan(c['rest-api']!);
    expect(c.webhook).toBe(0);
  });

  it('lists the categories of the user’s roles', () => {
    expect(roleCategories(terms, ['web-developer']).map((c) => c.id)).toEqual(['api', 'frontend', 'databases']);
  });
});
