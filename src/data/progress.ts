// Reads and writes the learner's progress in the local database. Screens call these
// functions; the scheduling and selection rules live in src/learning (pure, tested).
import type { Level } from '@/content/schema';
import { db, getDeviceId, nowIso, type Profile, type UserTerm, uuid } from '@/db/db';
import { DEFAULT_RETENTION, ratingFromLesson, review, stateOf } from '@/learning/srs';
import { localDay, recordActivity } from '@/learning/streak';

export const XP = { lessonBase: 20, perCorrect: 10, speaking: 10, review: 5 } as const;

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get('me');
}

export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const deviceId = await getDeviceId();
  const now = nowIso();
  const current = await db.profile.get('me');
  const next: Profile = {
    id: 'me', displayName: '', avatar: 'sky', primaryRole: null, secondaryRoles: [], level: null, goal: null,
    dailyMinutes: 5, reminderTime: null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, xp: 0, streak: 0,
    bestStreak: 0, lastActiveDay: null, streakFreezes: 0, onboardedAt: null, createdAt: now,
    ...current, ...patch, updatedAt: now, deviceId
  };
  await db.profile.put(next);
  return next;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}
export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value, updatedAt: nowIso() });
}
export const getRetention = () => getSetting('retention', DEFAULT_RETENTION);

// ---------------------------------------------------------------------------
// Daily Spin
// ---------------------------------------------------------------------------
export interface SpinStatus { freeAvailable: boolean; bonusAvailable: boolean; todaysTermId: string | null }

export async function spinStatus(today = localDay()): Promise<SpinStatus> {
  const spins = (await db.spins.where('day').equals(today).toArray()).filter((s) => !s.deletedAt);
  const free = spins.find((s) => !s.isBonus);
  const bonusUsed = spins.some((s) => s.isBonus);
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString(); // generous: local day vs UTC
  const lessonsToday = (await db.lessonSessions.where('startedAt').aboveOrEqual(since).toArray())
    .filter((l) => l.completedAt && localDay(new Date(l.completedAt)) === today);
  return {
    freeAvailable: !free,
    bonusAvailable: !!free && !bonusUsed && lessonsToday.length > 0, // bonus spin after a finished lesson
    todaysTermId: spins.sort((a, b) => b.spunAt.localeCompare(a.spunAt))[0]?.termId ?? null
  };
}

export async function recentSpins(days = 3) {
  const since = localDay(new Date(Date.now() - days * 86_400_000));
  return (await db.spins.where('day').aboveOrEqual(since).toArray()).map((s) => ({ termId: s.termId, day: s.day }));
}

export async function recordSpin(termId: string, mode: 'random' | 'category', category: string | undefined, isBonus: boolean) {
  const deviceId = await getDeviceId();
  const now = nowIso();
  await db.spins.put({ id: uuid(), termId, mode, ...(category ? { category } : {}), day: localDay(), spunAt: now, isBonus, updatedAt: now, deviceId });
}

// ---------------------------------------------------------------------------
// Progress per word
// ---------------------------------------------------------------------------
export async function progressMap(): Promise<Map<string, UserTerm>> {
  const rows = await db.userTerms.toArray();
  return new Map(rows.filter((r) => !r.deletedAt).map((r) => [r.termId, r]));
}

export async function dueTermIds(now = new Date()): Promise<string[]> {
  const rows = await db.userTerms.where('card.due').belowOrEqual(now.toISOString()).toArray();
  return rows.filter((r) => !r.deletedAt && r.card).map((r) => r.termId);
}

export async function startLesson(termId: string): Promise<string> {
  const deviceId = await getDeviceId();
  const now = nowIso();
  const id = uuid();
  await db.lessonSessions.put({ id, termId, step: 0, score: null, xpEarned: 0, startedAt: now, updatedAt: now, deviceId });
  return id;
}

export async function saveLessonStep(sessionId: string, step: number) {
  await db.lessonSessions.update(sessionId, { step, updatedAt: nowIso() });
}

export async function logQuizAttempt(termId: string, questionId: string, correct: boolean, response: unknown) {
  const deviceId = await getDeviceId();
  const now = nowIso();
  await db.quizAttempts.put({ id: uuid(), termId, questionId, correct, response, createdAt: now, updatedAt: now, deviceId });
}

export async function logSpeakingAttempt(a: { termId: string; sentenceId: string; transcript: string; score: number; recognizedRatio: number; selfRated?: 'easy' | 'hard' }) {
  const deviceId = await getDeviceId();
  const now = nowIso();
  await db.speakingAttempts.put({ id: uuid(), ...a, createdAt: now, updatedAt: now, deviceId });
}

export interface LessonOutcome { xp: number; nextDue: string; state: UserTerm['state']; firstTime: boolean; usedFreeze: boolean }

/** Ends a lesson: schedules the word with FSRS, logs the review, awards XP and updates the streak. */
export async function completeLesson(sessionId: string, termId: string, quizCorrect: number, quizTotal: number, speakScore: number | null): Promise<LessonOutcome> {
  const deviceId = await getDeviceId();
  const now = new Date();
  const iso = now.toISOString();
  const retention = await getRetention();
  const rating = ratingFromLesson(quizTotal ? quizCorrect / quizTotal : 0, speakScore);

  return db.transaction('rw', [db.userTerms, db.reviewLog, db.profile, db.lessonSessions], async () => {
    const existing = await db.userTerms.get(termId);
    const card = review(existing?.card ?? null, rating, now, retention);
    const xp = XP.lessonBase + quizCorrect * XP.perCorrect + (speakScore != null ? XP.speaking : 0);
    await db.reviewLog.put({ id: uuid(), termId, rating, reviewedAt: iso, cardBefore: existing?.card ?? null, updatedAt: iso, deviceId });
    await db.userTerms.put({ termId, card, state: stateOf(card), favorite: existing?.favorite ?? false, notes: existing?.notes ?? '', updatedAt: iso, deviceId });
    await db.lessonSessions.update(sessionId, { completedAt: iso, score: quizTotal ? quizCorrect / quizTotal : null, xpEarned: xp, updatedAt: iso });

    const profile = await db.profile.get('me');
    let usedFreeze = false;
    if (profile) {
      const s = recordActivity(profile, localDay(now));
      usedFreeze = s.usedFreeze;
      await db.profile.put({ ...profile, xp: profile.xp + xp, streak: s.streak, bestStreak: s.bestStreak, lastActiveDay: s.lastActiveDay, streakFreezes: s.streakFreezes, updatedAt: iso, deviceId });
    }
    return { xp, nextDue: card.due, state: stateOf(card), firstTime: !existing?.card, usedFreeze };
  });
}

export async function toggleFavorite(termId: string) {
  const deviceId = await getDeviceId();
  const existing = await db.userTerms.get(termId);
  await db.userTerms.put({
    termId, card: existing?.card ?? null, state: existing?.state ?? 'new', notes: existing?.notes ?? '',
    favorite: !existing?.favorite, updatedAt: nowIso(), deviceId
  });
}

export const LEVEL_LABELS: Record<Level, string> = { A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire', B2: 'Avancé', C1: 'Expert' };
