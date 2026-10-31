// Spaced repetition with FSRS (ts-fsrs, MIT). Cards are stored as plain JSON (FsrsCard) and
// converted to ts-fsrs objects only when scheduling.
import { type Card, createEmptyCard, fsrs, generatorParameters, type Grade, Rating, State } from 'ts-fsrs';
import type { FsrsCard, UserTerm } from '@/db/db';

export type ReviewRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export const DEFAULT_RETENTION = 0.9;
/** A word counts as mastered once FSRS expects it to stay remembered for three weeks or more. */
export const MASTERED_STABILITY_DAYS = 21;

const schedulers = new Map<number, ReturnType<typeof fsrs>>();
function scheduler(retention: number) {
  const r = Math.min(0.97, Math.max(0.7, retention));
  let s = schedulers.get(r);
  if (!s) { s = fsrs(generatorParameters({ request_retention: r, enable_fuzz: false })); schedulers.set(r, s); }
  return s;
}

const toCard = (c: FsrsCard): Card => ({
  due: new Date(c.due),
  stability: c.stability,
  difficulty: c.difficulty,
  scheduled_days: c.scheduledDays,
  learning_steps: c.learningSteps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state as State,
  last_review: c.lastReview ? new Date(c.lastReview) : undefined
});

const fromCard = (c: Card): FsrsCard => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  scheduledDays: c.scheduled_days,
  learningSteps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  ...(c.last_review ? { lastReview: c.last_review.toISOString() } : {})
});

export function stateOf(card: FsrsCard | null): UserTerm['state'] {
  if (!card || card.reps === 0) return 'new';
  return card.state === State.Review && card.stability >= MASTERED_STABILITY_DAYS ? 'mastered' : 'learning';
}

/** Applies one review and returns the new card. */
export function review(card: FsrsCard | null, rating: ReviewRating, now = new Date(), retention = DEFAULT_RETENTION): FsrsCard {
  const current = card ? toCard(card) : createEmptyCard(now);
  return fromCard(scheduler(retention).next(current, now, rating as Grade).card);
}

/** Replays a full review history (used after merging backups from two phones). */
export function replay(history: { rating: ReviewRating; reviewedAt: string }[], retention = DEFAULT_RETENTION): FsrsCard | null {
  return [...history]
    .sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt))
    .reduce<FsrsCard | null>((card, h) => review(card, h.rating, new Date(h.reviewedAt), retention), null);
}

export const isDue = (card: FsrsCard | null, now = new Date()) => !!card && new Date(card.due) <= now;

/**
 * Turns a lesson's results into an FSRS rating: the quiz carries most of the weight,
 * the spoken repetition (when available) nudges it.
 */
export function ratingFromLesson(quizRatio: number, speakScore?: number | null): ReviewRating {
  const speak = speakScore == null ? quizRatio : speakScore / 10;
  const s = quizRatio * 0.75 + speak * 0.25;
  if (s < 0.5) return Rating.Again as ReviewRating;
  if (s < 0.75) return Rating.Hard as ReviewRating;
  if (s < 0.98) return Rating.Good as ReviewRating; // "Easy" needs a near-perfect lesson
  return Rating.Easy as ReviewRating;
}
